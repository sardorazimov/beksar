import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  SendHorizontal, 
  User, 
  Bot, 
  Wrench, 
  Check, 
  X, 
  Zap 
} from "lucide-react";

type ToolRequest = {
  name: string;
  input: string;
};

// Sohbet geçmişini tutmak için eklendi
type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
};

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(""); // Akan (stream) veri
  const [messages, setMessages] = useState<Message[]>([]); // Geçmiş mesajlar
  const [toolRequest, setToolRequest] = useState<ToolRequest | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Yeni mesaj geldiğinde veya stream aktığında otomatik aşağı kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, response]);

  // Kendi yazdığınız Tauri Listener mantığı (Sohbet geçmişi için hafifçe modifiye edildi)
  useEffect(() => {
    let unlistenChunk: UnlistenFn;
    let unlistenEnd: UnlistenFn;
    let unlistenTool: UnlistenFn;

    const setupListeners = async () => {
      unlistenChunk = await listen<string>("stream_chunk", (event) => {
        setResponse((prev) => prev + event.payload);
      });

      unlistenEnd = await listen("stream_end", () => {
        console.log("Stream finished");
        // Stream bittiğinde, biriken metni kalıcı mesajlar listesine aktar
        setResponse((prevResponse) => {
          if (prevResponse.trim()) {
            setMessages((prevMsgs) => [
              ...prevMsgs,
              { id: Date.now().toString(), role: "agent", content: prevResponse }
            ]);
          }
          return ""; // Stream'i sıfırla
        });
      });

      unlistenTool = await listen<any>("tool_request", (event) => {
        const payload =
          typeof event.payload === "string"
            ? JSON.parse(event.payload)
            : event.payload;

        setToolRequest(payload);
      });
    };

    setupListeners().then(funcs => {
       // Listener'ları kaydet (cleanup için)
    });

    return () => {
      if (unlistenChunk) unlistenChunk();
      if (unlistenEnd) unlistenEnd();
      if (unlistenTool) unlistenTool();
    };
  }, []);

  const sendPrompt = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    // Kullanıcı mesajını ekrana ekle
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: currentInput }]);
    
    setInput("");
    setResponse("");
    setToolRequest(null);

    await invoke("stream_prompt", {
      prompt: currentInput,
    });
  };

  const approveTool = async () => {
    if (!toolRequest) return;
    
    const req = toolRequest;
    setToolRequest(null);

    await invoke("approve_tool", {
      name: req.name,
      input: req.input,
    });
  };

  // Animasyon ayarları
  const messageVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    // Masaüstü uygulamasının tam penceresini kaplayacak yapı
    <div className="h-screen w-screen bg-[#0a0514] text-white flex flex-col relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Arkaplan Işık Efektleri */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-md window-drag-region">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)]">
            <Terminal className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-wide flex items-center gap-2">
              BEKSAR
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            </h1>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Developer Agent</div>
          </div>
        </div>
      </header>

      {/* Mesajlaşma Alanı */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {/* Geçmiş Mesajlar */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "agent" && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              
              <div className={`p-4 max-w-[80%] rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${
                msg.role === "agent" 
                  ? "bg-white/5 border border-white/10 rounded-tl-sm text-gray-200" 
                  : "bg-indigo-600 border border-indigo-500 rounded-tr-sm text-white shadow-indigo-900/20"
              }`}>
                {msg.content}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 border border-indigo-400 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Aktif Stream (Yazılıyor) Alanı */}
          {response && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              className="flex items-start gap-4 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(79,70,229,0.4)]">
                <Zap className="w-4 h-4 text-indigo-300 animate-pulse" />
              </div>
              
              <div className="p-4 max-w-[80%] rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap bg-white/5 border border-indigo-500/30 text-gray-200 shadow-[0_0_15px_rgba(79,70,229,0.1)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                {response}
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input Alanı */}
      <footer className="relative z-10 p-4 border-t border-white/5 bg-[#0a0514]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
            placeholder="Ask Beksar..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <button
            onClick={sendPrompt}
            disabled={!input.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl text-sm font-medium transition flex items-center justify-center shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)] active:scale-95"
          >
            <SendHorizontal className="w-4 h-4 text-white" />
          </button>
        </div>
      </footer>

      {/* Tool Request Modal (Animasyonlu Popup) */}
      <AnimatePresence>
        {toolRequest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#121826] border border-indigo-500/30 rounded-2xl p-6 w-[450px] shadow-[0_0_40px_-10px_rgba(79,70,229,0.4)] relative overflow-hidden"
            >
              {/* Modal İçi Neon Işık */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/20 blur-[50px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                    <Wrench className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Tool Request</h3>
                    <p className="text-xs text-gray-400">Agent wants to execute a command</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Tool Name</span>
                    <span className="text-sm text-indigo-300 font-mono">{toolRequest.name}</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Input Parameters</span>
                    <p className="text-sm text-gray-300 font-mono break-all whitespace-pre-wrap">{toolRequest.input}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setToolRequest(null)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm transition"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Reject</span>
                  </button>
                  <button
                    onClick={approveTool}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 py-2.5 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] transition"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-white">Approve</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        /* Özel Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}} />
    </div>
  );
}

export default App;
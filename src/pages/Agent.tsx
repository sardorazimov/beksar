import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizontal, User, Bot, Zap, Key, Sparkles, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ToolRequest = { name: string; input: string; };
type Message = { id: string; role: "user" | "agent"; content: string; };
type Provider = "openai" | "anthropic" | "gemini";

export default function Agent() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolRequest, setToolRequest] = useState<ToolRequest | null>(null);
  
  const [showApiModal, setShowApiModal] = useState(false);
  const [provider, setProvider] = useState<Provider>("openai");
  const [apiKey, setApiKey] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sayfa yüklendiğinde kullanıcı kontrolü yap
  useEffect(() => {
    const savedName = localStorage.getItem("beksar_user_name");
    const savedPhoto = localStorage.getItem("beksar_user_photo");
    const savedKey = localStorage.getItem("beksar_api_key");
    
    if (!savedName) {
      // Eğer kullanıcı giriş yapmamışsa, login'e at.
      navigate("/login");
      return;
    }

    setUserName(savedName);
    setUserPhoto(savedPhoto || "");

    // API Key yoksa modalı aç
    if (!savedKey) {
      setShowApiModal(true);
    }
  }, [navigate]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, response]);

  // Tauri Listeners
  useEffect(() => {
    if (showApiModal) return;

    let unlistenChunk: UnlistenFn, unlistenEnd: UnlistenFn, unlistenTool: UnlistenFn;
    const setupListeners = async () => {
      unlistenChunk = await listen<string>("stream_chunk", (e) => setResponse(p => p + e.payload));
      unlistenEnd = await listen("stream_end", () => {
        setResponse(p => { if (p.trim()) setMessages(m => [...m, { id: Date.now().toString(), role: "agent", content: p }]); return ""; });
      });
      unlistenTool = await listen<any>("tool_request", (e) => {
        const payload = typeof e.payload === "string" ? JSON.parse(e.payload) : e.payload;
        setToolRequest(payload);
      });
    };
    setupListeners();
    return () => { if (unlistenChunk) unlistenChunk(); if (unlistenEnd) unlistenEnd(); if (unlistenTool) unlistenTool(); };
  }, [showApiModal]);

  const sendPrompt = async () => {
    if (!input.trim() || showApiModal) return;
    const currentInput = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: currentInput }]);
    setInput(""); setResponse(""); setToolRequest(null);
    await invoke("stream_prompt", { prompt: currentInput });
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem("beksar_provider", provider);
    localStorage.setItem("beksar_api_key", apiKey);
    setShowApiModal(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen w-screen bg-[#0a0514] text-white flex flex-col relative overflow-hidden font-sans">
      <div data-tauri-drag-region className="absolute top-0 left-0 w-full h-8 z-50 cursor-grab" />
      
      {/* API SEÇİM MODALI */}
      <AnimatePresence>
        {showApiModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-[420px] bg-[#10111a] border border-white/5 rounded-3xl p-8 shadow-[0_0_50px_rgba(79,70,229,0.2)] relative">
              <div className="text-center mb-8">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold tracking-wide">Son Bir Adım</h2>
                <p className="text-xs text-gray-500 mt-1">Sistemi başlatmak için motoru seçin.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-2 block ml-1">YAPAY ZEKA MODELİ</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["openai", "anthropic", "gemini"] as Provider[]).map((p) => (
                      <button key={p} onClick={() => setProvider(p)} className={`py-3 px-1 rounded-xl text-xs font-medium border transition-all capitalize ${provider === p ? "bg-[#0a0b10] border-indigo-500/50 text-white shadow-[0_0_15px_rgba(79,70,229,0.15)]" : "bg-[#0a0b10] border-transparent text-gray-500 hover:text-gray-300"}`}>{p}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-2 block ml-1">API ANAHTARI (BYOK)</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`${provider} anahtarı`} className="w-full bg-[#0a0b10] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-300 outline-none focus:border-indigo-500/50 transition-colors font-mono" />
                  </div>
                  <p className="text-[9px] text-green-500/80 mt-2 flex items-center gap-1.5 ml-1"><ShieldCheck className="w-3 h-3" /> Sadece bu cihazda kalır, buluta yüklenmez.</p>
                </div>

                <button onClick={saveApiKey} disabled={!apiKey.trim()} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50">
                  Sistemi Başlat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-2 opacity-60 border-b border-white/5">
          <span className="text-xs tracking-widest uppercase font-semibold text-indigo-400 flex items-center gap-2"><Sparkles className="w-3 h-3"/> BEKSAR.AI</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-300">{userName}</span>
            {userPhoto ? <img src={userPhoto} alt="Profile" className="w-6 h-6 rounded-full border border-white/20" /> : <User className="w-5 h-5 text-gray-400" />}
          </div>
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && !response && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Bot className="w-12 h-12 mb-4 text-indigo-300" />
                <p className="text-lg">System ready, {userName}.</p>
            </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "agent" && <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1"><Bot className="w-4 h-4 text-indigo-400" /></div>}
            <div className={`p-4 max-w-[85%] rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${msg.role === "agent" ? "bg-white/5 border border-white/10 rounded-tl-sm text-gray-200" : "bg-indigo-600 border border-indigo-500 rounded-tr-sm text-white"}`}>{msg.content}</div>
            {msg.role === "user" && (
              userPhoto ? <img src={userPhoto} className="w-8 h-8 rounded-full border border-indigo-400 mt-1" alt="You" /> : <div className="w-8 h-8 rounded-full bg-indigo-500 border border-indigo-400 flex items-center justify-center mt-1"><User className="w-4 h-4 text-white" /></div>
            )}
          </div>
        ))}
        
        {response && (
          <div className="flex items-start gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 mt-1"><Zap className="w-4 h-4 text-indigo-300 animate-pulse" /></div>
            <div className="p-4 max-w-[85%] rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white/5 border border-indigo-500/30 text-gray-200"><span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" /></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="relative z-10 p-4 bg-[#0a0514]/80 backdrop-blur-xl">
        <div className="max-w-full mx-auto flex gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl focus-within:border-indigo-500/50 transition-all">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendPrompt()} placeholder={`Give Beksar a command...`} className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 disabled:opacity-50" disabled={showApiModal} />
          <button onClick={sendPrompt} disabled={!input.trim() || showApiModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition flex items-center justify-center"><SendHorizontal className="w-4 h-4 text-white" /></button>
        </div>
      </footer>
    </motion.div>
  );
}
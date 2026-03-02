import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import { 
  SendHorizontal, User, Bot, Zap, Settings, Plus, MessageSquare, 
  MonitorUp, Mic, ShieldCheck, X, Video, ChevronRight, LogOut, Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type ToolRequest = { name: string; input: string; };
type Message = { id: string; role: "user" | "agent"; content: string; };
type Provider = "openai" | "anthropic" | "gemini";

// --- TEMEL BİLEŞEN ---
export default function Agent() {
  const navigate = useNavigate();
  
  // Kullanıcı Bilgileri
  const [userName, setUserName] = useState("Kullanıcı");
  
  // Sohbet State'leri
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolRequest, setToolRequest] = useState<ToolRequest | null>(null);
  
  // Ultra Ajan Modları (Arayüz tetikleyicileri - Neon parlayanlar)
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVisionActive, setIsVisionActive] = useState(false);

  // Ayarlar State'leri (Model Seçimi ve Anahtarlar)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<Provider>("openai");
  const [apiKeys, setApiKeys] = useState({ openai: "", anthropic: "", gemini: "" });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Başlangıç Yüklemesi
  useEffect(() => {
    const savedName = localStorage.getItem("beksar_user_name");
    if (!savedName) {
      navigate("/login");
      return;
    }
    setUserName(savedName);

    // Kayıtlı API ayarlarını çek (Her model için ayrı)
    const savedProvider = (localStorage.getItem("beksar_provider") as Provider) || "openai";
    setActiveProvider(savedProvider);
    
    setApiKeys({
      openai: localStorage.getItem("beksar_api_key_openai") || "",
      anthropic: localStorage.getItem("beksar_api_key_anthropic") || "",
      gemini: localStorage.getItem("beksar_api_key_gemini") || ""
    });

  }, [navigate]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, response]);

  // Tauri Dinleyicileri
  useEffect(() => {
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
  }, []);

  const sendPrompt = async () => {
    if (!input.trim()) return;
    
    // Geçerli modelin anahtarı var mı kontrol et
    const apiKey = apiKeys[activeProvider];
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const currentInput = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: currentInput }]);
    setInput(""); setResponse(""); setToolRequest(null);

    // Rust'a hem soruyu hem de API anahtarını gönderiyoruz
    await invoke("stream_prompt", { 
        prompt: currentInput,
        apiKey: apiKey 
    });
  };

  const saveSettings = () => {
    localStorage.setItem("beksar_provider", activeProvider);
    localStorage.setItem("beksar_api_key_openai", apiKeys.openai);
    localStorage.setItem("beksar_api_key_anthropic", apiKeys.anthropic);
    localStorage.setItem("beksar_api_key_gemini", apiKeys.gemini);
    setIsSettingsOpen(false);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  }

  // Animasyon varyasyonları
  const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="h-screen w-screen bg-[#050508] text-white flex overflow-hidden font-sans selection:bg-indigo-500/30">
      <div data-tauri-drag-region className="absolute top-0 left-0 w-full h-8 z-50 cursor-grab active:cursor-grabbing" />
      
      {/* --- AYARLAR MODALI (Gelişmiş BYOK) --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-[#0a0b10] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition"><X className="w-5 h-5"/></button>
              
              <div className="mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl"><Settings className="w-5 h-5 text-indigo-400" /></div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Ultra Ajan Ayarları</h2>
                  <p className="text-xs text-gray-500">Maliyet sana ait; anahtarları dilediğin gibi yönet.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Aktif Model Sağlayıcı</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["openai", "anthropic", "gemini"] as Provider[]).map((p) => (
                      <button key={p} onClick={() => setActiveProvider(p)} className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all capitalize ${activeProvider === p ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.15)]" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300"}`}>{p}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">{activeProvider} API ANAHTARI</label>
                  <input type="password" value={apiKeys[activeProvider]} onChange={(e) => setApiKeys({...apiKeys, [activeProvider]: e.target.value})} placeholder={`sk-...`} className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm text-gray-300 outline-none focus:border-indigo-500/50 transition-colors font-mono" />
                </div>
                
                <p className="text-[9px] text-green-500/80 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Veriler cihazından dışarı çıkmaz, maliyet sana aittir.</p>

                <button onClick={saveSettings} className="w-full mt-4 bg-white text-black py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">Değişiklikleri Kaydet</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR (Komuta Merkezi Menüsü) --- */}
      <aside className="w-[260px] h-full bg-[#0a0b10]/80 border-r border-white/5 flex flex-col pt-10 pb-4 px-4 relative z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Beksar.AI</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Ultra Agent V1</p>
          </div>
        </div>

        <button onClick={() => setMessages([])} className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors mb-6 group">
          <Plus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" /> Yeni Görev Başlat
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
          <p className="text-[10px] text-gray-600 font-semibold px-2 mb-2 uppercase tracking-wider">Görev Geçmişi</p>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <MessageSquare className="w-4 h-4" /> <span className="truncate">Sistem Testi</span>
          </button>
        </div>

        {/* Kullanıcı ve Ayarlar */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30"><User className="w-3 h-3 text-indigo-300"/></div>
              <span className="text-xs font-medium text-gray-300">{userName}</span>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
                <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- ANA EKRAN (Chat & Ultra Özellikler) --- */}
      <main className="flex-1 flex flex-col relative h-full">
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none" />

        {/* Top Header - Ultra Ajan Kontrolleri */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#050508]/50 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-400">Motor: <span className="text-indigo-400 capitalize font-medium">{activeProvider}</span></span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsVisionActive(!isVisionActive)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isVisionActive ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.2)]" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10"}`}>
              <Video className="w-3.5 h-3.5" /> Görüntü (Satranç)
            </button>
            <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isScreenSharing ? "bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10"}`}>
              <MonitorUp className="w-3.5 h-3.5" /> Canlı Paylaşım
            </button>
          </div>
        </header>

        {/* Mesajlaşma Alanı */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent relative z-10">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !response && (
                <motion.div initial="hidden" animate="visible" variants={itemVariants} className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Bot className="w-12 h-12 mb-4 text-indigo-300" />
                    <p className="text-lg font-medium">Ultra Ajan göreve hazır, {userName}.</p>
                    <p className="text-xs mt-2 text-gray-500 max-w-sm">Satranç hamlelerini analiz edebilir, ekranını okuyabilir ve sesine tepki verebilirim.</p>
                </motion.div>
            )}
            
            {messages.map((msg) => (
              <motion.div key={msg.id} initial="hidden" animate="visible" variants={itemVariants} className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "agent" && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg"><Bot className="w-4 h-4 text-white" /></div>}
                
                <div className={`p-4 max-w-[80%] rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${msg.role === "agent" ? "bg-[#10111a] border border-white/5 rounded-tl-sm text-gray-200" : "bg-white text-black rounded-tr-sm font-medium"}`}>
                  {msg.content}
                </div>

                {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center mt-1"><User className="w-4 h-4 text-white" /></div>}
              </motion.div>
            ))}
            
            {response && (
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="flex items-start gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 mt-1"><Zap className="w-4 h-4 text-indigo-300 animate-pulse" /></div>
                <div className="p-4 max-w-[80%] rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-[#10111a] border border-white/5 text-gray-200"><span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" /></div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        {/* Input Alanı (Multimodal input) */}
        <div className="p-6 relative z-10">
          <div className="max-w-4xl mx-auto bg-[#10111a] border border-white/10 rounded-2xl p-2 flex flex-col focus-within:border-indigo-500/50 transition-colors shadow-2xl">
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt(); } }} 
              placeholder={`Ajan'a bir komut ver veya ekranını analiz etmesini iste...`} 
              className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600 resize-none min-h-[60px] max-h-[200px]" 
              rows={1}
            />
            
            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1 px-2 pb-1">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsVoiceActive(!isVoiceActive)} className={`p-2 rounded-lg transition-colors ${isVoiceActive ? "bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "hover:bg-white/5 text-gray-500 hover:text-white"}`}>
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              
              <button onClick={sendPrompt} disabled={!input.trim()} className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg">
                Gönder <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-3 relative">Beksar.AI ekranınızı analiz ederken gizliliğiniz cihazınızda güvende kalır.</p>
        </div>
      </main>
    </div>
  );
}
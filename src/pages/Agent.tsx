import { useEffect, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Bot, Zap, Settings, Plus, MessageSquare,
    MonitorUp, Mic, ShieldCheck, X, Video, ChevronRight, LogOut,
    Eye, EyeOff, Activity, ChevronDown, Square
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Message = { id: string; role: "user" | "agent"; content: string; };
type Provider = "openai" | "anthropic" | "gemini";
type ScreenActivity = { id: string; text: string; timestamp: string; };

export default function Agent() {
    const navigate = useNavigate();

    const [userName, setUserName] = useState("Kullanıcı");

    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    // Live screen state
    const [isScreenLive, setIsScreenLive] = useState(false);
    const [isScreenPaused, setIsScreenPaused] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isChessMode, setIsChessMode] = useState(false);
    const [screenActivities, setScreenActivities] = useState<ScreenActivity[]>([]);
    const [chessAnalysis, setChessAnalysis] = useState<string>("");
    const [showActivityPanel, setShowActivityPanel] = useState(false);

    // Settings
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeProvider, setActiveProvider] = useState<Provider>("openai");
    const [apiKeys, setApiKeys] = useState({ openai: "", anthropic: "", gemini: "" });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const screenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const savedName = localStorage.getItem("beksar_user_name");
        if (!savedName) { navigate("/login"); return; }
        setUserName(savedName);

        const savedProvider = (localStorage.getItem("beksar_provider") as Provider) || "openai";
        setActiveProvider(savedProvider);
        setApiKeys({
            openai: localStorage.getItem("beksar_api_key_openai") || "",
            anthropic: localStorage.getItem("beksar_api_key_anthropic") || "",
            gemini: localStorage.getItem("beksar_api_key_gemini") || ""
        });
    }, [navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, response]);

    useEffect(() => {
        let unlistenChunk: UnlistenFn;
        let unlistenEnd: UnlistenFn;

        const setupListeners = async () => {
            unlistenChunk = await listen<string>("stream_chunk", (e) => {
                setResponse(p => p + e.payload);
            });
            unlistenEnd = await listen("stream_end", () => {
                setIsStreaming(false);
                setResponse(p => {
                    if (p.trim()) {
                        setMessages(m => [...m, { id: Date.now().toString(), role: "agent", content: p }]);
                    }
                    return "";
                });
            });
        };

        setupListeners();
        return () => {
            if (unlistenChunk) unlistenChunk();
            if (unlistenEnd) unlistenEnd();
        };
    }, []);

    // Live screen simulation: add activity entries when screen is live and not paused
    const addActivity = useCallback((text: string) => {
        setScreenActivities(prev => [
            { id: Date.now().toString(), text, timestamp: new Date().toLocaleTimeString() },
            ...prev.slice(0, 19)
        ]);
    }, []);

    useEffect(() => {
        if (isScreenLive && !isScreenPaused) {
            // TODO: Replace with real screen capture + AI analysis via Tauri screenshot plugin.
            // These are simulated activity entries for demo/prototype purposes.
            const activities = isChessMode ? [
                "♟️ Hamle sırası: Beyaz — e4 açılışı tespit edildi",
                "♞ Siyah yanıtladı: e5 — İtalyan Oyunu pozisyonu",
                "♝ Önerilen hamle: Nf3 — merkez kontrolü için",
                "♜ Tehdit analizi: d5 → d4 piyonu kırılgan",
                "♛ En iyi hamle: Bc4 — Giuoco Piano varyantı",
                "♔ Kral güvenliği: Rok yapmayı düşün",
            ] : [
                "🖥️ Ekran içeriği okunuyor…",
                "📄 Metin bloğu tespit edildi",
                "🔍 Aktif pencere analiz ediliyor",
                "💡 İçerik yorumlanıyor",
                "📊 Görsel öğeler tanımlanıyor",
            ];
            screenIntervalRef.current = setInterval(() => {
                const text = activities[Math.floor(Math.random() * activities.length)];
                addActivity(text);
                if (isChessMode) {
                    const analyses = [
                        "Bc4 → Nf3 → O-O sıralaması önerilir",
                        "Merkez kontrolü için d4 hamlesi kritik",
                        "Piyonlar: beyaz +0.3 avantajlı",
                        "Siyah: fianchetto savunmayı düşünmeli",
                    ];
                    setChessAnalysis(analyses[Math.floor(Math.random() * analyses.length)]);
                }
            }, 2500);
        } else {
            if (screenIntervalRef.current) {
                clearInterval(screenIntervalRef.current);
                screenIntervalRef.current = null;
            }
        }

        return () => {
            if (screenIntervalRef.current) {
                clearInterval(screenIntervalRef.current);
                screenIntervalRef.current = null;
            }
        };
    }, [isScreenLive, isScreenPaused, isChessMode, addActivity]);

    const toggleScreenLive = () => {
        if (isScreenLive) {
            setIsScreenLive(false);
            setIsScreenPaused(false);
            setChessAnalysis("");
            addActivity("🔴 Canlı ekran paylaşımı durduruldu");
        } else {
            setIsScreenLive(true);
            setIsScreenPaused(false);
            setShowActivityPanel(true);
            addActivity("🟢 Canlı ekran paylaşımı başlatıldı");
        }
    };

    const togglePause = () => {
        setIsScreenPaused(p => {
            const next = !p;
            addActivity(next ? "⏸️ Ajan duraklatıldı — bekleniyor" : "▶️ Ajan devam ediyor");
            return next;
        });
    };

    const sendPrompt = async () => {
        if (!input.trim() || isStreaming) return;

        const apiKey = apiKeys[activeProvider];
        if (!apiKey) { setIsSettingsOpen(true); return; }

        const currentInput = input;
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: currentInput }]);
        setInput("");
        setResponse("");
        setIsStreaming(true);

        await invoke("stream_prompt", {
            prompt: currentInput,
            apiKey,
            provider: activeProvider,
        });
    };

    const saveSettings = () => {
        localStorage.setItem("beksar_provider", activeProvider);
        localStorage.setItem("beksar_api_key_openai", apiKeys.openai);
        localStorage.setItem("beksar_api_key_anthropic", apiKeys.anthropic);
        localStorage.setItem("beksar_api_key_gemini", apiKeys.gemini);
        setIsSettingsOpen(false);
    };

    const logout = () => { localStorage.clear(); navigate("/"); };

    const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="h-screen w-screen bg-[#050508] text-white flex overflow-hidden font-sans selection:bg-indigo-500/30">
            <div data-tauri-drag-region className="absolute top-0 left-0 w-full h-8 z-50 cursor-grab active:cursor-grabbing" />

            {/* SETTINGS MODAL */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-[#0a0b10] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition"><X className="w-5 h-5" /></button>
                            <div className="mb-6 flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/20 rounded-xl"><Settings className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">Ajan Ayarları</h2>
                                    <p className="text-xs text-gray-500">API anahtarları cihazınızda saklanır.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Aktif Sağlayıcı</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["openai", "anthropic", "gemini"] as Provider[]).map((p) => (
                                            <button key={p} onClick={() => setActiveProvider(p)} className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all capitalize ${activeProvider === p ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300"}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">{activeProvider.toUpperCase()} API ANAHTARI</label>
                                    <input type="password" value={apiKeys[activeProvider]} onChange={(e) => setApiKeys({ ...apiKeys, [activeProvider]: e.target.value })} placeholder="sk-..." className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 text-sm text-gray-300 outline-none focus:border-indigo-500/50 transition-colors font-mono" />
                                </div>
                                <p className="text-[9px] text-green-500/80 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Veriler cihazınızdan dışarı çıkmaz.</p>
                                <button onClick={saveSettings} className="w-full mt-4 bg-white text-black py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">Kaydet</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <aside className="w-[240px] h-full bg-[#0a0b10]/80 border-r border-white/5 flex flex-col pt-10 pb-4 px-4 relative z-20 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight">Beksar.AI</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Ultra Agent V2</p>
                    </div>
                </div>

                <button onClick={() => { setMessages([]); setResponse(""); }} className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors mb-6 group">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" /> Yeni Görev
                </button>

                {/* Live Screen Panel Toggle */}
                <button onClick={() => setShowActivityPanel(p => !p)} className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors mb-2 group border ${showActivityPanel ? "bg-orange-500/10 border-orange-500/30 text-orange-300" : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}>
                    <Activity className="w-4 h-4" />
                    <span>Canlı Aktivite</span>
                    {isScreenLive && <span className="ml-auto w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                </button>

                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 mt-2">
                    <p className="text-[10px] text-gray-600 font-semibold px-2 mb-2 uppercase tracking-wider">Görev Geçmişi</p>
                    {messages.filter(m => m.role === "user").slice(-5).map(m => (
                        <div key={m.id} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{m.content.slice(0, 30)}…</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30"><User className="w-3 h-3 text-indigo-300" /></div>
                            <span className="text-xs font-medium text-gray-300 truncate max-w-[100px]">{userName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
                            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className="flex-1 flex flex-col relative h-full min-w-0">
                <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none" />

                {/* TOOLBAR */}
                <header className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-[#050508]/60 backdrop-blur-md relative z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-gray-400">Motor: <span className="text-indigo-400 capitalize font-medium">{activeProvider}</span></span>

                        {/* Chess analysis in toolbar */}
                        {isChessMode && isScreenLive && chessAnalysis && (
                            <div className="flex items-center gap-2 ml-3 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <span className="text-xs text-amber-300 font-mono">♟ {chessAnalysis}</span>
                            </div>
                        )}

                        {/* Screen live indicator */}
                        {isScreenLive && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                <span className="text-[10px] text-orange-300">{isScreenPaused ? "DURDURULDU" : "CANLI"}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Chess mode toggle */}
                        <button
                            onClick={() => setIsChessMode(p => !p)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isChessMode ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10"}`}
                        >
                            ♟ Satranç Modu
                        </button>

                        {/* Voice toggle */}
                        <button
                            onClick={() => setIsVoiceActive(p => !p)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isVoiceActive ? "bg-red-500/20 border-red-500/50 text-red-300" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10"}`}
                        >
                            <Mic className="w-3.5 h-3.5" /> Ses
                        </button>

                        {/* Screen live toggle */}
                        <button
                            onClick={toggleScreenLive}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isScreenLive ? "bg-orange-500/20 border-orange-500/50 text-orange-300" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10"}`}
                        >
                            {isScreenLive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {isScreenLive ? "Durdur" : "Canlı Ekran"}
                        </button>

                        {/* Pause/Resume when live */}
                        {isScreenLive && (
                            <button
                                onClick={togglePause}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isScreenPaused ? "bg-green-500/20 border-green-500/50 text-green-300" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10"}`}
                            >
                                {isScreenPaused ? <Video className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                {isScreenPaused ? "Devam Et" : "Beklet"}
                            </button>
                        )}

                        <button onClick={() => setShowActivityPanel(p => !p)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                            <ChevronDown className={`w-4 h-4 transition-transform ${showActivityPanel ? "rotate-180" : ""}`} />
                        </button>
                    </div>
                </header>

                {/* LIVE ACTIVITY PANEL */}
                <AnimatePresence>
                    {showActivityPanel && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-b border-white/5 bg-[#0a0b10]/60 backdrop-blur-md overflow-hidden shrink-0"
                        >
                            <div className="px-5 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <MonitorUp className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ajan Aktivitesi</span>
                                    </div>
                                    {!isScreenLive && (
                                        <span className="text-[10px] text-gray-600">Canlı ekranı başlatmak için "Canlı Ekran" düğmesine basın</span>
                                    )}
                                </div>
                                <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-hide">
                                    {screenActivities.length === 0 ? (
                                        <p className="text-[11px] text-gray-600 italic">Henüz aktivite yok.</p>
                                    ) : (
                                        screenActivities.map(a => (
                                            <div key={a.id} className="flex items-start gap-2 text-[11px]">
                                                <span className="text-gray-600 font-mono shrink-0">{a.timestamp}</span>
                                                <span className="text-gray-300">{a.text}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent relative z-10">
                    <AnimatePresence initial={false}>
                        {messages.length === 0 && !response && (
                            <motion.div initial="hidden" animate="visible" variants={itemVariants} className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <Bot className="w-12 h-12 mb-4 text-indigo-300" />
                                <p className="text-lg font-medium">Ultra Ajan göreve hazır, {userName}.</p>
                                <p className="text-xs mt-2 text-gray-500 max-w-sm">Satranç hamlelerini analiz edebilir, ekranını okuyabilir ve sesine tepki verebilirim.</p>
                            </motion.div>
                        )}

                        {messages.map((msg) => (
                            <motion.div key={msg.id} initial="hidden" animate="visible" variants={itemVariants} className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.role === "agent" && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className={`p-4 max-w-[80%] rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${msg.role === "agent" ? "bg-[#10111a] border border-white/5 rounded-tl-sm text-gray-200" : "bg-white text-black rounded-tr-sm font-medium"}`}>
                                    {msg.content}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center mt-1">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {(isStreaming || response) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Zap className="w-4 h-4 text-indigo-300 animate-pulse" />
                                </div>
                                <div className="p-4 max-w-[80%] rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-[#10111a] border border-white/5 text-gray-200">
                                    {response}
                                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </AnimatePresence>
                </div>

                {/* INPUT */}
                <div className="p-5 relative z-10 shrink-0">
                    <div className="max-w-4xl mx-auto bg-[#10111a] border border-white/10 rounded-2xl p-2 flex flex-col focus-within:border-indigo-500/50 transition-colors shadow-2xl">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt(); } }}
                            placeholder={isChessMode ? "Satranç pozisyonu sor veya analiz iste…" : "Ajan'a bir komut ver veya ekranını analiz etmesini iste…"}
                            className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600 resize-none min-h-[56px] max-h-[200px]"
                            rows={1}
                            disabled={isStreaming}
                        />
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1 px-2 pb-1">
                            <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                {isChessMode && <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400">♟ Satranç</span>}
                                {isScreenLive && <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400">● Canlı</span>}
                                {isVoiceActive && <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400">🎙 Ses</span>}
                            </div>
                            <button
                                onClick={sendPrompt}
                                disabled={!input.trim() || isStreaming}
                                className="bg-white text-black hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg"
                            >
                                {isStreaming ? <Zap className="w-4 h-4 animate-pulse" /> : <ChevronRight className="w-4 h-4" />}
                                {isStreaming ? "Yanıtlanıyor…" : "Gönder"}
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-gray-700 mt-3">Beksar.AI — verileriniz cihazınızda güvende.</p>
                </div>
            </main>
        </div>
    );
}

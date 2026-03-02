import { motion } from "framer-motion";
import { Bot, Zap, MonitorUp, Shield, ChevronRight, Eye, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();

    const features = [
        { icon: <Zap className="w-5 h-5 text-indigo-400" />, title: "Anlık Streaming", desc: "Yanıtlar token token, gerçek zamanlı akar." },
        { icon: <MonitorUp className="w-5 h-5 text-orange-400" />, title: "Canlı Ekran", desc: "Ajan ekranınızı okur, analiz eder, yorumlar." },
        { icon: <Eye className="w-5 h-5 text-amber-400" />, title: "Satranç Analizi", desc: "Canlı satranç izlerken hamle önerileri alın." },
        { icon: <Shield className="w-5 h-5 text-green-400" />, title: "Gizlilik Önce", desc: "API anahtarlarınız sadece cihazınızda kalır." },
        { icon: <Mic className="w-5 h-5 text-red-400" />, title: "Sesle Kontrol", desc: "Ajana sesli komut verin, elleri serbest çalışın." },
        { icon: <Bot className="w-5 h-5 text-purple-400" />, title: "Çok Sağlayıcı", desc: "OpenAI, Anthropic ve Gemini desteği." },
    ];

    return (
        <div className="h-screen w-screen bg-[#050508] text-white overflow-y-auto font-sans selection:bg-indigo-500/30">
            <div data-tauri-drag-region className="absolute top-0 left-0 w-full h-8 z-50 cursor-grab" />

            {/* Background glow */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 blur-[200px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-400 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        Ultra Agent V2 — Açık Beta
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
                        <Bot className="w-9 h-9 text-white" />
                    </div>

                    <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                        Beksar.AI
                    </h1>
                    <p className="text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
                        Ekranınızı gören, sesizi duyan, satranç oynayan — masaüstü yapay zeka ajanınız.
                    </p>

                    <div className="flex items-center gap-3 justify-center mt-8">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate("/login")}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Başla <ChevronRight className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                const saved = localStorage.getItem("beksar_user_name");
                                navigate(saved ? "/agent" : "/login");
                            }}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all"
                        >
                            Devam Et
                        </motion.button>
                    </div>
                </motion.div>

                {/* Feature grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="grid grid-cols-3 gap-4 max-w-2xl w-full"
                >
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i + 0.4 }}
                            className="bg-[#0a0b10] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
                        >
                            <div className="mb-3">{f.icon}</div>
                            <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-[10px] text-gray-700 mt-12"
                >
                    Tauri + Rust + React — MIT Lisansı
                </motion.p>
            </div>
        </div>
    );
}
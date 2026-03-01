// ⚡ BEKSAR FRONTEND FINAL VERSION

import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import {
  SendHorizontal,
  Mic,
  Volume2,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  Activity,
} from "lucide-react";

/* ================= TYPES ================= */

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
};

/* ================= COMPONENT ================= */

export default function App() {
  const [booting, setBooting] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [cpuUsage, setCpuUsage] = useState(15);
  const [memoryUsage, setMemoryUsage] = useState(42);

  const [tokenCount, setTokenCount] = useState(0);
  const [realTokens, setRealTokens] = useState<number | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ================= MATRIX BOOT ================= */

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2500);
    return () => clearTimeout(t);
  }, []);

  /* ================= STARFIELD BACKGROUND ================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5,
      speed: Math.random() * 0.3 + 0.1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  /* ================= FAKE SYSTEM METRICS ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 60) + 10);
      setMemoryUsage(Math.floor(Math.random() * 50) + 30);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  /* ================= STREAM EVENTS ================= */

  useEffect(() => {
    let unlistenChunk: UnlistenFn;
    let unlistenEnd: UnlistenFn;
    let unlistenTokens: UnlistenFn;

    const setup = async () => {
      unlistenChunk = await listen<string>("stream_chunk", (event) => {
        setResponse((prev) => {
          const newText = prev + event.payload;
          setTokenCount(newText.length);
          return newText;
        });
      });

      unlistenEnd = await listen("stream_end", () => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "agent", content: response },
        ]);

        if (voiceEnabled && response) speak(response);
        setResponse("");
      });

      // 🔥 REAL TOKEN EVENT (backend emit ederse)
      unlistenTokens = await listen<number>("token_usage", (event) => {
        setRealTokens(event.payload);
      });
    };

    setup();

    return () => {
      if (unlistenChunk) unlistenChunk();
      if (unlistenEnd) unlistenEnd();
      if (unlistenTokens) unlistenTokens();
    };
  }, [response, voiceEnabled]);

  /* ================= SEND ================= */

  const sendPrompt = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: input },
    ]);

    await invoke("stream_prompt", { prompt: input });
    setInput("");
    console.log(invoke);
  };

  /* ================= TTS ================= */

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
  };

  /* ================= MIC ================= */

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  /* ================= BOOT SCREEN ================= */

  if (booting) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-green-400 font-mono text-sm">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Initializing BEKSAR Neural Core...
        </motion.div>
      </div>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <div className="h-screen w-screen flex bg-[#05010a] text-white relative overflow-hidden">

      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20" />

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className="w-64 bg-black/60 backdrop-blur-xl border-r border-indigo-500/20 p-5 z-10"
          >
            <h2 className="text-indigo-400 text-xl font-bold mb-6">
              BEKSAR
            </h2>

            <div className="space-y-4 text-xs">

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={14} />
                  CPU
                </div>
                <div className="h-2 bg-black rounded">
                  <div
                    className="h-2 bg-indigo-500 rounded transition-all"
                    style={{ width: `${cpuUsage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={14} />
                  Memory
                </div>
                <div className="h-2 bg-black rounded">
                  <div
                    className="h-2 bg-purple-500 rounded transition-all"
                    style={{ width: `${memoryUsage}%` }}
                  />
                </div>
              </div>

              <div>
                Tokens: {realTokens ?? tokenCount}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div className="flex-1 flex flex-col z-10">

        {/* HEADER */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-indigo-500/20 bg-black/30 backdrop-blur-xl">

          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <span className="text-green-400 text-xs">AGENT ONLINE</span>
          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={toggleMic}
              className={`p-2 rounded-full transition ${isListening
                  ? "bg-red-600 shadow-[0_0_25px_red]"
                  : "hover:bg-indigo-500/20"
                }`}
            >
              <Mic size={18} />
            </button>

            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-full transition ${voiceEnabled
                  ? "text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                  : "text-gray-500"
                }`}
            >
              <Volume2 size={18} />
            </button>

          </div>
        </header>

        {/* CHAT */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[70%] ${m.role === "user"
                    ? "bg-indigo-600"
                    : "bg-white/5 border border-indigo-500/30"
                  }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {response && (
            <div className="bg-white/5 border border-indigo-500/30 p-4 rounded-2xl">
              {response}
              <span className="inline-block w-1 h-4 bg-indigo-400 animate-pulse ml-1" />
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        {/* INPUT */}
        <footer className="p-4 bg-black/40 border-t border-indigo-500/20">
          <div className="flex gap-3 bg-black/60 border border-indigo-500/30 p-2 rounded-2xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
              className="flex-1 bg-transparent outline-none"
              placeholder="Type command..."
            />
            <button
              onClick={sendPrompt}
              className="bg-indigo-600 px-4 py-2 rounded-xl"
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
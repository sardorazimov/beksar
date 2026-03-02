import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";




type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [tokens, setTokens] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, response]);

  // Streaming listeners
  useEffect(() => {
    let currentResponse = "";

    let unlistenChunk: any;
    let unlistenEnd: any;
    let unlistenTokens: any;

    const setup = async () => {
      unlistenChunk = await listen("stream_chunk", (event) => {
        const chunk = String(event.payload);
        currentResponse += chunk;

        setResponse((prev) => prev + chunk);
      });

      unlistenEnd = await listen("stream_end", () => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "agent",
            content: currentResponse,
          },
        ]);

        currentResponse = "";
        setResponse("");
      });

      unlistenTokens = await listen("token_usage", (event) => {
        setTokens(Number(event.payload));
      });
    };

    setup();

    return () => {
      if (unlistenChunk) unlistenChunk();
      if (unlistenEnd) unlistenEnd();
      if (unlistenTokens) unlistenTokens();
    };
  }, []);

  const sendPrompt = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: input
    }]);

    setResponse(""); // sadece başta
    await invoke("stream_prompt", { prompt: input });
    setInput("");
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <span className="font-semibold tracking-wide text-indigo-400">
          BEKSAR
        </span>
        <span className="text-xs text-gray-400">
          Tokens: {tokens}
        </span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-sm max-w-[70%] ${msg.role === "user"
                  ? "bg-indigo-600"
                  : "bg-white/5 border border-white/10"
                  }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming bubble */}
        {response && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl text-sm max-w-[70%] bg-white/5 border border-white/10">
              {response}
              <span className="inline-block w-1 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-500"
          />
          <button
            onClick={sendPrompt}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm transition active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
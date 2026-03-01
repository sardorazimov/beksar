"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Play, PlusSquare, User, Calendar, CheckCircle2 } from "lucide-react";
import { easeOut, easeInOut } from "framer-motion";

export default function LandingPage() {
  // Ortak animasyon ayarları
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOut } },
  };

  const floatAnimation = {
    y: ["-10px", "10px", "-10px"],
    transition: { duration: 5, repeat: Infinity, ease: easeInOut },
  };

  return (
    <div className="min-h-screen bg-[#0a0514] text-white font-sans overflow-hidden relative">
      {/* Arkaplan Parçacıkları / Işıkları */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-orange-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter">Mufi</div>
        <div className="hidden md:flex items-center space-x-8 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md">
          <a href="#" className="text-sm font-medium hover:text-purple-400 transition">Home</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition">Product</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition">Story</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition">Use cases</a>
        </div>
        <div className="flex items-center space-x-6">
          <a href="#" className="text-sm font-medium text-gray-300 hover:text-white">Log In</a>
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition">
            Book a Demo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col items-center">
          {/* Badge */}
          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm mb-8">
            <span className="text-purple-400 text-xs">✦</span>
            <span className="text-xs font-medium text-gray-300">Smart Scheduler</span>
          </div>

          {/* Başlık */}
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl mb-6 leading-tight">
            Smart Scheduler Effortless <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">
              ABA Automation!
            </span>
          </h1>

          {/* Alt Başlık */}
          <p className="text-gray-400 max-w-lg mb-10">
            Imagine ABA scheduling for all patients happening automatically.
          </p>

          {/* CTA Butonu (Neon Parla efektli) */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
            <button className="relative bg-[#130a2a] border border-white/10 px-8 py-3 rounded-full text-sm font-semibold text-white">
              Book a Demo
            </button>
          </div>
        </motion.div>

        {/* Logo Strip */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5, duration: 1 }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mt-20 opacity-50 grayscale"
        >
          <span className="font-bold text-lg">Opendoor</span>
          <span className="font-bold text-lg">DocuSign</span>
          <span className="font-bold text-lg tracking-widest"># slack</span>
          <span className="font-bold text-lg">splunk&gt;</span>
          <span className="font-bold text-lg">ATLASSIAN</span>
        </motion.div>
      </main>

      {/* Cards Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-32 flex flex-col md:flex-row gap-8 justify-center mt-12">
        
        {/* Sol Kart - Turuncu Tema */}
        <motion.div 
          animate={floatAnimation}
          className="w-full md:w-[450px] bg-[#1a101a]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_0_60px_-15px_rgba(255,100,0,0.3)] relative"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-200 font-medium">You have 3 new appointment</h3>
            <div className="bg-orange-500/20 p-2 rounded-full">
              <Bell className="w-4 h-4 text-orange-400" />
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Wilson Rhiel Madsen</h4>
                <p className="text-xs text-gray-400">8:00 - 12:00Am. in 10 min</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 transition py-2.5 rounded-xl text-sm font-medium">
                Prepare
              </button>
              <button className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium py-2.5 rounded-xl text-sm shadow-[0_0_20px_rgba(255,165,0,0.4)] hover:shadow-[0_0_30px_rgba(255,165,0,0.6)] transition">
                Start sessions
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-xs text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">Notes to complete</span>
          </div>
        </motion.div>

        {/* Sağ Kart - Mor Tema */}
        <motion.div 
          animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 1 } }}
          className="w-full md:w-[450px] bg-[#100826]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_0_60px_-15px_rgba(128,0,128,0.3)]"
        >
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sessions</p>
                    <h4 className="text-sm font-semibold text-white">Session with peter</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    <span className="text-[10px] text-purple-400">Live session</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Started 6 min ago</p>
                </div>
             </div>

             <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>Data logging</span>
                  <span>Last logged 3s ago</span>
                </div>
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <PlusSquare className="w-4 h-4 text-purple-300" />
                    <div>
                      <p className="text-sm font-medium text-white">Model prompt</p>
                      <p className="text-[10px] text-purple-200/50">Engage with play item</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-1 rounded">1s ago</span>
                </div>
             </div>
          </div>

          {/* Alt Kısım */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
             <div className="flex justify-between items-center mb-4">
               <span className="text-sm text-gray-300">Engage with play items</span>
               <span className="text-[10px] text-gray-500">Skill acquisition</span>
             </div>
             <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-300">Completed</span>
                </div>
                <span className="text-xs text-gray-500">10:35 am</span>
             </div>
          </div>

        </motion.div>
      </section>
    </div>
  );
}
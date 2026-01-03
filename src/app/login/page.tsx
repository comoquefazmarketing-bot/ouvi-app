"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ParticlesBackground = () => {
  // 15.000 partículas em movimento constante [cite: 2026-01-02]
  const particles = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-cyan-400 rounded-full opacity-40"
          style={{
            width: p.size,
            height: p.size,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [formData, setFormData] = useState({ nome: "", email: "", whats: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const playDuuummTuuumm = () => {
    if (typeof window === "undefined") return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const createBeat = (freq: number, vol: number, start: number, dur: number, isDum: boolean) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      if (isDum) osc.frequency.exponentialRampToValueAtTime(freq * 0.3, start + dur);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };
    // Cadência Duuumm Tuuumm mais lenta [cite: 2026-01-02]
    createBeat(120, 0.3, audioCtx.currentTime, 0.6, false);
    createBeat(70, 0.6, audioCtx.currentTime + 0.6, 1.0, true);
  };

  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playDuuummTuuumm();

    try {
      // O segredo para não falhar: UUID temporário se não houver auth [cite: 2025-12-30]
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ 
          email: formData.email, 
          username: formData.nome, 
          whatsapp: formData.whats,
          welcome_sent: true 
        }, { onConflict: 'email' })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem("ouvi_session_id", data.id);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Falha na sintonização. Verifique se o SQL foi aplicado no Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center p-6 select-none overflow-hidden">
      <ParticlesBackground />
      
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
        <motion.div 
          animate={{ scale: [1, 1.02, 1], filter: ["blur(0px)", "blur(1px)", "blur(0px)"] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="mb-12"
        >
          <img src="/logo-ouvi.svg" alt="OUVI" className="w-32 drop-shadow-[0_0_15px_rgba(0,242,254,0.5)]" />
        </motion.div>

        <form onSubmit={handleAcesso} className="w-full space-y-4">
          <input 
            type="text" placeholder="NOME" required
            className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl text-[10px] tracking-widest text-white outline-none focus:border-cyan-500 transition-all"
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
          />
          <input 
            type="email" placeholder="E-MAIL" required
            className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl text-[10px] tracking-widest text-white outline-none focus:border-cyan-500 transition-all"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="tel" placeholder="WHATSAPP" required
            className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl text-[10px] tracking-widest text-white outline-none focus:border-cyan-500 transition-all"
            onChange={(e) => setFormData({...formData, whats: e.target.value})}
          />
          <button className="w-full bg-white text-black font-black py-4 rounded-2xl text-[10px] tracking-[4px] uppercase active:scale-95 transition-all">
            {loading ? "SINTONIZANDO..." : "ENTRAR NO SINAL"}
          </button>
        </form>

        <div className="mt-10 flex gap-4 opacity-30">
           <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5 grayscale" alt="Google" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" className="w-5 h-5 invert" alt="Apple" />
        </div>
      </div>
    </div>
  );
}
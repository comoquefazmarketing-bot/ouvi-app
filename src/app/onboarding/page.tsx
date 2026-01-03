"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

// Função de som sintetizada [cite: 2026-01-01]
const playStepSound = (isFinal = false) => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const beat = (f: number, v: number, s: number, d: number) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, s);
    if (f < 120) o.frequency.exponentialRampToValueAtTime(f * 0.5, s + d);
    g.gain.setValueAtTime(v, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + d);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(s); o.stop(s + d);
  };
  
  if (!isFinal) {
    beat(150, 0.2, audioCtx.currentTime, 0.1); // Som sutil de clique
  } else {
    beat(150, 0.4, audioCtx.currentTime, 0.15); // Tum
    beat(80, 0.6, audioCtx.currentTime + 0.12, 0.5); // Dum reforçado
  }
};

// Layout e Seletores simplificados para o exemplo (Mantenha seus componentes visuais originais aqui)
const OnboardingLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
    {children}
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ id: "", avatar: "", nick: "", email: "" });

  useEffect(() => {
    const checkUser = async () => {
      // 1. ÂNCORA POR EMAIL: A verdade está no navegador [cite: 2025-12-30]
      const savedEmail = localStorage.getItem("ouvi_user_email");
      
      if (!savedEmail) {
        // Aguarda um curto período para garantir que o sinal não está apenas "oscilando"
        setTimeout(() => {
          if (!localStorage.getItem("ouvi_user_email")) router.push("/login");
        }, 1500);
        return;
      }

      // 2. CONFRONTO DE INFORMAÇÕES: Busca o perfil pelo email
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", savedEmail)
        .maybeSingle();

      // Se já completou, não precisa ver o onboarding novamente
      if (profile?.onboarding_completed) {
        router.push("/dashboard");
        return;
      }

      // 3. REIDRATAÇÃO DOS DADOS: Prepara o terreno para o Onboarding
      setUserData({
        id: profile?.id || localStorage.getItem("ouvi_session_id") || "",
        avatar: profile?.avatar_url || localStorage.getItem("ouvi_user_avatar") || "",
        nick: profile?.display_name || localStorage.getItem("ouvi_user_name") || "",
        email: savedEmail
      });
      
      setStep(1);
    };
    checkUser();
  }, [router]);

  const handleNextStep = () => {
    playStepSound(false);
    setStep(2);
  };

  const handleFinish = async (finalNick: string) => {
    if (!userData.email || finalNick.length < 3) return;
    setLoading(true);
    playStepSound(true); // O Tum Dum final [cite: 2026-01-01]

    // 4. PERSISTÊNCIA TOTAL: Salva no banco e no navegador [cite: 2025-12-30]
    const { data: updatedProfile, error } = await supabase.from("profiles").upsert({
      id: userData.id || undefined, // Deixa o banco gerar se for novo
      email: userData.email,
      username: finalNick.trim().toLowerCase(),
      display_name: finalNick.trim(),
      avatar_url: userData.avatar,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    }).select().single();

    if (!error && updatedProfile) {
      // Atualiza o sinal local para o Dashboard reconhecer imediatamente
      localStorage.setItem("ouvi_session_id", updatedProfile.id);
      localStorage.setItem("ouvi_user_name", updatedProfile.display_name);
      
      setTimeout(() => router.push("/dashboard"), 800);
    } else {
      setLoading(false);
      console.error("Erro na sintonização final:", error);
    }
  };

  if (step === 0) return <div style={{ background: "#000", height: "100vh" }} />;

  return (
    <OnboardingLayout>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {/* Substitua pelo seu <AvatarSelector /> */}
             <h2>Sintonize sua imagem</h2>
             <button onClick={handleNextStep}>PRÓXIMO</button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {/* Substitua pelo seu <NickSelector /> */}
             <h2>Como devemos te ouvir?</h2>
             <input type="text" placeholder="Seu nick" onBlur={(e) => handleFinish(e.target.value)} />
          </motion.div>
        )}
      </AnimatePresence>
      {loading && <p style={{ color: "#00f2fe", marginTop: "20px", fontSize: "10px", letterSpacing: "2px" }}>SINTONIZANDO...</p>}
    </OnboardingLayout>
  );
}
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

// ... (OnboardingLayout, AvatarSelector, NickSelector permanecem iguais)

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ id: "", avatar: "", nick: "" });

  useEffect(() => {
    const checkUser = async () => {
      // Tentativa 1: Pegar sessão rápida
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se não achar de primeira, espera 1 segundo (tempo dos cookies estabilizarem) [cite: 2025-12-29]
      if (!session) {
        await new Promise(r => setTimeout(r, 1000));
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Só expulsa se realmente, após o delay, não houver user
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/dashboard");
      } else {
        setUserData({
          id: user.id,
          avatar: user.user_metadata.avatar_url || "",
          nick: user.user_metadata.full_name || "",
        });
        setStep(1);
      }
    };
    checkUser();
  }, [router]);

  const handleNextStep = () => {
    playStepSound(false);
    setStep(2);
  };

  const handleFinish = async (finalNick: string) => {
    if (!userData.id || finalNick.length < 3) return;
    setLoading(true);
    playStepSound(true); // O Tum Dum final da sintonização [cite: 2026-01-01]

    const { error } = await supabase.from("profiles").upsert({
      id: userData.id,
      username: finalNick.trim().toLowerCase(),
      avatar_url: userData.avatar,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    });

    if (!error) {
      setTimeout(() => router.push("/dashboard"), 600);
    } else {
      setLoading(false);
      console.error("Erro na sintonização:", error);
    }
  };

  if (step === 0) return <div style={{ background: "#000", height: "100vh" }} />;

  return (
    <OnboardingLayout>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <AvatarSelector key="avatar" avatarUrl={userData.avatar} onNext={handleNextStep} />
        )}
        {step === 2 && (
          <NickSelector key="nick" initialNick={userData.nick} onFinish={handleFinish} />
        )}
      </AnimatePresence>
      {loading && <p style={{ color: "#00f2fe", marginTop: "20px", fontSize: "10px", letterSpacing: "2px" }}>SINTONIZANDO...</p>}
    </OnboardingLayout>
  );
}
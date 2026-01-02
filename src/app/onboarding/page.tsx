"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

// --- SUB-COMPONENTE: LAYOUT ---
function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100vh", background: "#000", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "100%", height: "100%", background: "radial-gradient(circle, rgba(0,242,254,0.05) 0%, rgba(0,0,0,1) 80%)" }} />
      <div style={{ zIndex: 10, width: "100%", maxWidth: "400px", textAlign: "center", padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: AVATAR ---
function AvatarSelector({ avatarUrl, onNext }: { avatarUrl: string; onNext: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px" }}>
      <div style={{ position: "relative", width: "150px", height: "150px" }}>
        <img src={avatarUrl || "/default-avatar.png"} alt="Sua Foto" style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #00f2fe", objectFit: "cover", zIndex: 2, position: "relative" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "50%", background: "#00f2fe", filter: "blur(20px)", opacity: 0.4 }} />
      </div>
      <h2 style={{ color: "#fff", fontSize: "14px", letterSpacing: "4px", fontWeight: "900" }}>ESSA É A SUA IDENTIDADE?</h2>
      <button onClick={onNext} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "12px 30px", borderRadius: "30px", cursor: "pointer", fontSize: "10px", fontWeight: "800", letterSpacing: "2px" }}>CONFIRMAR FREQUÊNCIA</button>
    </motion.div>
  );
}

// --- SUB-COMPONENTE: NICK ---
function NickSelector({ initialNick, onFinish }: { initialNick: string; onFinish: (nick: string) => void }) {
  const [nick, setNick] = useState(initialNick || "");
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "25px" }}>
      <h2 style={{ color: "#fff", fontSize: "14px", letterSpacing: "4px", fontWeight: "900" }}>COMO O MUNDO TE OUVE?</h2>
      <input 
        type="text" 
        value={nick} 
        onChange={(e) => setNick(e.target.value)} 
        placeholder="@username"
        style={{ background: "transparent", border: "none", borderBottom: "1px solid #00f2fe", color: "#fff", fontSize: "24px", textAlign: "center", outline: "none", width: "80%" }}
      />
      <button onClick={() => onFinish(nick)} style={{ background: "#00f2fe", color: "#000", padding: "15px 40px", borderRadius: "30px", cursor: "pointer", fontSize: "11px", fontWeight: "900", letterSpacing: "2px", border: "none" }}>ENTRAR NA SINTONIA</button>
    </motion.div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ id: "", avatar: "", nick: "" });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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

  const handleFinish = async (finalNick: string) => {
    if (!userData.id || finalNick.length < 3) return;
    setLoading(true);

    const { error } = await supabase.from("profiles").upsert({
      id: userData.id,
      username: finalNick.trim().toLowerCase(),
      avatar_url: userData.avatar,
      onboarding_completed: true,
      updated_at: new Date()
    });

    if (!error) {
      router.push("/dashboard");
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
          <AvatarSelector key="avatar" avatarUrl={userData.avatar} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <NickSelector key="nick" initialNick={userData.nick} onFinish={handleFinish} />
        )}
      </AnimatePresence>
      {loading && <p style={{ color: "#00f2fe", marginTop: "20px", fontSize: "10px", letterSpacing: "2px" }}>SINTONIZANDO...</p>}
    </OnboardingLayout>
  );
}
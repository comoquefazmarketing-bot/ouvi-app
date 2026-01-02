"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

// Componentes de Layout e Passos
import OnboardingLayout from "./OnboardingLayout";
import AvatarSelector from "./AvatarSelector";
import NickSelector from "./NickSelector";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0: Check, 1: Avatar, 2: Nick
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ id: "", avatar: "", nick: "" });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Verifica se o perfil já está sintonizado no banco
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
        setStep(1); // Inicia no passo do Avatar
      }
    };
    checkUser();
  }, [router]);

  const handleFinish = async (finalNick: string) => {
    if (!userData.id || finalNick.length < 3) return;
    setLoading(true);

    const inviteCode = localStorage.getItem("ouvi_invite_code");

    // Salva o perfil completo e marca como concluído
    const { error } = await supabase.from("profiles").upsert({
      id: userData.id,
      username: finalNick.trim().toLowerCase(),
      avatar_url: userData.avatar,
      onboarding_completed: true,
      invite_used: inviteCode,
      updated_at: new Date()
    });

    if (!error) {
      localStorage.removeItem("ouvi_invite_code");
      router.push("/dashboard");
    } else {
      console.error("Erro na sintonização:", error);
      alert("Este nome já está em uso ou houve um erro. Tente outro.");
      setLoading(false);
    }
  };

  if (step === 0) return <div style={{ background: "#000", height: "100vh" }} />;

  return (
    <OnboardingLayout>
      {step === 1 && (
        <AvatarSelector 
          avatarUrl={userData.avatar} 
          onNext={() => setStep(2)} 
        />
      )}
      {step === 2 && (
        <NickSelector 
          initialNick={userData.nick} 
          onFinish={handleFinish} 
        />
      )}
      
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={styles.loadingOverlay}
        >
          <p style={styles.loadingText}>SINTONIZANDO...</p>
        </motion.div>
      )}
    </OnboardingLayout>
  );
}

const styles = {
  loadingOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100
  },
  loadingText: {
    color: "#00f2fe",
    letterSpacing: "4px",
    fontSize: "12px",
    fontWeight: "900"
  }
};
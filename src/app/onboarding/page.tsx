"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OnboardingPage() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else setUserId(user.id);
    };
    checkUser();
  }, [router]);

  const handleFinish = async () => {
    if (!userId || nickname.length < 3) return;
    setLoading(true);

    // Salva o perfil e marca como sintonizado
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username: nickname.trim().toLowerCase(),
      onboarding_completed: true,
      updated_at: new Date()
    });

    if (!error) {
      router.push("/dashboard");
    } else {
      console.error(error);
      alert("Erro na sintonização. Tente outro nome.");
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", maxWidth: "300px" }}>
        <h2 style={{ letterSpacing: "4px", fontSize: "10px", opacity: 0.6 }}>SINAL DE IDENTIFICAÇÃO</h2>
        <input 
          autoFocus
          style={{ background: "none", border: "none", borderBottom: "1px solid #00f2fe", color: "#fff", textAlign: "center", padding: "10px", marginTop: "20px", outline: "none", width: "100%", fontSize: "18px" }}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="seu_nome"
        />
        <button 
          onClick={handleFinish}
          disabled={loading || nickname.length < 3}
          style={{ marginTop: "50px", background: nickname.length >= 3 ? "#00f2fe" : "#222", color: "#000", border: "none", padding: "15px 40px", borderRadius: "30px", fontWeight: "900", cursor: "pointer", transition: "0.3s" }}
        >
          {loading ? "SINTONIZANDO..." : "CONFIRMAR SINTONIA"}
        </button>
      </motion.div>
    </div>
  );
}
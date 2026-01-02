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
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username: nickname.trim().toLowerCase(),
      onboarding_completed: true,
      updated_at: new Date()
    });

    if (!error) router.push("/dashboard");
    else { alert("Erro na sintonização."); setLoading(false); }
  };

  return (
    <div style={{ background: "#000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
        <h2 style={{ color: "#fff", letterSpacing: "4px", fontSize: "12px" }}>NOME DE SINAL</h2>
        <input 
          style={{ background: "none", borderBottom: "1px solid #00f2fe", color: "#fff", textAlign: "center", padding: "10px", marginTop: "20px", outline: "none" }}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="seu_nome"
        />
        <br />
        <button 
          onClick={handleFinish}
          disabled={loading}
          style={{ marginTop: "40px", background: "#00f2fe", border: "none", padding: "10px 30px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}
        >
          {loading ? "SINTONIZANDO..." : "ENTRAR"}
        </button>
      </motion.div>
    </div>
  );
}
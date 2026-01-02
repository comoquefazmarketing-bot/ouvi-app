/**
 * PROJETO OUVI – Onboarding de Alta Fidelidade (Sintonização Sensorial)
 * Local: src/app/onboarding/page.tsx
 */

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const VoicePulse = () => (
  <div style={styles.pulseContainer}>
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        style={styles.pulseCircle}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: [1, 3], opacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
      />
    ))}
    <span style={{ fontSize: "24px", zIndex: 10 }}>🎙️</span>
  </div>
);

export default function OnboardingPage() {
  const [nickname, setNickname] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUserId(user.id);
        if (user.user_metadata?.full_name) {
          setNickname(user.user_metadata.full_name.split(' ')[0].toLowerCase());
        }
      }
    };
    checkUser();
  }, [router]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setTimeout(() => setStep(2), 1200); // Respiro para ver a foto antes de trocar
    }
  };

  const handleFinish = async () => {
    if (!userId || nickname.length < 3) return;
    setLoading(true);

    try {
      let publicAvatarUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        publicAvatarUrl = urlData.publicUrl;
      }

      // AJUSTE CORE: Upsert com onboarding_completed para destravar o Dashboard
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        username: nickname.trim().toLowerCase(),
        avatar_url: publicAvatarUrl || preview,
        onboarding_completed: true, // Libera o acesso no Dashboard
        updated_at: new Date()
      });

      if (profileError) throw profileError;

      setStep(3);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);

    } catch (e: any) {
      console.error("Erro no Onboarding:", e);
      alert("Erro ao sintonizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glow} />
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={styles.content}
          >
            <h2 style={styles.question}>IDENTIDADE VISUAL</h2>
            <div style={styles.avatarWrapper}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    ...styles.mainCircle,
                    borderColor: preview ? "#00f2fe" : "rgba(0,242,254,0.3)"
                }} 
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {preview ? <img src={preview} style={styles.preview} alt="Sinal" /> : (
                  <span style={styles.addLabel}>CAPTURAR FOTO</span>
                )}
                <input id="fileInput" type="file" onChange={handlePhotoUpload} hidden accept="image/*" />
              </motion.div>
            </div>
            <p style={styles.skip} onClick={() => setStep(2)}>Pular por enquanto</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={styles.content}
          >
            <h2 style={styles.question}>SINAL DE IDENTIFICAÇÃO</h2>
            <div style={styles.micArea}>
              {isListening ? <VoicePulse /> : (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsListening(true)}
                  style={styles.staticMic}
                >🎙️</motion.button>
              )}
            </div>
            <div style={styles.inputWrapper}>
              <span style={styles.atSymbol}>@</span>
              <input 
                autoFocus 
                type="text" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value.toLowerCase())} 
                style={styles.input} 
                placeholder="seu_nome" 
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinish} 
              disabled={nickname.length < 3 || loading} 
              style={{ 
                ...styles.btn, 
                background: nickname.length >= 3 ? "#00f2fe" : "rgba(255,255,255,0.05)", 
                color: nickname.length >= 3 ? "#000" : "#444"
              }}
            >
              {loading ? "SINTONIZANDO..." : "CONFIRMAR SINTONIA"}
            </motion.button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.content}
          >
            <motion.h1 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={styles.logo}
            >
              BEM-VINDO
            </motion.h1>
            <p style={styles.subtext}>FREQUÊNCIA ESTABELECIDA.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: { height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as const, overflow: "hidden" },
  glow: { position: "absolute" as const, width: "300px", height: "300px", background: "radial-gradient(circle, rgba(0,242,254,0.1) 0%, rgba(0,0,0,0) 70%)", zIndex: 0 },
  content: { textAlign: "center" as const, width: "100%", maxWidth: "320px", zIndex: 1, padding: "20px" },
  question: { color: "#fff", fontSize: "10px", marginBottom: "40px", letterSpacing: "4px", fontWeight: "900", opacity: 0.8 },
  avatarWrapper: { display: "flex", justifyContent: "center", marginBottom: "30px" },
  mainCircle: { width: "150px", height: "150px", borderRadius: "50%", border: "1px dashed", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", background: "rgba(0,242,254,0.02)", transition: "0.3s" },
  addLabel: { color: "#00f2fe", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" },
  preview: { width: "100%", height: "100%", objectFit: "cover" as const },
  micArea: { height: "100px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "30px" },
  pulseContainer: { position: "relative" as const, display: "flex", justifyContent: "center", alignItems: "center" },
  pulseCircle: { position: "absolute" as const, width: "50px", height: "50px", borderRadius: "50%", background: "rgba(0, 242, 254, 0.05)", border: "1px solid #00f2fe" },
  staticMic: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,242,254,0.2)", width: "70px", height: "70px", borderRadius: "50%", fontSize: "24px", cursor: "pointer" },
  inputWrapper: { display: "flex", alignItems: "center", padding: "18px", background: "rgba(255,255,255,0.03)", borderRadius: "100px", marginBottom: "30px", border: "1px solid rgba(255,255,255,0.08)" },
  atSymbol: { color: "#00f2fe", fontWeight: "900", marginRight: "10px", fontSize: "16px" },
  input: { background: "none", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "15px", fontWeight: "600" },
  btn: { width: "100%", padding: "20px", borderRadius: "100px", border: "none", fontWeight: "900", cursor: "pointer", letterSpacing: "2px", fontSize: "10px", transition: "0.4s" },
  logo: { fontSize: "28px", color: "#00f2fe", fontWeight: "900", letterSpacing: "8px" },
  subtext: { color: '#444', marginTop: '15px', fontSize: '9px', letterSpacing: '3px', fontWeight: "bold" },
  skip: { color: "#333", fontSize: "9px", cursor: "pointer", marginTop: "30px", textDecoration: "underline", fontWeight: "700", letterSpacing: "1px" }
};
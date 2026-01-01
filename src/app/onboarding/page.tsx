/**
 * PROJETO OUVI €” Onboarding de Alta Fidelidade (Consolidado)
 * Local: E:\OUVI\ouvi-app\src\app\onboarding\page.tsx
 * Autor: Felipe Makarios
 */

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// --- EFEITO VISUAL DE VOZ (PULSE) ---
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
    <span style={{ fontSize: "32px", zIndex: 10 }}>Ž</span>
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

  // Verifica autentica§£o e tenta pr©-carregar o nome
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
      // Transi§£o suave para o pr³ximo passo ap³s sele§£o
      setTimeout(() => setStep(2), 1000);
    }
  };

  const handleFinish = async () => {
    if (!userId || nickname.length < 3) return;
    setLoading(true);

    try {
      let publicAvatarUrl = "";

      // 1. Upload da foto para o bucket 'avatars'
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        publicAvatarUrl = urlData.publicUrl;
      }

      // 2. Upsert no Perfil (Cria ou atualiza o perfil do usu¡rio)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        username: nickname.trim().toLowerCase(),
        avatar_url: publicAvatarUrl || preview,
        updated_at: new Date()
      });

      if (profileError) throw profileError;

      // 3. Finaliza§£o e Redirecionamento
      setStep(3);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (e: any) {
      console.error("Erro no Onboarding:", e);
      alert("Erro ao sintonizar perfil: " + (e.message || "Tente novamente."));
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
            transition={{ duration: 0.6 }}
            style={styles.content}
          >
            <h2 style={styles.question}>BORA ESCOLHER UMA FOTO?</h2>
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
                {preview ? <img src={preview} style={styles.preview} alt="Preview" /> : (
                  <span style={styles.addLabel}>ADICIONAR</span>
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
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            style={styles.content}
          >
            <h2 style={styles.question}>COMO VOCŠ QUER SER CHAMADO?</h2>
            <div style={styles.micArea}>
              {isListening ? <VoicePulse /> : (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsListening(true)}
                  style={styles.staticMic}
                >Ž</motion.button>
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
                background: nickname.length >= 3 ? "#00f2fe" : "#111", 
                color: nickname.length >= 3 ? "#000" : "#444",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "SINTONIZANDO..." : "TUDO PRONTO!"}
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
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={styles.logo}
            >
              BEM-VINDO!
            </motion.h1>
            <p style={styles.subtext}>A FREQUŠNCIA EST ATIVA</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: { height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as const, overflow: "hidden" },
  glow: { position: "absolute" as const, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(0,242,254,0.08) 0%, rgba(0,0,0,0) 70%)" },
  content: { textAlign: "center" as const, width: "100%", maxWidth: "320px", zIndex: 1, padding: "20px" },
  question: { color: "#fff", fontSize: "11px", marginBottom: "40px", letterSpacing: "3px", fontWeight: "900" },
  avatarWrapper: { display: "flex", justifyContent: "center", marginBottom: "30px" },
  mainCircle: { width: "140px", height: "140px", borderRadius: "50%", border: "1px dashed", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", background: "rgba(0,242,254,0.02)" },
  addLabel: { color: "#00f2fe", fontSize: "10px", fontWeight: "900", letterSpacing: "1px" },
  preview: { width: "100%", height: "100%", objectFit: "cover" as const },
  micArea: { height: "100px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" },
  pulseContainer: { position: "relative" as const, display: "flex", justifyContent: "center", alignItems: "center" },
  pulseCircle: { position: "absolute" as const, width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0, 242, 254, 0.1)", border: "1px solid #00f2fe" },
  staticMic: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", width: "60px", height: "60px", borderRadius: "50%", fontSize: "20px", cursor: "pointer" },
  inputWrapper: { display: "flex", alignItems: "center", padding: "15px 20px", background: "rgba(255,255,255,0.03)", borderRadius: "20px", marginBottom: "25px", border: "1px solid rgba(255,255,255,0.08)" },
  atSymbol: { color: "#00f2fe", fontWeight: "900", marginRight: "10px", fontSize: "16px" },
  input: { background: "none", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "16px", fontWeight: "600" },
  btn: { width: "100%", padding: "18px", borderRadius: "20px", border: "none", fontWeight: "900", cursor: "pointer", letterSpacing: "2px", fontSize: "11px", transition: "0.3s" },
  logo: { fontSize: "24px", color: "#00f2fe", fontWeight: "900", letterSpacing: "6px" },
  subtext: { color: '#666', marginTop: '10px', fontSize: '9px', letterSpacing: '2px', fontWeight: "bold" },
  skip: { color: "#444", fontSize: "10px", cursor: "pointer", marginTop: "25px", textDecoration: "underline", fontWeight: "700", letterSpacing: "1px" }
};

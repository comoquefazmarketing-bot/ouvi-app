"use client";

import React, { useState } from "react";
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
    <span style={{ fontSize: "32px", zIndex: 10 }}>🎤</span>
  </div>
);

export default function OnboardingPage() {
  const [nickname, setNickname] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      // Espera um pouco para a pessoa ver a foto e muda com efeito
      setTimeout(() => setStep(2), 1200);
    }
  };

  const handleFinish = async () => {
    if (nickname.length < 3) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      let avatarPath = "";
      if (imageFile) {
        const fileName = `avatar-${user.id}-${Date.now()}`;
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .upload(fileName, imageFile);
        if (!storageError) avatarPath = fileName;
      }

      // Ajuste no Upsert para garantir que entre no banco
      const { error: profileError } = await supabase.from("profiles").upsert({ 
        id: user.id, 
        username: nickname.trim().toLowerCase(), 
        avatar_url: avatarPath,
        updated_at: new Date()
      });

      if (profileError) throw profileError;

      // Efeito visual de sucesso antes de ir pro feed
      setStep(3);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Tivemos um problema ao criar seu perfil. Tente outro nome!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Luzes de fundo para o efeito UAU */}
      <div style={styles.glow} />
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            style={styles.content}
          >
            <h2 style={styles.question}>BORA ESCOLHER UMA FOTO?</h2>
            <div style={styles.avatarWrapper}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={styles.mainCircle} 
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {preview ? <img src={preview} style={styles.preview} /> : (
                  <span style={{ color: "#00f2fe", fontSize: "14px", fontWeight: "bold" }}>ADICIONAR</span>
                )}
                <input id="fileInput" type="file" onChange={handlePhotoUpload} style={{ display: "none" }} accept="image/*" />
              </motion.div>
            </div>
            <p style={styles.skip} onClick={() => setStep(2)}>Pular por enquanto</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -100, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={styles.content}
          >
            <h2 style={styles.question}>COMO VOCÊ QUER SER CHAMADO?</h2>
            <div style={styles.micArea}>
              {isListening ? <VoicePulse /> : (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsListening(true)} // Simulação ou func real
                  style={styles.staticMic}
                >🎤</motion.button>
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
              style={{ ...styles.btn, background: nickname.length >= 3 ? "#00f2fe" : "#111", color: nickname.length >= 3 ? "#000" : "#444" }}
            >
              {loading ? "SALVANDO..." : "TUDO PRONTO!"}
            </motion.button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.content}
          >
            <motion.h1 
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={styles.logo}
            >
              BEM-VINDO!
            </motion.h1>
            <p style={{color: '#666', marginTop: '10px'}}>Sintonizando seu feed...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: { height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as "relative", overflow: "hidden" },
  glow: { position: "absolute" as "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(0,242,254,0.05) 0%, rgba(0,0,0,0) 70%)", zIndex: 0 },
  content: { textAlign: "center" as "center", width: "100%", maxWidth: "320px", zIndex: 1 },
  question: { color: "#fff", fontSize: "14px", marginBottom: "40px", letterSpacing: "2px", fontWeight: "700" },
  avatarWrapper: { display: "flex", justifyContent: "center", marginBottom: "30px" },
  mainCircle: { width: "140px", height: "140px", borderRadius: "50%", border: "2px dashed #00f2fe", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", background: "rgba(0,242,254,0.02)" },
  preview: { width: "100%", height: "100%", objectFit: "cover" as "cover" },
  micArea: { height: "120px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" },
  pulseContainer: { position: "relative" as "relative", display: "flex", justifyContent: "center", alignItems: "center" },
  pulseCircle: { position: "absolute" as "absolute", width: "50px", height: "50px", borderRadius: "50%", background: "rgba(0, 242, 254, 0.1)", border: "1px solid #00f2fe" },
  staticMic: { background: "#111", border: "none", width: "70px", height: "70px", borderRadius: "50%", cursor: "pointer", fontSize: "24px", boxShadow: "0 0 20px rgba(0,0,0,0.5)" },
  inputWrapper: { display: "flex", alignItems: "center", padding: "18px", background: "#111", borderRadius: "15px", marginBottom: "25px", border: "1px solid #222" },
  atSymbol: { color: "#00f2fe", fontWeight: "bold", marginRight: "10px", fontSize: "18px" },
  input: { background: "none", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "18px" },
  btn: { width: "100%", padding: "20px", borderRadius: "15px", border: "none", fontWeight: "bold", cursor: "pointer", transition: "0.3s", letterSpacing: "1px" },
  logo: { fontSize: "32px", color: "#00f2fe", fontWeight: "900", letterSpacing: "5px" },
  skip: { color: "#444", fontSize: "12px", cursor: "pointer", marginTop: "25px", textDecoration: "underline" }
};
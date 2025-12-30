"use client";
import React from "react";
import { motion } from "framer-motion";

export default function AvatarSelector({ avatarUrl, onNext }: { avatarUrl: string; onNext: () => void }) {
  return (
    <div style={styles.stepContainer}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        style={styles.avatarWrapper}
      >
        <img src={avatarUrl || "/default-avatar.png"} alt="Sua Foto" style={styles.avatarImg} />
        <div style={styles.glow} />
      </motion.div>
      <h2 style={styles.title}>ESSA É A SUA IDENTIDADE?</h2>
      <button onClick={onNext} style={styles.nextBtn}>CONFIRMAR FREQUÊNCIA</button>
    </div>
  );
}

const styles = {
  stepContainer: { display: "flex", flexDirection: "column" as "column", alignItems: "center", gap: "30px" },
  avatarWrapper: { position: "relative" as "relative", width: "150px", height: "150px" },
  avatarImg: { width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #00f2fe", objectFit: "cover" as "cover", zIndex: 2, position: "relative" as "relative" },
  glow: { position: "absolute" as "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "50%", background: "#00f2fe", filter: "blur(20px)", opacity: 0.4 },
  title: { color: "#fff", fontSize: "14px", letterSpacing: "4px", fontWeight: "900" },
  nextBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "12px 30px", borderRadius: "30px", cursor: "pointer", fontSize: "10px", fontWeight: "800", letterSpacing: "2px" }
};
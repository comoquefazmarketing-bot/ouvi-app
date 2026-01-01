"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ReactionBar({ commentId, initialReactions, onReply }: any) {
  const [liked, setLiked] = useState(false);
  const [isElectrified, setIsElectrified] = useState(false);

  // Gatilho de Energia (Raio)
  const triggerEnergy = (e: any) => {
    e.stopPropagation();
    setIsElectrified(true);
    setTimeout(() => setIsElectrified(false), 800);
  };

  return (
    <div style={styles.wrapper}>
      {/* Feedback de Choque Sutil */}
      {isElectrified && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.5, 0], scale: [1, 1.05, 1] }}
          style={styles.shockPulse}
        />
      )}

      <div style={styles.pill}>
        {/* ENERGIA - ⚡ */}
        <motion.button 
          onClick={triggerEnergy}
          whileTap={{ scale: 0.8 }}
          style={styles.iconBtn}
        >
          <span style={{...styles.emoji, color: "#ffdf00", filter: isElectrified ? "drop-shadow(0 0 10px #ffdf00)" : "none"}}>
            ⚡
          </span>
          <span style={styles.count}>{initialReactions?.energy || 0}</span>
        </motion.button>

        <div style={styles.divider} />

        {/* RESPONDER (MICROFONE) - 🎙️ */}
        {/* Este botão agora é o portal para a Thread da Thread */}
        <motion.button 
          onClick={(e) => { e.stopPropagation(); onReply(); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={styles.iconBtn}
        >
          <span style={{...styles.emoji, color: "#00f2fe"}}>🎙️</span>
        </motion.button>

        <div style={styles.divider} />

        {/* CURTIR - ❤️ */}
        <motion.button 
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          whileTap={{ scale: 1.4 }}
          style={styles.iconBtn}
        >
          <motion.span 
            animate={{ 
              scale: liked ? [1, 1.2, 1] : 1,
              filter: liked ? "grayscale(0) drop-shadow(0 0 5px #ff0000)" : "grayscale(1) opacity(0.5)"
            }}
            style={styles.emoji}
          >
            ❤️
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { 
    display: "flex", 
    justifyContent: "flex-end", 
    width: "100%", 
    marginTop: "8px",
    position: "relative" as const 
  },
  shockPulse: {
    position: "absolute" as const,
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: "100px",
    border: "1px solid #ffdf00",
    pointerEvents: "none" as const,
    zIndex: 1
  },
  pill: { 
    display: "flex", 
    alignItems: "center", 
    padding: "4px 12px", 
    background: "rgba(15, 15, 15, 0.6)", 
    backdropFilter: "blur(10px)", 
    borderRadius: "100px", 
    border: "1px solid rgba(255,255,255,0.05)", 
    gap: "12px" 
  },
  iconBtn: { 
    background: "none", 
    border: "none", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center",
    padding: "4px"
  },
  emoji: { fontSize: "14px", transition: "all 0.3s ease" },
  count: { fontSize: "9px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" as const, marginLeft: "4px" },
  divider: { width: "1px", height: "12px", background: "rgba(255,255,255,0.08)" }
};
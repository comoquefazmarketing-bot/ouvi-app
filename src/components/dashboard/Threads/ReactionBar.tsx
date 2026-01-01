/**
 * PROJETO OUVI – ReactionBar ELITE (Sintonizado)
 * Ajustes: Microfone Portal, Coração Dinâmico e Raio Eletrificado
 */

"use client";
import React, { useState } from "react";
import { motion, useAnimation } from "framer-motion";

export default function ReactionBar({ postId, commentId, initialReactions, onOpenThread }: any) {
  const [liked, setLiked] = useState(false);
  const [isElectrified, setIsElectrified] = useState(false);
  const [reactions] = useState(initialReactions || { loved_by: [], energy: 0 });

  // 1. Lógica do Portal (Microfone)
  const handlePortal = (e: any) => {
    e.stopPropagation();
    if (onOpenThread) onOpenThread(commentId || postId);
  };

  // 2. Supermotion do Raio
  const triggerEnergy = (e: any) => {
    e.stopPropagation();
    setIsElectrified(true);
    setTimeout(() => setIsElectrified(false), 1500); // Duração do choque
  };

  return (
    <div style={styles.wrapper} onClick={(e) => e.stopPropagation()}>
      {/* Efeito de Choque no Post (Overlay Invisível que brilha) */}
      {isElectrified && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          style={styles.shockOverlay}
        />
      )}

      <motion.div layout style={styles.pill}>
        <div style={styles.leftGroup}>
          
          {/* RAIO - O DISPARADOR DE ENERGIA */}
          <motion.button 
            onClick={triggerEnergy}
            whileHover={{ scale: 1.3, rotate: -20 }}
            whileTap={{ scale: 0.7 }}
            style={styles.iconBtn}
          >
            <motion.span 
              animate={isElectrified ? { filter: ["drop-shadow(0 0 2px #ffdf00)", "drop-shadow(0 0 20px #ffdf00)", "drop-shadow(0 0 2px #ffdf00)"] } : {}}
              style={{...styles.emoji, color: "#ffdf00"}}
            >
              ⚡
            </motion.span>
            <span style={styles.count}>{reactions?.energy || 0}</span>
          </motion.button>

          {/* COMENTÁRIOS */}
          <motion.button 
            onClick={handlePortal}
            whileHover={{ y: -3 }}
            style={styles.iconBtn}
          >
            <span style={styles.emoji}>💬</span>
          </motion.button>

          {/* MICROFONE - O PORTAL (CORRIGIDO) */}
          <div style={styles.micWrapper}>
            <motion.div 
              onClick={handlePortal}
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px #00f2fe" }}
              whileTap={{ scale: 0.9 }}
              style={styles.innerMic}
            >
              <span style={{ fontSize: "20px" }}>🎙️</span>
            </motion.div>
          </div>

          {/* CORAÇÃO - BRANCO -> VERMELHO */}
          <motion.button 
            onClick={() => setLiked(!liked)}
            whileTap={{ scale: 1.5 }}
            style={styles.iconBtn}
          >
            <motion.span 
              animate={{ 
                scale: liked ? [1, 1.4, 1] : 1,
                filter: liked 
                  ? "grayscale(0) drop-shadow(0 0 8px #ff0000)" 
                  : "grayscale(1) brightness(2)" 
              }}
              style={{...styles.emoji, color: liked ? "#ff0000" : "#fff"}}
            >
              ❤️
            </motion.span>
          </motion.button>
        </div>

        <div style={styles.divider} />

        <motion.button onClick={handlePortal} style={styles.threadBtn}>
          O QUE ESTÃO FALANDO...
        </motion.button>
      </motion.div>
    </div>
  );
}

const styles = {
  wrapper: { position: "relative" as const, display: "flex", justifyContent: "flex-end", width: "100%" },
  shockOverlay: {
    position: "absolute" as const, top: -100, left: -500, right: -100, bottom: -100,
    border: "2px solid #ffdf00", borderRadius: "40px", pointerEvents: "none" as const,
    boxShadow: "inset 0 0 30px #ffdf00, 0 0 50px #ffdf00", zIndex: 99
  },
  pill: { display: "flex", alignItems: "center", padding: "5px 18px", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(20px)", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)", gap: "15px" },
  leftGroup: { display: "flex", alignItems: "center", gap: "22px" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" },
  emoji: { fontSize: "19px", transition: "filter 0.3s ease" },
  count: { fontSize: "11px", color: "#fff", fontWeight: "900" as const, marginLeft: "4px" },
  micWrapper: { position: "relative" as const },
  innerMic: { width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(0,242,254,0.1)", border: "1px solid rgba(0,242,254,0.2)" },
  divider: { width: "1px", height: "18px", background: "rgba(255,255,255,0.1)", margin: "0 5px" },
  threadBtn: { background: "none", border: "none", color: "#00f2fe", fontSize: "9px", fontWeight: "900" as const, letterSpacing: "1px", cursor: "pointer", textShadow: "0 0 8px #00f2fe" }
};
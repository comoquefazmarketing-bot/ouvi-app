"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function ReactionBar({ postId, initialReactions, onOpenThread, onRefresh }: any) {
  const [isElectrified, setIsElectrified] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleSignal = async (type: 'zap' | 'heart' | 'mic') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (type === 'zap') {
        setIsElectrified(true);
        setTimeout(() => setIsElectrified(false), 800);
      }
      
      if (type === 'heart') setLiked(true);

      const { error } = await supabase
        .from('post_reactions')
        .insert([{ post_id: postId, user_id: user.id, type }]);

      if (!error && onRefresh) onRefresh(); 
    } catch (err) {
      console.error("Erro no sinal:", err);
    }
  };

  const getCount = (type: string) => (initialReactions || []).filter((r: any) => r.type === type).length;

  return (
    <div style={styles.pillContainer}>
      <AnimatePresence>
        {isElectrified && <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], scale: [1, 2.5] }} style={styles.shock} />}
      </AnimatePresence>

      <div style={styles.pill}>
        {/* ENERGIA */}
        <button onClick={() => handleSignal('zap')} style={styles.iconBtn}>
          <span style={{...styles.emoji, color: "#ffdf00"}}>⚡</span>
          <span style={styles.count}>{getCount('zap')}</span>
        </button>

        <div style={styles.divider} />

        {/* MICROFONE */}
        <button onClick={() => handleSignal('mic')} style={styles.iconBtn}>
          <span style={{...styles.emoji, color: "#00f2fe"}}>🎙️</span>
          <span style={styles.count}>{getCount('mic')}</span>
        </button>

        <div style={styles.divider} />

        {/* CORAÇÃO COM BATIDA REAL */}
        <button onClick={() => handleSignal('heart')} style={styles.iconBtn}>
          <motion.span 
            animate={liked ? {
              scale: [1, 1.2, 1.1, 1.4, 1], // Batida dupla: tum-tum
              color: "#ff0000",
              filter: "drop-shadow(0 0 8px #ff0000)"
            } : {
              scale: 1,
              color: "rgba(255, 255, 255, 0.3)" // Cinza sutil "em repouso"
            }}
            transition={liked ? { duration: 0.6, ease: "easeInOut" } : {}}
            style={styles.emoji}
          >
            ❤️
          </motion.span>
          <span style={styles.count}>{getCount('heart')}</span>
        </button>

        <div style={styles.divider} />

        {/* PORTAL BALÃO */}
        <button onClick={onOpenThread} style={styles.iconBtn}>
          <span style={{...styles.emoji, color: "#fff", opacity: 0.6}}>🗯️</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  pillContainer: { position: "relative" as const, display: "flex", alignItems: "center" },
  shock: { position: "absolute" as const, inset: -10, borderRadius: "100px", border: "2px solid #ffdf00", pointerEvents: "none" as const },
  pill: { 
    display: "flex", alignItems: "center", padding: "6px 16px", 
    background: "rgba(15, 15, 15, 0.8)", backdropFilter: "blur(20px)", 
    borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)", gap: "12px" 
  },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" },
  emoji: { fontSize: "16px", display: "block", transition: "color 0.3s ease" },
  count: { fontSize: "10px", color: "#fff", fontWeight: "900" as const, opacity: 0.6 },
  divider: { width: "1px", height: "14px", background: "rgba(255,255,255,0.1)" }
};
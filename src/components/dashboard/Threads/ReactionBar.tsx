"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function ReactionBar({ postId, initialReactions, onOpenThread, onRefresh }: any) {
  const [isElectrified, setIsElectrified] = useState(false);
  const [liked, setLiked] = useState(false);
  
  // Usamos o initialReactions vindo do pai para evitar loops de estado interno
  const counts = useMemo(() => ({
    zap: (initialReactions || []).filter((r: any) => r.type === 'zap').length,
    mic: (initialReactions || []).filter((r: any) => r.type === 'mic').length,
    heart: (initialReactions || []).filter((r: any) => r.type === 'heart').length,
  }), [initialReactions]);

  // Efeito de choque visual disparado pelo contador de Zaps
  useEffect(() => {
    if (counts.zap > 0) {
      setIsElectrified(true);
      const timer = setTimeout(() => setIsElectrified(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [counts.zap]);

  const handleSignal = async (e: React.MouseEvent, type: 'zap' | 'heart' | 'mic') => {
    e.preventDefault();
    e.stopPropagation();

    if (type === 'mic') {
      onOpenThread();
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (type === 'heart') setLiked(true);

      // Inserção simples. O refresh do pai cuidará de atualizar o feed sem travar o socket.
      await supabase.from('post_reactions').insert([{ post_id: postId, user_id: user.id, type }]);
      
      if (onRefresh) onRefresh(); 
    } catch (err) {
      console.error("Erro no sinal:", err);
    }
  };

  return (
    <div style={styles.pillContainer} onClick={(e) => e.stopPropagation()}>
      <AnimatePresence>
        {(isElectrified || counts.zap > 10) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.2, 0.5, 0.2], // Opacidade bem baixa para não matar a GPU
              boxShadow: ["0 0 8px #ffdf00", "0 0 15px #ffdf00", "0 0 8px #ffdf00"]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={styles.lightningBorder}
          />
        )}
      </AnimatePresence>

      <div style={{
        ...styles.pill, 
        borderColor: counts.zap > 10 ? "rgba(255, 223, 0, 0.3)" : "rgba(255,255,255,0.08)"
      }}>
        <div style={styles.reactionGroup}>
          <button onClick={(e) => handleSignal(e, 'zap')} style={styles.iconBtn}>
            <span style={{...styles.emoji, color: "#ffdf00"}}>⚡</span>
            <span style={styles.count}>{counts.zap}</span>
          </button>

          <button onClick={(e) => handleSignal(e, 'mic')} style={styles.iconBtn}>
            <span style={{...styles.emoji, color: "#00f2fe"}}>🎙️</span>
            <span style={styles.count}>{counts.mic}</span>
          </button>

          <button onClick={(e) => handleSignal(e, 'heart')} style={styles.iconBtn}>
            <motion.span animate={liked ? { scale: [1, 1.3, 1] } : {}} style={styles.emoji}>❤️</motion.span>
            <span style={styles.count}>{counts.heart}</span>
          </button>
        </div>

        <div style={styles.divider} />

        <button onClick={(e) => { e.stopPropagation(); onOpenThread(); }} style={styles.balloonBtn}>
          <span style={styles.balloonEmoji}>🗯️</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  pillContainer: { position: "relative" as const, display: "flex", alignItems: "center" },
  lightningBorder: { position: "absolute" as const, inset: -3, borderRadius: "100px", border: "1.5px solid #ffdf00", pointerEvents: "none" as const, zIndex: 0 },
  pill: { display: "flex", alignItems: "center", padding: "4px 10px", background: "#0a0a0a", borderRadius: "100px", border: "1px solid", gap: "6px", position: "relative" as const, zIndex: 1 },
  reactionGroup: { display: "flex", alignItems: "center", gap: "8px" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", padding: "2px" },
  emoji: { fontSize: "14px" },
  count: { fontSize: "9px", color: "#fff", fontWeight: "900" as const, opacity: 0.6, fontFamily: "monospace" },
  divider: { width: "1px", height: "12px", background: "rgba(255,255,255,0.15)" },
  balloonBtn: { background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" },
  balloonEmoji: { fontSize: "16px", opacity: 0.9 }
};
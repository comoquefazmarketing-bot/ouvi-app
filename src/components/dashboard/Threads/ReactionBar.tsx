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
        {isElectrified && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }} 
            animate={{ opacity: [0, 1, 0], scale: [1, 2.5] }} 
            style={styles.shock} 
          />
        )}
      </AnimatePresence>

      <div style={styles.pill}>
        {/* ENERGIA (ZAP) */}
        <motion.button 
          onClick={() => handleSignal('zap')} 
          style={styles.iconBtn}
          whileHover={{ scale: 1.2, rotate: -10 }}
          whileTap={{ scale: 0.8 }}
        >
          <span style={{...styles.emoji, color: "#ffdf00"}}>⚡</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={getCount('zap')}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.6, y: 0 }}
              style={styles.count}
            >
              {getCount('zap')}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <div style={styles.divider} />

        {/* MICROFONE (CORE) */}
        <motion.button 
          onClick={() => handleSignal('mic')} 
          style={styles.iconBtn}
          whileHover={{ scale: 1.2, y: -2 }}
          whileTap={{ scale: 0.8 }}
        >
          <span style={{...styles.emoji, color: "#00f2fe"}}>🎙️</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={getCount('mic')}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.6, y: 0 }}
              style={styles.count}
            >
              {getCount('mic')}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <div style={styles.divider} />

        {/* CORAÇÃO (BATIDA REAL) */}
        <motion.button 
          onClick={() => handleSignal('heart')} 
          style={styles.iconBtn}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        >
          <motion.span 
            animate={liked ? {
              scale: [1, 1.3, 1.1, 1.5, 1],
              color: "#ff0000",
              filter: "drop-shadow(0 0 8px #ff0000)"
            } : {
              scale: 1,
              color: "rgba(255, 255, 255, 0.3)"
            }}
            transition={liked ? { duration: 0.6, ease: "easeInOut" } : {}}
            style={styles.emoji}
          >
            ❤️
          </motion.span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={getCount('heart')}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.6, y: 0 }}
              style={styles.count}
            >
              {getCount('heart')}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <div style={styles.divider} />

        {/* PORTAL BALÃO (COMENTÁRIOS) */}
        <motion.button 
          onClick={onOpenThread} 
          style={styles.iconBtn}
          whileHover={{ scale: 1.2, x: 2 }}
          whileTap={{ scale: 0.9 }}
        >
          <span style={{...styles.emoji, color: "#fff", opacity: 0.8}}>🗯️</span>
        </motion.button>
      </div>
    </div>
  );
}

const styles = {
  pillContainer: { position: "relative" as const, display: "flex", alignItems: "center" },
  shock: { position: "absolute" as const, inset: -10, borderRadius: "100px", border: "2px solid #ffdf00", pointerEvents: "none" as const },
  pill: { 
    display: "flex", alignItems: "center", padding: "6px 14px", 
    background: "rgba(10, 10, 10, 0.9)", backdropFilter: "blur(25px)", 
    borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)", gap: "10px" 
  },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", outline: "none" },
  emoji: { fontSize: "15px", display: "block" },
  count: { fontSize: "10px", color: "#fff", fontWeight: "900" as const, fontFamily: "monospace" },
  divider: { width: "1px", height: "14px", background: "rgba(255,255,255,0.12)" }
};
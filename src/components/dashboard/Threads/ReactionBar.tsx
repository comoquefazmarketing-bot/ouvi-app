"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function ReactionBar({ postId, initialReactions, onOpenThread, onRefresh }: any) {
  const [isElectrified, setIsElectrified] = useState(false);
  const [liked, setLiked] = useState(false);
  const [liveReactions, setLiveReactions] = useState(initialReactions || []);

  // MOTOR REALTIME: Mantém os números sintonizados sem refresh
  useEffect(() => {
    setLiveReactions(initialReactions);
    const channel = supabase
      .channel(`live_reactions_${postId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'post_reactions',
        filter: `post_id=eq.${postId}` 
      }, (payload) => {
        setLiveReactions((prev: any) => [...prev, payload.new]);
        if (payload.new.type === 'zap') {
          setIsElectrified(true);
          setTimeout(() => setIsElectrified(false), 1000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, initialReactions]);

  const counts = useMemo(() => ({
    zap: liveReactions.filter((r: any) => r.type === 'zap').length,
    mic: liveReactions.filter((r: any) => r.type === 'mic').length,
    heart: liveReactions.filter((r: any) => r.type === 'heart').length,
  }), [liveReactions]);

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

      await supabase.from('post_reactions').insert([{ post_id: postId, user_id: user.id, type }]);
      if (onRefresh) onRefresh(); 
    } catch (err) {
      console.error("Erro no sinal:", err);
    }
  };

  return (
    <div style={styles.pillContainer} onClick={(e) => e.stopPropagation()}>
      {/* O RAIO PERSISTENTE EM VOLTA DA PÍLULA */}
      <AnimatePresence>
        {(isElectrified || counts.zap > 10) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.4, 1, 0.4],
              boxShadow: [
                "0 0 10px #ffdf00, inset 0 0 5px #ffdf00",
                "0 0 25px #ffdf00, inset 0 0 12px #ffdf00",
                "0 0 10px #ffdf00, inset 0 0 5px #ffdf00"
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={styles.lightningBorder}
          />
        )}
      </AnimatePresence>

      <div style={{
        ...styles.pill, 
        borderColor: counts.zap > 10 ? "rgba(255, 223, 0, 0.4)" : "rgba(255,255,255,0.08)"
      }}>
        <div style={styles.reactionGroup}>
          {/* ZAP */}
          <motion.button onClick={(e) => handleSignal(e, 'zap')} style={styles.iconBtn} whileHover={{ scale: 1.2 }}>
            <span style={{...styles.emoji, color: "#ffdf00"}}>⚡</span>
            <span style={styles.count}>{counts.zap}</span>
          </motion.button>

          {/* MIC - PORTAL */}
          <motion.button onClick={(e) => handleSignal(e, 'mic')} style={styles.iconBtn} whileHover={{ scale: 1.2, y: -2 }}>
            <span style={{...styles.emoji, color: "#00f2fe"}}>🎙️</span>
            <span style={styles.count}>{counts.mic}</span>
          </motion.button>

          {/* HEART */}
          <motion.button onClick={(e) => handleSignal(e, 'heart')} style={styles.iconBtn} whileHover={{ scale: 1.2 }}>
            <motion.span animate={liked ? { scale: [1, 1.4, 1] } : {}} style={styles.emoji}>❤️</motion.span>
            <span style={styles.count}>{counts.heart}</span>
          </motion.button>
        </div>

        <div style={styles.divider} />

        {/* BALÃO - PORTAL COM EFEITO PREMIUM */}
        <motion.button 
          onClick={(e) => { e.stopPropagation(); onOpenThread(); }} 
          style={styles.balloonBtn}
          whileHover={{ scale: 1.3, rotate: -5, filter: "drop-shadow(0 0 8px #00f2fe)" }}
        >
          <span style={styles.balloonEmoji}>🗯️</span>
        </motion.button>
      </div>
    </div>
  );
}

const styles = {
  pillContainer: { position: "relative" as const, display: "flex", alignItems: "center" },
  lightningBorder: { position: "absolute" as const, inset: -3, borderRadius: "100px", border: "2px solid #ffdf00", pointerEvents: "none" as const, zIndex: 0 },
  pill: { 
    display: "flex", alignItems: "center", padding: "4px 10px", 
    background: "rgba(10, 10, 10, 0.95)", backdropFilter: "blur(20px)", 
    borderRadius: "100px", border: "1px solid", gap: "6px",
    position: "relative" as const, zIndex: 1
  },
  reactionGroup: { display: "flex", alignItems: "center", gap: "8px" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", padding: "2px" },
  emoji: { fontSize: "14px" },
  count: { fontSize: "9px", color: "#fff", fontWeight: "900" as const, opacity: 0.6, fontFamily: "monospace" },
  divider: { width: "1px", height: "12px", background: "rgba(255,255,255,0.15)" },
  balloonBtn: { background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" },
  balloonEmoji: { fontSize: "16px", opacity: 0.9 }
};
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function ReactionBar({ postId, initialReactions, onReply, onRefresh }: any) {
  const [isElectrified, setIsElectrified] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  const handleSignal = async (type: 'zap' | 'heart' | 'mic') => {
    if (type === 'zap') {
      setIsElectrified(true);
      setTimeout(() => setIsElectrified(false), 800);
    }
    
    if (type === 'mic') {
      setIsPortalOpen(true);
      setTimeout(() => { setIsPortalOpen(false); onReply(); }, 600);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('post_reactions').insert([{ post_id: postId, user_id: user.id, type }]);
    if (onRefresh) onRefresh();
  };

  const getCount = (type: string) => (initialReactions || []).filter((r: any) => r.type === type).length;

  return (
    <div style={styles.wrapper}>
      <AnimatePresence>
        {isElectrified && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], scale: [1, 2] }} style={styles.shockPulse} />
        )}
        {isPortalOpen && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 15, opacity: [0, 1, 0] }} transition={{ duration: 0.6 }} style={styles.portalFlash} />
        )}
      </AnimatePresence>

      <div style={styles.pill}>
        {/* ENERGIA */}
        <motion.button onClick={(e) => { e.stopPropagation(); handleSignal('zap'); }} whileTap={{ scale: 0.6 }} style={styles.iconBtn}>
          <span style={{...styles.emoji, color: "#ffdf00", filter: isElectrified ? "drop-shadow(0 0 15px #ffdf00)" : "none"}}>⚡</span>
          <span style={styles.count}>{getCount('zap')}</span>
        </motion.button>

        <div style={styles.divider} />

        {/* PORTAL MICROFONE */}
        <motion.button onClick={(e) => { e.stopPropagation(); handleSignal('mic'); }} whileHover={{ scale: 1.3, rotate: -10 }} style={styles.iconBtn}>
          <span style={{...styles.emoji, color: "#00f2fe", textShadow: "0 0 10px #00f2fe"}}>🎙️</span>
          <span style={styles.count}>{getCount('mic')}</span>
        </motion.button>

        <div style={styles.divider} />

        {/* CORAÇÃO */}
        <motion.button onClick={(e) => { e.stopPropagation(); handleSignal('heart'); }} whileTap={{ scale: 1.5 }} style={styles.iconBtn}>
          <span style={styles.emoji}>❤️</span>
          <span style={styles.count}>{getCount('heart')}</span>
        </motion.button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: "relative" as const, display: "flex", alignItems: "center" },
  shockPulse: { position: "absolute" as const, inset: -10, borderRadius: "100px", border: "2px solid #ffdf00", pointerEvents: "none" as const },
  portalFlash: { position: "absolute" as const, width: "10px", height: "10px", background: "radial-gradient(circle, #00f2fe 0%, transparent 70%)", borderRadius: "50%", zIndex: 99, pointerEvents: "none" as const },
  pill: { display: "flex", alignItems: "center", padding: "6px 16px", background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(15px)", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)", gap: "12px" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
  emoji: { fontSize: "15px", transition: "all 0.3s ease" },
  count: { fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "900" as const },
  divider: { width: "1px", height: "14px", background: "rgba(255,255,255,0.1)" }
};
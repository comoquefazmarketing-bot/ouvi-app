/**
 * PROJETO OUVI – PostCard CORE SENSORIAL (2026)
 * Gamificação: Progressão Elétrica (Yellow Voltage)
 * Status: Sintonizado para máxima conversão e impacto visual
 */

"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion, AnimatePresence } from "framer-motion";

export default function PostCard({ post, onOpenThread, onDelete }: any) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  // LÓGICA DE INTENSIDADE (GAMIFICAÇÃO) [cite: 2026-01-01]
  const zapCount = useMemo(() => 
    (post.reactions || []).filter((r: any) => r.type === 'zap').length, 
    [post.reactions]
  );
  
  const MAX_ZAP = 50;
  const intensity = Math.min(zapCount / MAX_ZAP, 1); // Ratio de 0 a 1

  const previewComments = (post.audio_comments || []).slice(0, 4);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{
        ...styles.card,
        // Borda e brilho crescem com o número de raios
        border: `1px solid rgba(255, 215, 0, ${0.1 + intensity * 0.6})`,
        boxShadow: zapCount > 0 
          ? `0 0 ${intensity * 30}px rgba(255, 215, 0, ${intensity * 0.4})` 
          : "none"
      }}
      animate={intensity === 1 ? {
        x: [-0.5, 0.5, -0.5, 0.5, 0], // Tremor de sobrecarga no nível 50
        transition: { repeat: Infinity, duration: 0.1 }
      } : {}}
    >
      {/* CAMADA DE SOBRECARGA (Aparece no MAX) */}
      {intensity === 1 && (
        <motion.div 
          style={styles.electricOverlay}
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 0.2, repeat: Infinity }}
        />
      )}

      <div style={styles.header}>
        <div style={styles.userInfo}>
          <img src={post.profiles?.avatar_url || "/default-avatar.png"} style={styles.avatar} alt="User" />
          <div style={styles.nameGroup}>
            <span style={styles.username}>@{post.profiles?.username || "membro"}</span>
            <span style={styles.date}>30/12/2025</span>
          </div>
        </div>
        <button style={styles.dotsBtn}>•••</button>
      </div>

      <div style={styles.content} onClick={() => onOpenThread(post)}>
        {post.image_url && (
          <div style={styles.imageContainer}>
            <img src={post.image_url} style={styles.postImage} alt="Post" />
          </div>
        )}
        <div style={styles.bodyTextContainer}>
          {post.content && <p style={styles.text}>{post.content}</p>}
        </div>
      </div>

      {/* ESCADA DE VOZES */}
      {previewComments.length > 0 && (
        <div style={styles.multiPreviewContainer} onClick={() => onOpenThread(post)}>
          {previewComments.map((comm: any, i: number) => (
            <motion.div key={comm.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={styles.previewBox}>
              <span style={styles.previewUser}>@{comm.profiles?.username || "membro"}</span>
              <p style={styles.previewText}>{comm.content || "Voz sintonizada..."}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* FOOTER: A MÁGICA SENSORIAL SINTONIZADA */}
      <div style={styles.footer}>
        <div style={styles.reactionSide}>
          {/* ReactionBar agora focado nos 4 emojis dentro da pílula */}
          <ReactionBar postId={post.id} initialReactions={post.reactions} onOpenThread={() => onOpenThread(post)} />
          
          <motion.div 
            whileHover={{ scale: 1.25, color: intensity > 0.5 ? "#FFD700" : "#00f2fe" }} 
            onClick={() => onOpenThread(post)} 
            style={styles.chatIconWrapper}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </motion.div>
        </div>
        
        {/* BOTÃO CORE: Reage à eletricidade */}
        <motion.button 
          onClick={() => onOpenThread(post)} 
          style={{
            ...styles.coreBtn,
            color: intensity > 0.5 ? "#FFD700" : "#00f2fe",
            borderColor: intensity > 0.5 ? "rgba(255, 215, 0, 0.4)" : "rgba(0, 242, 254, 0.25)",
            background: intensity > 0.5 ? "rgba(255, 215, 0, 0.05)" : "rgba(0, 242, 254, 0.04)"
          }}
          animate={{ 
            boxShadow: intensity === 1 
              ? ["0 0 10px #FFD700", "0 0 20px #FFD700", "0 0 10px #FFD700"] 
              : ["0 0 4px rgba(0, 242, 254, 0.1)", "0 0 16px rgba(0, 242, 254, 0.4)", "0 0 4px rgba(0, 242, 254, 0.1)"]
          }}
          transition={{ repeat: Infinity, duration: intensity === 1 ? 0.5 : 2.5 }}
        >
          {intensity === 1 ? "SINAL EMERGENCIAL" : "O QUE ESTÃO FALANDO..."}
        </motion.button>
      </div>
    </motion.div>
  );
}

const styles = {
  card: { background: "#050505", borderRadius: "28px", marginBottom: "25px", overflow: "hidden", position: "relative" as const, transition: "border 0.3s ease" },
  electricOverlay: { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255, 215, 0, 0.03)", pointerEvents: "none" as const, zIndex: 1 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #222", objectFit: "cover" as const },
  nameGroup: { display: "flex", flexDirection: "column" as const },
  username: { color: "#fff", fontWeight: "900" as const, fontSize: "13px" },
  date: { color: "#333", fontSize: "9px" },
  dotsBtn: { background: "none", border: "none", color: "#333", fontSize: "16px", cursor: "pointer" },
  content: { cursor: "pointer" },
  imageContainer: { width: "100%", background: "#000" },
  postImage: { width: "100%", height: "auto", display: "block", opacity: 0.85 },
  bodyTextContainer: { padding: "15px 20px 5px" },
  text: { color: "#fff", fontSize: "15px", lineHeight: "1.4", fontWeight: "300" as const },
  multiPreviewContainer: { padding: "0 20px", cursor: "pointer", marginBottom: "15px" },
  previewBox: { background: "rgba(255, 255, 255, 0.02)", padding: "8px 12px", borderRadius: "12px", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.03)" },
  previewUser: { color: "#00f2fe", fontSize: "9px", fontWeight: "900" as const },
  previewText: { color: "#666", fontSize: "10px" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid #0d0d0d" },
  reactionSide: { display: "flex", alignItems: "center", gap: "15px" },
  chatIconWrapper: { color: "#444", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.3s ease" },
  coreBtn: { 
    borderWidth: "1px",
    borderStyle: "solid",
    fontSize: "9px", 
    fontWeight: "900" as const, 
    cursor: "pointer", 
    letterSpacing: "1px", 
    padding: "10px 18px",
    borderRadius: "20px",
    textShadow: "0 0 10px rgba(0, 242, 254, 0.4)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  }
};
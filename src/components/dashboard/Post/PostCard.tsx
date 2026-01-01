/**
 * PROJETO OUVI – PostCard CORE SENSORIAL (2026)
 * Foco: Mega experiência no botão de conversão (Core Business)
 */

"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion, AnimatePresence } from "framer-motion";

export default function PostCard({ post, onOpenThread, onDelete }: any) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const previewComments = (post.audio_comments || []).slice(0, 4);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={styles.card}
    >
      {/* HEADER E CONTEÚDO (Mantidos conforme sua aprovação) */}
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

      {/* FOOTER: A MÁGICA SENSORIAL */}
      <div style={styles.footer}>
        <div style={styles.reactionSide}>
          <ReactionBar postId={post.id} initialReactions={post.reactions} onOpenThread={() => onOpenThread(post)} />
          
          {/* ÍCONE DE BALÃO À ESQUERDA (Junto aos outros ícones) */}
          <motion.div whileHover={{ scale: 1.2, color: "#00f2fe" }} onClick={() => onOpenThread(post)} style={styles.chatIconWrapper}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </motion.div>
        </div>
        
        {/* BOTÃO CORE: MEGA EXPERIÊNCIA SENSORIAL */}
        <motion.button 
          onClick={() => onOpenThread(post)} 
          style={styles.coreBtn}
          animate={{ 
            boxShadow: ["0 0 5px rgba(0, 242, 254, 0.2)", "0 0 20px rgba(0, 242, 254, 0.5)", "0 0 5px rgba(0, 242, 254, 0.2)"] 
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(0, 242, 254, 0.15)", letterSpacing: "1.5px" }}
          whileTap={{ scale: 0.95 }}
        >
          O QUE ESTÃO FALANDO...
        </motion.button>
      </div>
    </motion.div>
  );
}

const styles = {
  card: { background: "#050505", borderRadius: "28px", border: "1px solid #111", marginBottom: "25px", overflow: "hidden" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #222" },
  nameGroup: { display: "flex", flexDirection: "column" as const },
  username: { color: "#fff", fontWeight: "900" as const, fontSize: "13px" },
  date: { color: "#444", fontSize: "9px" },
  dotsBtn: { background: "none", border: "none", color: "#444", fontSize: "16px" },
  content: { cursor: "pointer" },
  imageContainer: { width: "100%", background: "#000" },
  postImage: { width: "100%", height: "auto", display: "block", opacity: 0.9 },
  bodyTextContainer: { padding: "15px 20px 5px" },
  text: { color: "#fff", fontSize: "15px", lineHeight: "1.4" },
  multiPreviewContainer: { padding: "0 20px", cursor: "pointer", marginBottom: "15px" },
  previewBox: { background: "rgba(255, 255, 255, 0.02)", padding: "8px 12px", borderRadius: "12px", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.03)" },
  previewUser: { color: "#00f2fe", fontSize: "9px", fontWeight: "900" as const },
  previewText: { color: "#666", fontSize: "10px" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderTop: "1px solid #111" },
  reactionSide: { display: "flex", alignItems: "center", gap: "18px" },
  chatIconWrapper: { color: "#333", cursor: "pointer", display: "flex", alignItems: "center" },
  coreBtn: { 
    background: "rgba(0, 242, 254, 0.05)", 
    border: "1px solid rgba(0, 242, 254, 0.3)", 
    color: "#00f2fe", 
    fontSize: "9px", 
    fontWeight: "900" as const, 
    cursor: "pointer", 
    letterSpacing: "0.8px", 
    padding: "12px 20px",
    borderRadius: "22px",
    textShadow: "0 0 8px rgba(0, 242, 254, 0.6)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  }
};
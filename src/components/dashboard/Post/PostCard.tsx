"use client";
import React from "react";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion } from "framer-motion";

export default function PostCard({ post, onOpenThread, onRefresh }: any) {
  // Simplificamos a lógica para focar na harmonia visual
  const zapCount = (post.reactions || []).filter((r: any) => r.type === 'zap').length;

  return (
    <div style={cardStyles.card}>
      <div style={cardStyles.header}>
        <div style={cardStyles.userInfo}>
          <motion.img 
            whileHover={{ scale: 1.1 }}
            src={post.profiles?.avatar_url || "/default-avatar.png"} 
            style={cardStyles.avatar} 
            alt="User" 
          />
          <span style={cardStyles.username}>@{post.profiles?.username}</span>
        </div>
      </div>

      <div style={cardStyles.content} onClick={() => onOpenThread(post)}>
        <div style={cardStyles.mediaWrapper}>
          {post.video_url ? (
            <video autoPlay loop muted playsInline style={cardStyles.postMedia}>
              <source src={post.video_url} type="video/mp4" />
            </video>
          ) : post.image_url ? (
            <img src={post.image_url} style={cardStyles.postMedia} alt="Post" />
          ) : null}
        </div>
        <div style={cardStyles.bodyTextContainer}>
           <p style={cardStyles.text}>{post.content}</p>
        </div>
      </div>

      <div style={cardStyles.footer}>
        {/* PÍLULA SENSORIAL: Onde a reação acontece agora */}
        <motion.div 
          style={cardStyles.reactionPill}
          whileHover={{ 
            scale: 1.02, 
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            boxShadow: "0 4px 15px rgba(0, 242, 254, 0.1)" 
          }}
        >
          <ReactionBar 
            postId={post.id} 
            initialReactions={post.reactions} 
            onReply={() => onOpenThread(post)} 
            onRefresh={onRefresh} 
          />
        </motion.div>
        
        {/* BOTÃO AJUSTADO: Trava de segurança para não estourar a margem */}
        <motion.button 
          onClick={() => onOpenThread(post)} 
          style={{
            ...cardStyles.coreBtn,
            color: zapCount > 10 ? "#FFD700" : "#00f2fe",
            borderColor: zapCount > 10 ? "rgba(255, 215, 0, 0.3)" : "rgba(0, 242, 254, 0.2)"
          }}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(0, 242, 254, 0.08)" }}
          whileTap={{ scale: 0.95 }}
        >
          OUVIR DISCUSSÃO
        </motion.button>
      </div>
    </div>
  );
}

const cardStyles = {
  card: { 
    background: "#050505", 
    borderRadius: "32px", 
    marginBottom: "30px", 
    overflow: "hidden", 
    border: "1px solid rgba(255,255,255,0.03)",
    position: "relative" as const
  },
  header: { padding: "20px 24px" },
  userInfo: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "36px", height: "36px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", objectFit: "cover" as const },
  username: { color: "#fff", fontWeight: "900" as const, fontSize: "11px", letterSpacing: "1px" },
  content: { cursor: "pointer" },
  mediaWrapper: { margin: "0 12px", borderRadius: "20px", overflow: "hidden", background: "#000" },
  postMedia: { width: "100%", height: "auto", display: "block" },
  bodyTextContainer: { padding: "20px 24px" },
  text: { color: "rgba(255,255,255,0.7)", fontSize: "15px", fontWeight: "300" as const, lineHeight: "1.5" },
  footer: { 
    padding: "16px 20px", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.03)",
    gap: "10px"
  },
  reactionPill: {
    background: "rgba(255,255,255,0.02)",
    padding: "6px 14px",
    borderRadius: "100px",
    border: "1px solid rgba(255,255,255,0.05)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center"
  },
  coreBtn: { 
    background: "rgba(0, 0, 0, 0.4)", 
    border: "1px solid", 
    fontSize: "8px", 
    fontWeight: "900" as const, 
    padding: "10px 14px", 
    borderRadius: "14px", 
    cursor: "pointer", 
    letterSpacing: "1.5px",
    maxWidth: "135px", // Trava para não estourar a margem (conforme imagem)
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    transition: "all 0.2s ease"
  }
};
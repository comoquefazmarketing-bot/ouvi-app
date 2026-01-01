"use client";
import React, { useMemo } from "react";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion } from "framer-motion";

export default function PostCard({ post, onOpenThread, onDelete, onRefresh }: any) {
  const zapCount = useMemo(() => (post.reactions || []).filter((r: any) => r.type === 'zap').length, [post.reactions]);
  const intensity = Math.min(zapCount / 50, 1);

  return (
    <motion.div 
      style={{
        ...cardStyles.card,
        border: `1px solid rgba(255, 215, 0, ${0.1 + intensity * 0.7})`,
        boxShadow: zapCount > 0 ? `0 0 ${intensity * 40}px rgba(255, 215, 0, ${intensity * 0.5})` : "none"
      }}
      animate={intensity === 1 ? { x: [-1, 1, -1, 1, 0], transition: { repeat: Infinity, duration: 0.1 } } : {}}
    >
      <div style={cardStyles.header}>
        <div style={cardStyles.userInfo}>
          <img src={post.profiles?.avatar_url || "/default-avatar.png"} style={cardStyles.avatar} alt="User" />
          <span style={cardStyles.username}>@{post.profiles?.username}</span>
        </div>
      </div>

      <div style={cardStyles.content} onClick={() => onOpenThread(post)}>
        {post.image_url && <img src={post.image_url} style={cardStyles.postImage} alt="Post" />}
        <div style={cardStyles.bodyTextContainer}>
           <p style={cardStyles.text}>{post.content}</p>
        </div>
      </div>

      <div style={cardStyles.footer}>
        {/* LADO ESQUERDO: Reações (Zap, Mic, Love) dentro da pílula */}
        <div style={cardStyles.reactionSide}>
          <ReactionBar 
            postId={post.id} 
            initialReactions={post.reactions} 
            onReply={() => onOpenThread(post)} 
            onRefresh={onRefresh} 
          />
        </div>
        
        {/* LADO DIREITO: O BOTÃO SAGRADO (O que eles estão falando) */}
        <motion.button 
          onClick={() => onOpenThread(post)} 
          style={{
            ...cardStyles.coreBtn,
            color: intensity > 0.5 ? "#FFD700" : "#00f2fe",
            borderColor: intensity > 0.5 ? "#FFD700" : "rgba(0, 242, 254, 0.4)"
          }}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(0, 242, 254, 0.05)" }}
          whileTap={{ scale: 0.95 }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {intensity === 1 ? "SINAL MÁXIMO ATIVO" : "OUVIR DISCUSSÃO"}
        </motion.button>
      </div>
    </motion.div>
  );
}

const cardStyles = {
  card: { background: "#050505", borderRadius: "28px", marginBottom: "25px", overflow: "hidden", position: "relative" as const },
  header: { padding: "16px 20px" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #222" },
  username: { color: "#fff", fontWeight: "900" as const, fontSize: "13px" },
  content: { cursor: "pointer" },
  postImage: { width: "100%", opacity: 0.8 },
  bodyTextContainer: { padding: "15px 20px" },
  text: { color: "#fff", fontSize: "15px", fontWeight: "300" as const },
  footer: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "15px 20px", 
    borderTop: "1px solid #111" 
  },
  reactionSide: { display: "flex", alignItems: "center" },
  coreBtn: { 
    background: "rgba(0,0,0,0.3)", 
    border: "1px solid", 
    fontSize: "9px", 
    fontWeight: "900" as const, 
    padding: "10px 18px", 
    borderRadius: "20px", 
    cursor: "pointer",
    letterSpacing: "1px",
    textTransform: "uppercase" as const
  }
};
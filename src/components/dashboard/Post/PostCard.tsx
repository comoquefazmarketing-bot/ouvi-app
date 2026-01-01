"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
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
        <div style={cardStyles.reactionSide}>
          <ReactionBar postId={post.id} initialReactions={post.reactions} onReply={() => onOpenThread(post)} onRefresh={onRefresh} />
          
          {/* PORTAL BALÃO COM SONAR */}
          <motion.div 
            whileHover={{ scale: 1.3 }}
            onClick={() => onOpenThread(post)} 
            style={cardStyles.chatIconWrapper}
          >
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={cardStyles.sonar} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </motion.div>
        </div>
        
        <motion.button 
          onClick={() => onOpenThread(post)} 
          style={{
            ...cardStyles.coreBtn,
            color: intensity > 0.5 ? "#FFD700" : "#00f2fe",
            borderColor: intensity > 0.5 ? "#FFD700" : "rgba(0, 242, 254, 0.3)"
          }}
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
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderTop: "1px solid #111" },
  reactionSide: { display: "flex", alignItems: "center", gap: "15px" },
  chatIconWrapper: { position: "relative" as const, cursor: "pointer", display: "flex", alignItems: "center" },
  sonar: { position: "absolute" as const, inset: -5, border: "1px solid #00f2fe", borderRadius: "50%" },
  coreBtn: { background: "none", border: "1px solid", fontSize: "9px", fontWeight: "900" as const, padding: "10px 18px", borderRadius: "20px", cursor: "pointer" }
};
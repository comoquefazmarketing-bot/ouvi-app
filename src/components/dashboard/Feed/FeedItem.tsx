/**
 * PROJETO OUVI — Unidade de Postagem (Item)
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 */

"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, MessageCircle, Heart } from "lucide-react";

interface FeedItemProps {
  post: any;
  onOpenThread: (postId: string) => void;
}

export default function FeedItem({ post, onOpenThread }: FeedItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Não abre a thread ao clicar no play
    if (!post.audio_url) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(post.audio_url);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpenThread(post.id)}
      style={styles.card}
    >
      {/* Identidade do Criador */}
      <div style={styles.header}>
        <div style={styles.avatar}>
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} style={styles.avatarImg} alt="" />
          ) : "🎙️"}
        </div>
        <div style={styles.info}>
          <span style={styles.username}>@{post.profiles?.username || "ouvi_user"}</span>
          <span style={styles.time}>agora</span>
        </div>
      </div>

      {/* Conteúdo do Post */}
      <p style={styles.text}>{post.content}</p>

      {/* Player Minimalista Black Piano */}
      <div style={styles.playerContainer}>
        <button onClick={togglePlay} style={styles.playBtn}>
          {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" />}
        </button>
        
        <div style={styles.waveContainer}>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={isPlaying ? { height: [4, 20, 4] } : { height: 4 }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
              style={styles.waveBar}
            />
          ))}
        </div>
      </div>

      {/* Rodapé de Ações */}
      <div style={styles.footer}>
        <div style={styles.action}>
          <Heart size={18} />
          <span>{post.likes || 0}</span>
        </div>
        <div style={styles.action}>
          <MessageCircle size={18} />
          <span>Thread</span>
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    background: "rgba(18, 18, 18, 0.7)",
    backdropFilter: "blur(20px)",
    borderRadius: "28px",
    padding: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    cursor: "pointer",
    width: "100%",
  },
  header: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  avatar: { 
    width: "38px", height: "38px", borderRadius: "50%", background: "#111", 
    border: "1px solid #00f2fe", overflow: "hidden", display: "flex", 
    alignItems: "center", justifyContent: "center" 
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" as "cover" },
  info: { display: "flex", flexDirection: "column" as "column" },
  username: { color: "#fff", fontWeight: "700", fontSize: "14px" },
  time: { color: "#444", fontSize: "10px" },
  text: { color: "rgba(255,255,255,0.8)", fontSize: "14px", marginBottom: "16px", lineHeight: "1.4" },
  playerContainer: { 
    background: "rgba(0,0,0,0.3)", borderRadius: "20px", padding: "10px 15px", 
    display: "flex", alignItems: "center", gap: "15px", border: "1px solid rgba(255,255,255,0.03)" 
  },
  playBtn: { 
    width: "36px", height: "36px", borderRadius: "50%", background: "#00f2fe", 
    border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" 
  },
  waveContainer: { display: "flex", gap: "3px", alignItems: "center", flex: 1 },
  waveBar: { width: "3px", background: "#00f2fe", borderRadius: "2px", opacity: 0.6 },
  footer: { display: "flex", gap: "20px", marginTop: "16px", color: "#555", fontSize: "12px" },
  action: { display: "flex", alignItems: "center", gap: "6px" }
};
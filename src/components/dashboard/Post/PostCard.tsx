/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Evolução: Estética Black Piano & Sensorial
 */

import React from "react";
import { motion } from "framer-motion"; // Instale: npm install framer-motion
import ReactionBar from "../Threads/ReactionBar";
import AudioRecorder from "../Threads/AudioRecorder";

export default function PostCard({ post }: { post: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={styles.card}
    >
      {/* Header: Quem postou? */}
      <div style={styles.userRow}>
        <div style={{...styles.avatar, backgroundImage: `url(${post.profiles?.avatar_url})` }} />
        <div style={styles.userInfo}>
          <span style={styles.username}>@{post.profiles?.username}</span>
          <span style={styles.time}>agora mesmo</span>
        </div>
      </div>

      {/* Mídia Principal: Aspecto Cinema */}
      <div style={styles.mediaContainer}>
        {post.media_url ? (
           <img src={post.media_url} style={styles.media} alt="Conteúdo" />
        ) : (
           <div style={styles.audioOnly}>
             <div style={styles.pulseIcon}>VIVE O SOM</div>
           </div>
        )}
      </div>

      {/* Interação Social: ReactionBar (Fogo, Diamante, etc) */}
      <div style={styles.interactionArea}>
        <ReactionBar commentId={post.id} reactions={post.reactions || {}} />
      </div>

      {/* Mesa de Comando: Talk */}
      <div style={styles.talkArea}>
        <AudioRecorder onUploadComplete={() => {}} />
      </div>
    </motion.div>
  );
}

const styles = {
  card: { 
    background: "rgba(10, 10, 10, 0.7)", // Black Piano Translúcido
    backdropFilter: "blur(20px)", 
    borderRadius: "32px", 
    marginBottom: "20px", 
    border: "1px solid rgba(255, 255, 255, 0.08)", // Brilho de quina
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
    width: "100%",
  },
  userRow: { padding: "16px", display: "flex", alignItems: "center", gap: "12px" },
  avatar: { 
    width: "42px", 
    height: "42px", 
    borderRadius: "50%", 
    backgroundSize: "cover", 
    backgroundPosition: "center",
    border: "1.5px solid #00FFFF", // Aro Neon
    boxShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
  },
  userInfo: { display: "flex", flexDirection: "column" as "column" },
  username: { color: "#fff", fontSize: "14px", fontWeight: "800", letterSpacing: "0.5px" },
  time: { color: "rgba(255,255,255,0.3)", fontSize: "10px" },
  mediaContainer: { 
    width: "100%", 
    background: "rgba(0,0,0,0.4)", 
    minHeight: "250px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  media: { width: "100%", height: "auto", display: "block", objectFit: "cover" as "cover" },
  audioOnly: { 
    height: "150px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    color: "#00FFFF", 
    fontWeight: "900", 
    letterSpacing: "8px",
    opacity: 0.6,
    textShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
  },
  pulseIcon: {
     fontSize: "12px",
     border: "1px solid #00FFFF",
     padding: "8px 16px",
     borderRadius: "20px",
  },
  interactionArea: { 
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  talkArea: {
    padding: "10px",
    background: "rgba(255, 255, 255, 0.02)", // Sutil diferença para a área de gravação
  }
};
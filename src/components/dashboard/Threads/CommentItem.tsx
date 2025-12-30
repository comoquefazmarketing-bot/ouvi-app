/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 1.2 (Nível de Imersão Fluida)
 */

"use client";

import React, { useMemo } from "react";
import ReactionBar from "./ReactionBar";

interface CommentItemProps {
  comment: any;
  onReply: (commentId: string) => void;
}

export default function CommentItem({ comment, onReply }: CommentItemProps) {
  const totalReactions = useMemo(() => {
    if (!comment.reactions) return 0;
    return Object.values(comment.reactions).reduce((acc: number, val: any) => acc + (val.length || 0), 0);
  }, [comment.reactions]);

  const isFrenetic = totalReactions > 5;

  return (
    <div style={styles.wrapper}>
      {/* Estilos para a Camada Imersiva de Som de Muitas Águas */}
      <style>{`
        @keyframes fluid-border {
          0% { border-radius: 18px 25px 18px 25px; }
          50% { border-radius: 25px 18px 25px 18px; }
          100% { border-radius: 18px 25px 18px 25px; }
        }
        
        @keyframes glass-shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }

        .immersive-layer {
          animation: fluid-border 3s ease-in-out infinite, 
                     water-vibration 0.15s infinite;
          background: linear-gradient(110deg, #0a0a0a 45%, #0d1a1d 50%, #0a0a0a 55%);
          background-size: 200% 100%;
          animation: glass-shimmer 4s linear infinite, fluid-border 4s ease-in-out infinite;
          border: 1px solid rgba(0, 242, 254, 0.4) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 242, 254, 0.15);
          backdrop-filter: blur(4px);
        }

        @keyframes water-vibration {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-0.5px, 0.5px); }
          50% { transform: translate(0.5px, -0.5px); }
          75% { transform: translate(-0.5px, -0.5px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      <div 
        className={isFrenetic ? "immersive-layer" : ""}
        style={styles.container}
      >
        <div style={styles.header}>
          <div style={styles.avatarPlaceholder}>
            {comment.username?.charAt(0).toUpperCase()}
          </div>
          <span style={styles.username}>@{comment.username}</span>
          {isFrenetic && <span style={styles.waterBadge}>🌊 MUITAS ÁGUAS</span>}
        </div>

        <div style={styles.contentBody}>
          {comment.content && <p style={styles.text}>{comment.content}</p>}
          
          {comment.audio_url && (
            <div style={{
              ...styles.audioWrapper,
              background: isFrenetic ? "rgba(0, 242, 254, 0.05)" : "#111"
            }}>
              <audio src={comment.audio_url} controls style={styles.audioPlayer} />
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <ReactionBar commentId={comment.id} reactions={comment.reactions || {}} />
          <button onClick={() => onReply(comment.id)} style={styles.replyLink}>
            REPLICAR ↴
          </button>
        </div>
      </div>
      
      <div style={styles.connector} />
    </div>
  );
}

const styles = {
  wrapper: { position: "relative" as "relative", paddingLeft: "10px", marginBottom: "15px" },
  container: {
    background: "#0a0a0a",
    border: "1px solid #151515",
    borderRadius: "18px",
    padding: "15px",
    display: "flex",
    flexDirection: "column" as "column",
    gap: "10px",
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  header: { display: "flex", alignItems: "center", gap: "8px" },
  avatarPlaceholder: {
    width: "24px", height: "24px", borderRadius: "50%",
    background: "linear-gradient(45deg, #00f2fe, #4facfe)",
    color: "#000", fontSize: "10px", fontWeight: "900",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  username: { fontSize: "12px", fontWeight: "700", color: "#fff" },
  waterBadge: { fontSize: "8px", color: "#00f2fe", fontWeight: "900", letterSpacing: "1px", marginLeft: "auto" },
  contentBody: { paddingLeft: "2px" },
  text: { fontSize: "14px", color: "#ccc", lineHeight: "1.4", margin: 0 },
  audioWrapper: { marginTop: "8px", borderRadius: "12px", padding: "5px", transition: "background 0.3s" },
  audioPlayer: { width: "100%", height: "30px" },
  footer: { 
    display: "flex", justifyContent: "space-between", alignItems: "center", 
    marginTop: "5px", paddingTop: "10px", borderTop: "1px solid #111" 
  },
  replyLink: { 
    background: "none", border: "none", color: "#444", 
    fontSize: "10px", fontWeight: "900", cursor: "pointer", letterSpacing: "1px" 
  },
  connector: {
    position: "absolute" as "absolute", left: "0", top: "20px", bottom: "-20px",
    width: "2px", background: "linear-gradient(#1a1a1a, transparent)",
  }
};
"use client";
import React, { useMemo } from "react";
import ReactionBar from "./ReactionBar"; // Importando o hardware de reação

export default function CommentItem({ comment, onReply, currentUser }: any) {
  // Ajuste na lógica para contar os IDs dentro da lista de amados
  const totalReactions = useMemo(() => {
    return comment.reactions?.loved_by ? comment.reactions.loved_by.length : 0;
  }, [comment.reactions]);

  const isFrenetic = totalReactions > 5;

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes fluid { 0%, 100% { border-radius: 18px 25px; } 50% { border-radius: 25px 18px; } }
        .frenetic { animation: fluid 4s ease-in-out infinite; border: 1px solid rgba(0, 242, 254, 0.4) !important; box-shadow: 0 0 20px rgba(0,242,254,0.1); }
      `}</style>
      
      <div className={isFrenetic ? "frenetic" : ""} style={styles.container}>
        <div style={styles.header}>
          <span style={styles.username}>@{comment.username || "membro"}</span>
          {isFrenetic && <span style={styles.badge}>🌊 MUITAS ÁGUAS</span>}
        </div>

        {/* Conteúdo: Texto ou Áudio */}
        {comment.content && <p style={styles.text}>{comment.content}</p>}
        {comment.audio_url && (
          <div style={styles.audioWrapper}>
            <audio src={comment.audio_url} controls style={styles.audio} />
          </div>
        )}

        <div style={styles.footer}>
          {/* Integrando o ReactionBar que criamos */}
          <ReactionBar 
            postId={comment.post_id}
            commentId={comment.id}
            initialReactions={comment.reactions}
            onUploadComplete={() => {}} // Opcional: callback de refresh
          />
          
          <button onClick={() => onReply(comment.id)} style={styles.replyBtn}>
            REPLICAR ↴
          </button>
        </div>
      </div>
      <div style={styles.connector} />
    </div>
  );
}

const styles = {
  wrapper: { position: "relative" as "relative", paddingLeft: "15px", marginBottom: "12px" },
  container: { 
    background: "#080808", 
    border: "1px solid #121212", 
    padding: "15px", 
    borderRadius: "18px",
    transition: "all 0.3s ease"
  },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  username: { color: "#00f2fe", fontSize: "11px", fontWeight: "bold" as "bold" },
  badge: { color: "#00f2fe", fontSize: "8px", fontWeight: "900" as "900", letterSpacing: "1px" },
  text: { color: "#ccc", fontSize: "14px", lineHeight: "1.5", marginBottom: "10px" },
  audioWrapper: { margin: "10px 0" },
  audio: { 
    width: "100%", 
    height: "32px", 
    filter: "invert(1) hue-rotate(180deg) brightness(1.5)",
    borderRadius: "100px"
  },
  footer: { 
    marginTop: "12px", 
    display: "flex", 
    justifyContent: "space-between", // Espaça Reação de um lado e Replicar do outro
    alignItems: "center" 
  },
  replyBtn: { 
    background: "none", 
    border: "none", 
    color: "#444", 
    fontSize: "10px", 
    fontWeight: "900" as "900", 
    cursor: "pointer",
    letterSpacing: "0.5px"
  },
  connector: { position: "absolute" as "absolute", left: "0", top: "20px", bottom: "-12px", width: "1px", background: "#1a1a1a" }
};
/**
 * PROJETO OUVI — Item de Comentário Sensorial
 * Autor: Felipe Makarios
 * Ajuste: Hierarquia de Ninhos e Ergonomia de Polegar
 */

"use client";
import React, { useMemo } from "react";
import ReactionBar from "./ReactionBar";

// Adicionamos 'depth' para controlar o recuo lateral
export default function CommentItem({ comment, allComments, onReply, depth = 0 }: any) {
  
  // Filtra as respostas (filhos) deste comentário específico
  const replies = useMemo(() => {
    return allComments?.filter((c: any) => c.parent_id === comment.id) || [];
  }, [allComments, comment.id]);

  const totalReactions = useMemo(() => {
    return comment.reactions?.loved_by ? comment.reactions.loved_by.length : 0;
  }, [comment.reactions]);

  const isFrenetic = totalReactions > 5;

  return (
    <div style={{ 
      ...styles.wrapper, 
      paddingLeft: depth > 0 ? "20px" : "0px", // Recuo para filhos
      marginLeft: depth > 0 ? "10px" : "0px"  
    }}>
      <style>{`
        @keyframes fluid { 0%, 100% { border-radius: 18px 25px; } 50% { border-radius: 25px 18px; } }
        .frenetic { animation: fluid 4s ease-in-out infinite; border: 1px solid rgba(0, 242, 254, 0.4) !important; box-shadow: 0 0 20px rgba(0,242,254,0.1); }
      `}</style>
      
      <div className={isFrenetic ? "frenetic" : ""} style={styles.container}>
        <div style={styles.header}>
          <span style={styles.username}>@{comment.username || "membro"}</span>
          {isFrenetic && <span style={styles.badge}>🌊 MUITAS ÁGUAS</span>}
        </div>

        {comment.content && <p style={styles.text}>{comment.content}</p>}
        
        {comment.audio_url && (
          <div style={styles.audioWrapper}>
            <audio src={comment.audio_url} controls style={styles.audio} />
          </div>
        )}

        <div style={styles.footer}>
          {/* O ReactionBar aqui já vai estar na direita conforme nosso último ajuste */}
          <ReactionBar 
            postId={comment.post_id}
            commentId={comment.id}
            initialReactions={comment.reactions}
            onUploadComplete={() => {}}
          />
          
          <button onClick={() => onReply(comment.id)} style={styles.replyBtn}>
            REPLICAR ↴
          </button>
        </div>
      </div>

      {/* Linha conectora visual (estilo árvore de conversa) */}
      <div style={{
        ...styles.connector,
        left: depth > 0 ? "-10px" : "0px",
        display: depth > 3 ? "none" : "block" // Evita que vire uma linha infinita
      }} />

      {/* RENDERIZAÇÃO DOS FILHOS (RECURSIVIDADE) */}
      {replies.length > 0 && (
        <div style={styles.repliesList}>
          {replies.map((reply: any) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              allComments={allComments}
              onReply={onReply}
              depth={depth + 1} // Aumenta o recuo para a próxima geração
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: "relative" as const, marginBottom: "16px" },
  container: { 
    background: "rgba(8, 8, 8, 0.6)", 
    border: "1px solid rgba(255, 255, 255, 0.05)", 
    padding: "16px", 
    borderRadius: "22px",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease"
  },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  username: { color: "#00f2fe", fontSize: "11px", fontWeight: "bold" as const },
  badge: { color: "#00f2fe", fontSize: "8px", fontWeight: "900" as const, letterSpacing: "1px" },
  text: { color: "#eee", fontSize: "14px", lineHeight: "1.5", marginBottom: "10px" },
  audioWrapper: { margin: "12px 0" },
  audio: { 
    width: "100%", 
    height: "36px", 
    filter: "invert(1) hue-rotate(180deg) brightness(1.5)",
    borderRadius: "100px"
  },
  footer: { 
    marginTop: "12px", 
    display: "flex", 
    flexDirection: "row-reverse" as const, // Força a ReactionBar para a direita
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  replyBtn: { 
    background: "none", 
    border: "none", 
    color: "#444", 
    fontSize: "9px", 
    fontWeight: "900" as const, 
    cursor: "pointer",
    letterSpacing: "0.5px"
  },
  connector: { 
    position: "absolute" as const, 
    top: "20px", 
    bottom: "-10px", 
    width: "1.5px", 
    background: "linear-gradient(to bottom, rgba(0, 242, 254, 0.2), transparent)" 
  },
  repliesList: {
    marginTop: "12px",
  }
};
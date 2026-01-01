/**
 * PROJETO OUVI – Item de Comentário Sensorial (Sintonizado)
 * Autor: Felipe Makarios
 * Ajuste: Sincronização de Tabela, Nome de Exibição e Estabilidade
 */

"use client";
import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion, AnimatePresence } from "framer-motion";

export default function CommentItem({ comment, allComments, onReply, depth = 0, onDelete }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const isOwner = userId === comment.user_id;

  // Filtra as respostas (replies) baseadas no parent_id
  const replies = useMemo(() => {
    return allComments?.filter((c: any) => c.parent_id === comment.id) || [];
  }, [allComments, comment.id]);

  const totalReactions = useMemo(() => {
    return comment.reactions?.loved_by ? comment.reactions.loved_by.length : 0;
  }, [comment.reactions]);

  const isFrenetic = totalReactions > 5;

  const handleDelete = async () => {
    if (!isOwner) return;
    
    // CORREÇÃO: Tabela correta é audio_comments
    const { error } = await supabase
      .from("audio_comments")
      .delete()
      .eq("id", comment.id);
      
    if (!error) {
      if (onDelete) onDelete(comment.id);
    } else {
      console.error("Erro ao deletar:", error.message);
    }
    setShowMenu(false);
  };

  // Lógica de nome resiliente (igual ao ThreadDrawer)
  const displayName = comment.profiles?.username || comment.username || "MEMBRO OUVI";

  return (
    <div style={{ 
      ...styles.wrapper, 
      paddingLeft: depth > 0 ? "15px" : "0px", 
      borderLeft: depth > 0 ? "1px solid rgba(0, 242, 254, 0.1)" : "none"
    }}>
      <style>{`
        @keyframes fluid { 0%, 100% { border-radius: 18px 25px; } 50% { border-radius: 25px 18px; } }
        .frenetic { 
          animation: fluid 4s ease-in-out infinite; 
          border: 1px solid rgba(0, 242, 254, 0.4) !important; 
          box-shadow: 0 0 20px rgba(0,242,254,0.1); 
        }
      `}</style>
      
      <div className={isFrenetic ? "frenetic" : ""} style={styles.container}>
        
        {/* CABEÇALHO */}
        <div style={styles.header}>
          <div style={styles.userInfo}>
            <img 
              src={comment.profiles?.avatar_url || "/default-avatar.png"} 
              style={styles.avatar} 
              alt="Avatar"
              onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
            />
            <div style={styles.nameGroup}>
              <span style={styles.username}>@{displayName.toLowerCase()}</span>
              <span style={styles.date}>
                {new Date(comment.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={styles.dotsBtn}>•••</button>
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={styles.menuDrawer}
                >
                  {isOwner ? (
                    <button onClick={handleDelete} style={styles.deleteBtn}>🗑️ EXCLUIR</button>
                  ) : (
                    <span style={styles.readOnly}>VISUALIZAÇÃO</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CONTEÚDO */}
        {comment.content && <p style={styles.text}>{comment.content}</p>}
        
        {comment.audio_url && (
          <div style={styles.audioWrapper}>
            <audio src={comment.audio_url} controls style={styles.audio} />
          </div>
        )}

        {/* FOOTER */}
        <div style={styles.footer}>
          <ReactionBar 
            postId={comment.post_id}
            commentId={comment.id}
            initialReactions={comment.reactions}
            onOpenThread={() => onReply && onReply(comment.id)}
          />
          
          <button onClick={() => onReply && onReply(comment.id)} style={styles.replyBtn}>
            REPLICAR ↴
          </button>
        </div>
      </div>

      {/* RESPOSTAS RECURSIVAS */}
      {replies.length > 0 && (
        <div style={styles.repliesList}>
          {replies.map((reply: any) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              allComments={allComments}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: "relative" as const, marginBottom: "12px" },
  container: { 
    background: "rgba(15, 15, 15, 0.6)", 
    border: "1px solid rgba(255, 255, 255, 0.05)", 
    padding: "14px", 
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
    position: "relative" as const,
    zIndex: 2
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(0, 242, 254, 0.1)", objectFit: "cover" as const },
  nameGroup: { display: "flex", flexDirection: "column" as const },
  username: { color: "#00f2fe", fontSize: "10px", fontWeight: "900" as const, letterSpacing: "0.5px", textTransform: "uppercase" as const },
  date: { color: "rgba(255, 255, 255, 0.2)", fontSize: "8px" },
  dotsBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.3, padding: "5px" },
  menuDrawer: { 
    position: "absolute" as const, right: 0, top: "30px", background: "#111", 
    padding: "4px", borderRadius: "10px", border: "1px solid #222", zIndex: 50, minWidth: "110px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
  },
  deleteBtn: { color: "#ff4444", background: "none", border: "none", fontSize: "9px", fontWeight: "900" as const, cursor: "pointer", padding: "10px", width: "100%", textAlign: "left" as const },
  readOnly: { color: "#333", fontSize: "8px", padding: "10px", display: "block" },
  text: { color: "#ddd", fontSize: "13px", lineHeight: "1.5", marginBottom: "8px", fontWeight: "400" },
  audioWrapper: { margin: "10px 0", background: "rgba(0,0,0,0.3)", borderRadius: "100px", padding: "2px" },
  audio: { width: "100%", height: "28px", filter: "invert(1) hue-rotate(180deg) brightness(1.5)" },
  footer: { marginTop: "10px", display: "flex", flexDirection: "row-reverse" as const, justifyContent: "space-between", alignItems: "center" },
  replyBtn: { background: "none", border: "none", color: "#333", fontSize: "8px", fontWeight: "900" as const, cursor: "pointer", letterSpacing: "1px" },
  repliesList: { marginTop: "10px" }
};
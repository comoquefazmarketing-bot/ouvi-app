/**
 * PROJETO OUVI – Item de Comentário Sensorial (Sintonizado)
 * Autor: Felipe Makarios
 * Ajuste: Foto de Perfil, Data, Menu de Exclusão e Hierarquia
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

  const replies = useMemo(() => {
    return allComments?.filter((c: any) => c.parent_id === comment.id) || [];
  }, [allComments, comment.id]);

  const totalReactions = useMemo(() => {
    return comment.reactions?.loved_by ? comment.reactions.loved_by.length : 0;
  }, [comment.reactions]);

  const isFrenetic = totalReactions > 5;

  const handleDelete = async () => {
    if (!isOwner) return;
    const { error } = await supabase.from("post_replies").delete().eq("id", comment.id);
    if (!error && onDelete) onDelete(comment.id);
    setShowMenu(false);
  };

  return (
    <div style={{ 
      ...styles.wrapper, 
      paddingLeft: depth > 0 ? "20px" : "0px", 
      marginLeft: depth > 0 ? "10px" : "0px"  
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
        
        {/* CABEÇALHO: FOTO, NOME + DATA (ESQUERDA) | MENU (DIREITA) */}
        <div style={styles.header}>
          <div style={styles.userInfo}>
            <img 
              src={comment.profiles?.avatar_url || "/default-avatar.png"} 
              style={styles.avatar} 
              alt="Avatar"
            />
            <div style={styles.nameGroup}>
              <span style={styles.username}>@{comment.profiles?.username || "membro"}</span>
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
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
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

        {comment.content && <p style={styles.text}>{comment.content}</p>}
        
        {comment.audio_url && (
          <div style={styles.audioWrapper}>
            <audio src={comment.audio_url} controls style={styles.audio} />
          </div>
        )}

        <div style={styles.footer}>
          <ReactionBar 
            postId={comment.post_id}
            commentId={comment.id}
            initialReactions={comment.reactions}
            onOpenThread={() => onReply(comment.id)}
          />
          
          <button onClick={() => onReply(comment.id)} style={styles.replyBtn}>
            REPLICAR ↴
          </button>
        </div>
      </div>

      {/* CONECTOR VISUAL */}
      <div style={{
        ...styles.connector,
        left: depth > 0 ? "-10px" : "0px",
        display: depth > 3 ? "none" : "block" 
      }} />

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
  wrapper: { position: "relative" as const, marginBottom: "16px" },
  container: { 
    background: "rgba(10, 10, 10, 0.7)", 
    border: "1px solid rgba(255, 255, 255, 0.05)", 
    padding: "16px", 
    borderRadius: "22px",
    backdropFilter: "blur(12px)",
    transition: "all 0.3s ease",
    position: "relative" as const,
    zIndex: 2
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", border: "1px solid rgba(0, 242, 254, 0.2)" },
  nameGroup: { display: "flex", flexDirection: "column" as const },
  username: { color: "#00f2fe", fontSize: "11px", fontWeight: "bold" as const, letterSpacing: "0.5px" },
  date: { color: "rgba(255, 255, 255, 0.3)", fontSize: "9px", marginTop: "1px" },
  dotsBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.4, fontSize: "14px" },
  menuDrawer: { 
    position: "absolute" as const, right: 0, top: "25px", background: "rgba(15,15,15,0.98)", 
    padding: "6px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", zIndex: 10, minWidth: "100px" 
  },
  deleteBtn: { color: "#ff4444", background: "none", border: "none", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer", padding: "8px", width: "100%", textAlign: "left" as const },
  readOnly: { color: "#444", fontSize: "9px", padding: "8px", display: "block" },
  text: { color: "#eee", fontSize: "14px", lineHeight: "1.5", marginBottom: "10px" },
  audioWrapper: { margin: "12px 0", background: "rgba(0,0,0,0.2)", borderRadius: "100px", padding: "4px" },
  audio: { width: "100%", height: "32px", filter: "invert(1) brightness(1.5)" },
  footer: { marginTop: "12px", display: "flex", flexDirection: "row-reverse" as const, justifyContent: "space-between", alignItems: "center" },
  replyBtn: { background: "none", border: "none", color: "#555", fontSize: "9px", fontWeight: "900" as const, cursor: "pointer", letterSpacing: "0.5px" },
  connector: { position: "absolute" as const, top: "20px", bottom: "-10px", width: "1.5px", background: "linear-gradient(to bottom, rgba(0, 242, 254, 0.2), transparent)" },
  repliesList: { marginTop: "12px" }
};
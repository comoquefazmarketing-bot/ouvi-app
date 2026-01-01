/**
 * PROJETO OUVI – Item de Comentário Sensorial (Sintonizado)
 * Autor: Felipe Makarios
 * Ajuste: Estabilidade de Avatares, Resiliência de Nomes e Depth
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
    // Ajuste para evitar erro se reactions for null
    return comment.reactions?.loved_by ? comment.reactions.loved_by.length : 0;
  }, [comment.reactions]);

  const isFrenetic = totalReactions > 5;

  const handleDelete = async () => {
    if (!isOwner) return;
    
    const { error } = await supabase
      .from("audio_comments")
      .delete()
      .eq("id", comment.id);
      
    if (!error) {
      if (onDelete) onDelete(comment.id);
    } else {
      console.error("Erro ao deletar voz:", error.message);
    }
    setShowMenu(false);
  };

  // Lógica de Identidade Sensorial Resiliente
  const displayName = comment.display_name || comment.profiles?.username || comment.username || "membro";
  const avatarUrl = comment.avatar_url || comment.profiles?.avatar_url || "/default-avatar.png";

  return (
    <div style={{ 
      ...styles.wrapper, 
      paddingLeft: depth > 0 ? (depth > 3 ? "10px" : "15px") : "0px", 
      borderLeft: depth > 0 ? "1px solid rgba(0, 242, 254, 0.15)" : "none"
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
              src={avatarUrl} 
              style={styles.avatar} 
              alt="Avatar"
              onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
            />
            <div style={styles.nameGroup}>
              <span style={styles.username}>@{displayName.toLowerCase()}</span>
              <span style={styles.date}>
                {comment.created_at ? new Date(comment.created_at).toLocaleDateString('pt-BR') : 'agora'}
              </span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={styles.dotsBtn}>•••</button>
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -5 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={styles.menuDrawer}
                >
                  {isOwner ? (
                    <button onClick={handleDelete} style={styles.deleteBtn}>🗑️ EXCLUIR</button>
                  ) : (
                    <span style={styles.readOnly}>SINTONIZADO</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CONTEÚDO (Voz ou Texto) */}
        <div style={styles.body}>
          {comment.content && <p style={styles.text}>{comment.content}</p>}
          
          {comment.audio_url && (
            <div style={styles.audioWrapper}>
              <audio src={comment.audio_url} controls style={styles.audio} />
            </div>
          )}
        </div>

        {/* FOOTER - ReactionBar Minimalista */}
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
  wrapper: { position: "relative" as const, marginBottom: "14px" },
  container: { 
    background: "rgba(18, 18, 18, 0.4)", 
    border: "1px solid rgba(255, 255, 255, 0.04)", 
    padding: "14px", 
    borderRadius: "22px",
    backdropFilter: "blur(15px)",
    position: "relative" as const,
    zIndex: 2
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(0, 242, 254, 0.15)", objectFit: "cover" as const },
  nameGroup: { display: "flex", flexDirection: "column" as const },
  username: { color: "#00f2fe", fontSize: "10px", fontWeight: "900" as const, letterSpacing: "0.8px", textTransform: "uppercase" as const },
  date: { color: "rgba(255, 255, 255, 0.25)", fontSize: "8px" },
  dotsBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.3, padding: "5px", fontSize: "14px" },
  menuDrawer: { 
    position: "absolute" as const, right: 0, top: "25px", background: "#0a0a0a", 
    padding: "4px", borderRadius: "12px", border: "1px solid #1a1a1a", zIndex: 50, minWidth: "110px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.8)"
  },
  deleteBtn: { color: "#ff4444", background: "none", border: "none", fontSize: "9px", fontWeight: "900" as const, cursor: "pointer", padding: "10px", width: "100%", textAlign: "left" as const },
  readOnly: { color: "#333", fontSize: "8px", padding: "10px", display: "block", textAlign: "center" as const },
  body: { padding: "2px 0 2px 38px" }, // Recuo para alinhar com o fim do avatar
  text: { color: "#eee", fontSize: "14px", lineHeight: "1.5", marginBottom: "6px", fontWeight: "400" },
  audioWrapper: { margin: "8px 0", background: "rgba(0,0,0,0.4)", borderRadius: "100px", padding: "2px", border: "1px solid rgba(255,255,255,0.03)" },
  audio: { width: "100%", height: "26px", filter: "invert(1) hue-rotate(180deg) brightness(1.8) opacity(0.7)" },
  footer: { marginTop: "12px", display: "flex", flexDirection: "row-reverse" as const, justifyContent: "space-between", alignItems: "center" },
  replyBtn: { background: "none", border: "none", color: "#444", fontSize: "8px", fontWeight: "900" as const, cursor: "pointer", letterSpacing: "1px", padding: "5px" },
  repliesList: { marginTop: "10px" }
};
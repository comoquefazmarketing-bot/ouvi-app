/**
 * PROJETO OUVI – Item de Comentário Sensorial (Sintonizado)
 * Ajuste: Integração com Modo Escada e Click Sensorial
 */

"use client";
import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion, AnimatePresence } from "framer-motion";

export default function CommentItem({ comment, allComments, onReplyClick, depth = 0, onDelete }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const isOwner = userId === comment.user_id;

  // Filtra as respostas para este comentário específico (A Escada)
  const replies = useMemo(() => {
    return allComments?.filter((c: any) => c.parent_id === comment.id) || [];
  }, [allComments, comment.id]);

  const handleDelete = async () => {
    if (!isOwner) return;
    const { error } = await supabase.from("audio_comments").delete().eq("id", comment.id);
    if (!error && onDelete) onDelete(comment.id);
    setShowMenu(false);
  };

  const displayName = comment.display_name || comment.profiles?.username || comment.username || "membro";
  const avatarUrl = comment.avatar_url || comment.profiles?.avatar_url || "/default-avatar.png";

  return (
    <div style={{ 
      ...styles.wrapper, 
      paddingLeft: depth > 0 ? "15px" : "0px", 
      borderLeft: depth > 0 ? "1px solid rgba(0, 242, 254, 0.1)" : "none",
      marginTop: depth > 0 ? "10px" : "0px"
    }}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.userInfo}>
            <img src={avatarUrl} style={styles.avatar} alt="Avatar" onError={(e) => (e.currentTarget.src = "/default-avatar.png")} />
            <div style={styles.nameGroup}>
              <span style={styles.username}>@{displayName.toLowerCase()}</span>
              <span style={styles.date}>{comment.created_at ? new Date(comment.created_at).toLocaleDateString('pt-BR') : 'agora'}</span>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={styles.dotsBtn}>•••</button>
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.menuDrawer}>
                  {isOwner ? <button onClick={handleDelete} style={styles.deleteBtn}>🗑️ EXCLUIR</button> : <span style={styles.readOnly}>SINTONIZADO</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={styles.body}>
          {comment.content && <p style={styles.text}>{comment.content}</p>}
          
          {comment.audio_url && (
            <div style={styles.audioWrapper}>
              <audio src={comment.audio_url} controls style={styles.audio} controlsList="nodownload" />
            </div>
          )}
        </div>

        <div style={styles.footer}>
          {/* BARRA SENSORIAL DISCRETA */}
          <ReactionBar 
            commentId={comment.id} 
            initialReactions={comment.reactions} 
            onReply={() => onReplyClick && onReplyClick(comment)} // Aciona a escada
          />
          
          <button onClick={() => onReplyClick && onReplyClick(comment)} style={styles.replyBtn}>
            RESPONDER
          </button>
        </div>
      </div>

      {/* RENDERIZAÇÃO RECURSIVA DAS RESPOSTAS */}
      {replies.length > 0 && (
        <div style={styles.repliesList}>
          {replies.map((reply: any) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              allComments={allComments} 
              onReplyClick={onReplyClick} 
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
  wrapper: { position: "relative" as const },
  container: { background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)", padding: "12px", borderRadius: "18px", backdropFilter: "blur(10px)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  userInfo: { display: "flex", alignItems: "center", gap: "8px" },
  avatar: { width: "24px", height: "24px", borderRadius: "50%", border: "1px solid rgba(0, 242, 254, 0.1)", objectFit: "cover" as const },
  nameGroup: { display: "flex", flexDirection: "column" as const },
  username: { color: "#00f2fe", fontSize: "9px", fontWeight: "900" as const, letterSpacing: "0.5px" },
  date: { color: "rgba(255, 255, 255, 0.2)", fontSize: "7px" },
  dotsBtn: { background: "none", border: "none", color: "#444", cursor: "pointer", padding: "5px" },
  menuDrawer: { position: "absolute" as const, right: 0, top: "25px", background: "#0a0a0a", padding: "4px", borderRadius: "10px", border: "1px solid #1a1a1a", zIndex: 50 },
  deleteBtn: { color: "#ff4444", background: "none", border: "none", fontSize: "8px", fontWeight: "900" as const, cursor: "pointer", padding: "8px 12px" },
  readOnly: { color: "#222", fontSize: "7px", padding: "8px" },
  body: { paddingLeft: "32px" },
  text: { color: "#ccc", fontSize: "13px", lineHeight: "1.4", marginBottom: "6px" },
  audioWrapper: { margin: "5px 0", background: "rgba(0,0,0,0.3)", borderRadius: "100px", padding: "2px", border: "1px solid rgba(255, 255, 255, 0.03)" },
  audio: { width: "100%", height: "24px", filter: "invert(1) hue-rotate(180deg) opacity(0.6)" },
  footer: { marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  replyBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: "8px", fontWeight: "900" as const, cursor: "pointer", letterSpacing: "1px" },
  repliesList: { marginTop: "10px" }
};
/**
 * PROJETO OUVI – PostCard ELITE (Sintonizado 2026)
 * Ajuste: Blindagem de Dados e Prevenção de Conflitos
 */

"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion, AnimatePresence } from "framer-motion";

export default function PostCard({ post, onOpenThread, onDelete }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const isOwner = currentUserId === post.user_id;

  const handleDeletePost = async () => {
    if (!isOwner) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (!error) {
      if (onDelete) onDelete(post.id);
      setShowMenu(false);
    }
  };

  // --- BLINDAGEM DA PRÉVIA ---
  // Pegamos o comentário mais recente
  const lastComment = post.audio_comments?.[0];
  
  // Resolvemos o nome de quem comentou (tentando várias fontes para não virar "membro" à toa)
  const previewUsername = 
    lastComment?.profiles?.username || 
    lastComment?.username || 
    "alguém";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.card}
    >
      {/* CABEÇALHO */}
      <div style={styles.header}>
        <div style={styles.userInfo}>
          <img 
            src={post.profiles?.avatar_url || "/default-avatar.png"} 
            style={styles.avatar} 
            alt="User"
          />
          <div style={styles.nameGroup}>
            <span style={styles.username}>
              {post.profiles?.username ? `@${post.profiles.username}` : "@membro"}
            </span>
            <span style={styles.date}>
              {post.created_at ? new Date(post.created_at).toLocaleDateString('pt-BR') : 'Recente'}
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
                  <button onClick={handleDeletePost} style={styles.deleteBtn}>🗑️ EXCLUIR POST</button>
                ) : (
                  <span style={styles.readOnly}>SINTONIZADO</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* IMAGEM DO POST */}
      {post.image_url && (
        <div style={styles.imageContainer}>
          <img src={post.image_url} style={styles.postImage} alt="Post" />
        </div>
      )}

      <div style={styles.body}>
        {/* CONTEÚDO PRINCIPAL */}
        {post.content && <p style={styles.text}>{post.content}</p>}
        
        {post.audio_url && (
          <audio src={post.audio_url} controls style={styles.audio} />
        )}
        
        {/* PRÉVIA SENSORIAL (COMENTÁRIOS) */}
        {lastComment && (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            style={styles.previewBox} 
            onClick={() => onOpenThread(post)}
          >
            <div style={styles.previewHeader}>
              <span style={styles.previewUser}>@{previewUsername}</span>
              <span style={styles.previewBadge}>ÚLTIMA INTERAÇÃO</span>
            </div>
            <p style={styles.previewText}>
              {lastComment.content || "Enviou uma voz sintonizada..."}
            </p>
          </motion.div>
        )}

        {/* BARRA DE AÇÕES */}
        <ReactionBar 
          postId={post.id} 
          initialReactions={post.reactions}
          onOpenThread={() => onOpenThread(post)}
        />
      </div>
    </motion.div>
  );
}

const styles = {
  card: { background: "rgba(10, 10, 10, 0.5)", backdropFilter: "blur(25px)", borderRadius: "28px", border: "1px solid rgba(255, 255, 255, 0.06)", marginBottom: "20px", overflow: "hidden" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px" },
  userInfo: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" as const, border: "1px solid rgba(0, 242, 254, 0.2)" },
  nameGroup: { display: "flex", flexDirection: "column" as const },
  username: { color: "#fff", fontWeight: "900" as const, fontSize: "14px", letterSpacing: "0.5px" },
  date: { color: "rgba(255, 255, 255, 0.4)", fontSize: "10px", marginTop: "2px" },
  dotsBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px", opacity: 0.6, padding: "0 5px" },
  menuDrawer: { position: "absolute" as const, right: 0, top: "30px", background: "rgba(15, 15, 15, 0.98)", borderRadius: "14px", padding: "6px", border: "1px solid rgba(255,255,255,0.1)", zIndex: 50, minWidth: "130px" },
  deleteBtn: { background: "none", border: "none", color: "#ff4444", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer", width: "100%", textAlign: "left" as const, padding: "10px" },
  readOnly: { color: "rgba(255,255,255,0.2)", fontSize: "9px", padding: "10px", display: "block" },
  imageContainer: { width: "100%", overflow: "hidden" },
  postImage: { width: "100%", height: "auto", display: "block", maxHeight: "400px", objectFit: "cover" as const },
  body: { padding: "16px 20px 20px 20px" },
  text: { color: "#ddd", fontSize: "15px", lineHeight: "1.5", marginBottom: "12px" },
  audio: { width: "100%", height: "36px", filter: "invert(1) brightness(1.5) hue-rotate(180deg)", marginBottom: "16px", borderRadius: "8px" },
  
  // ESTILOS DA PRÉVIA (Ciano Sensorial)
  previewBox: {
    background: "rgba(0, 242, 254, 0.04)",
    padding: "12px 16px",
    borderRadius: "20px",
    borderLeft: "3px solid #00f2fe",
    marginBottom: "16px",
    cursor: "pointer",
    transition: "background 0.2s ease"
  },
  previewHeader: { display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" },
  previewUser: { color: "#00f2fe", fontSize: "11px", fontWeight: "900" as const, letterSpacing: "0.3px" },
  previewBadge: { color: "rgba(0, 242, 254, 0.4)", fontSize: "8px", fontWeight: "900" as const, letterSpacing: "1px" },
  previewText: { color: "#aaa", fontSize: "12px", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic" }
};
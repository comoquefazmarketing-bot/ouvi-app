/**
 * PROJETO OUVI – Plataforma Social de Voz
 * Versão Final Blindada - Felipe Makarios
 */

"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

export default function PostPreview(props: any) {
  const { username, createdAt, post, currentUserId, avatarUrl } = props;
  const [showMenu, setShowMenu] = useState(false);

  // Formatação limpa: "30 de dez."
  const dateLabel = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  }) : "";

  const handleDelete = async () => {
    if (!post?.id) return;
    if (confirm("Deseja apagar sua voz permanentemente?")) {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (!error) window.location.reload();
      else alert("Erro ao apagar: " + error.message);
    }
  };

  return (
    <div style={styles.header}>
      <div style={styles.userInfo}>
        {/* Foto ou Inicial do Usuário */}
        <div style={{
          ...styles.avatar,
          backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!avatarUrl && (username ? username.charAt(0).toUpperCase() : "U")}
        </div>
        
        <div style={styles.details}>
          <span style={styles.name}>@{username || "membro"}</span>
          <span style={styles.dot}>•</span>
          <span style={styles.date}>{dateLabel}</span>
        </div>
      </div>

      {/* Só libera o menu se o usuário logado for o dono do post */}
      {currentUserId === post?.user_id && (
        <div style={{ position: "relative" }}>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowMenu(!showMenu); 
            }} 
            style={styles.moreBtn}
          >
            •••
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                {/* Overlay invisível para fechar ao clicar fora */}
                <div style={styles.overlay} onClick={() => setShowMenu(false)} />
                
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  style={styles.dropdown}
                >
                  <div onClick={handleDelete} style={styles.deleteOption}>
                    <Trash2 size={14} />
                    <span>Apagar Post</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" as "relative" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { 
    width: "36px", height: "36px", borderRadius: "50%", 
    background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)", 
    display: "flex", alignItems: "center", justifyContent: "center", 
    color: "#000", fontWeight: "900" as "900", fontSize: "14px",
    border: "1px solid #1a1a1a", overflow: "hidden" as "hidden"
  },
  details: { display: "flex", alignItems: "center", gap: "6px" },
  name: { color: "#fff", fontSize: "14px", fontWeight: "900" as "900" },
  dot: { color: "#333", fontSize: "12px" },
  date: { color: "#555", fontSize: "11px", fontWeight: "700" as "700" },
  moreBtn: { background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "20px", padding: "5px" },
  overlay: { position: "fixed" as "fixed", inset: 0, zIndex: 90 },
  dropdown: { 
    position: "absolute" as "absolute", top: "35px", right: "0", width: "160px", 
    background: "rgba(10, 10, 10, 0.98)", backdropFilter: "blur(15px)", 
    borderRadius: "15px", border: "1px solid #222", zIndex: 100, overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.8)"
  },
  deleteOption: { 
    padding: "15px", color: "#ff4444", fontSize: "11px", 
    fontWeight: "900" as "900", cursor: "pointer",
    display: "flex", alignItems: "center", gap: "10px",
    textTransform: "uppercase" as "uppercase"
  }
};
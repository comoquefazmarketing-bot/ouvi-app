/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Versão Final Blindada - Felipe Makarios
 */

"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function PostHeader(props: any) {
  const { username, createdAt, post, currentUserId } = props;
  const [showMenu, setShowMenu] = useState(false);

  // Formatação segura da data
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
        <div style={styles.avatar}>
          {username ? username.charAt(0).toUpperCase() : "U"}
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
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
            style={styles.moreBtn}
          >
            •••
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div style={styles.overlay} onClick={() => setShowMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  style={styles.dropdown}
                >
                  <div onClick={handleDelete} style={styles.deleteOption}>
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
  avatar: { width: "35px", height: "35px", borderRadius: "50%", background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: "bold" as "bold", fontSize: "14px" },
  details: { display: "flex", alignItems: "center", gap: "5px" },
  name: { color: "#fff", fontSize: "14px", fontWeight: "bold" as "bold" },
  dot: { color: "#444", fontSize: "12px" },
  date: { color: "#666", fontSize: "12px" },
  moreBtn: { background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "20px", padding: "5px" },
  overlay: { position: "fixed" as "fixed", inset: 0, zIndex: 90 },
  dropdown: { 
    position: "absolute" as "absolute", top: "35px", right: "0", width: "140px", 
    background: "rgba(15, 15, 15, 0.95)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)", zIndex: 100, overflow: "hidden" 
  },
  deleteOption: { padding: "15px", color: "#ff4444", fontSize: "12px", fontWeight: "800" as "bold", cursor: "pointer" }
};

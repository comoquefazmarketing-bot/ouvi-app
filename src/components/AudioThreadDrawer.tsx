"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function AudioThreadDrawer({ postId, open, onClose }: any) {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (open && postId) {
      supabase.from("audio_comments").select("*").eq("post_id", postId)
        .then(({ data }) => setComments(data || []));
    }
  }, [open, postId]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fundo escuro que suaviza ao entrar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ 
              position: "fixed", 
              inset: 0, 
              background: "rgba(0,0,0,0.85)", 
              backdropFilter: "blur(4px)",
              zIndex: 9998 
            }} 
          />
          
          {/* A GAVETA: Desliza de baixo (100%) para a posição final (0) */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed",
              bottom: 0,
              right: 0,
              height: "90vh",
              width: "400px",
              maxWidth: "100%",
              backgroundColor: "#050505",
              borderLeft: "6px solid #ff00ff", // Borda magenta do sucesso
              borderTop: "1px solid #222",
              borderRadius: "24px 24px 0 0",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              padding: "24px",
              boxShadow: "0 -20px 50px rgba(0,0,0,0.8)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ color: "#00f2fe", fontSize: "12px", letterSpacing: "2px", fontWeight: "bold" }}>
                RESSONÂNCIAS (V13-MOTION)
              </h2>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "10px" }}>
              {comments.length === 0 ? (
                <p style={{ color: "#444", textAlign: "center", marginTop: "40px" }}>Nenhuma ressonância ainda...</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} style={{ background: "#0f0f0f", padding: "15px", borderRadius: "16px", marginBottom: "12px", border: "1px solid #1a1a1a" }}>
                    <div style={{ color: "#00f2fe", fontSize: "11px", marginBottom: "8px" }}>@{c.user_email?.split('@')[0] || 'membro'}</div>
                    <audio controls src={c.audio_url} style={{ width: "100%", height: "35px", filter: "invert(1) hue-rotate(180deg)" }} />
                  </div>
                ))
              )}
            </div>

            {/* BOTÃO DE AÇÃO PARA O FUTURO GRAVADOR */}
            <div style={{ marginTop: "20px", padding: "10px", borderTop: "1px solid #1a1a1a" }}>
                <button style={{ width: "100%", padding: "15px", borderRadius: "12px", background: "#fff", color: "#000", fontWeight: "bold", border: "none" }}>
                  GRAVAR RESSONÂNCIA
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
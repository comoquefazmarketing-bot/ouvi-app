"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function AudioDrawerAnimado({ postId, open, onClose }: any) {
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
          {/* Fundo escuro (Overlay) igual do Insta */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ 
              position: "fixed", inset: 0, 
              background: "rgba(0,0,0,0.7)", 
              backdropFilter: "blur(2px)", zIndex: 9998 
            }} 
          />
          
          {/* GAVETA ESTILO INSTAGRAM */}
          <motion.div 
            initial={{ y: "100%" }} // Sempre surge de baixo agora
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed",
              bottom: 0,
              // No PC fica na direita (400px), no celular centraliza e ocupa 95% da largura
              right: "50%", 
              transform: "translateX(50%)",
              left: "auto",
              
              // 🎯 MÁGICA DO RESPONSIVO
              height: "70vh", // Não toma a tela toda, deixa ver o fundo em cima
              width: "100%",
              maxWidth: "500px", // No PC não fica gigante
              
              backgroundColor: "#0A0A0A",
              borderTop: "1px solid #333",
              borderRadius: "20px 20px 0 0", // Arredondado em cima igual mobile apps
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.5)"
            }}
          >
            {/* Barrinha de puxar (visual) */}
            <div style={{ width: "40px", height: "4px", background: "#333", borderRadius: "2px", margin: "12px auto" }} />

            <div style={{ padding: "0 20px 20px", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#00f2fe", fontSize: "12px", letterSpacing: "1px" }}>RESSONÂNCIAS</h2>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: "18px" }}>✕</button>
              </div>

              {comments.map((c: any) => (
                <div key={c.id} style={{ background: "#111", padding: "12px", borderRadius: "15px", marginBottom: "10px", border: "1px solid #1a1a1a" }}>
                  <div style={{ color: "#00f2fe", fontSize: "10px", marginBottom: "5px" }}>@{c.user_email?.split('@')[0]}</div>
                  <audio controls src={c.audio_url} style={{ width: "100%", height: "35px", filter: "invert(1)" }} />
                </div>
              ))}
            </div>

            {/* BOTÃO FIXO NO RODAPÉ DA GAVETA */}
            <div style={{ padding: "20px", borderTop: "1px solid #1a1a1a", background: "#0A0A0A", borderRadius: "0 0 0 0" }}>
                <button style={{ width: "100%", padding: "16px", borderRadius: "12px", background: "#fff", color: "#000", fontWeight: "bold", border: "none" }}>
                  GRAVAR RESSONÂNCIA
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
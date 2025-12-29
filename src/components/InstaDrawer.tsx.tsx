"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function InstaDrawer({ postId, open, onClose }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      // Busca áudios e perfis para mostrar avatar e nome
      supabase.from("audio_comments")
        .select("*, profiles(avatar_url, full_name)")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setComments(data || []);
          setLoading(false);
        });
    }
  }, [open, postId]);

  const startRecording = () => setIsRecording(true);
  const stopRecording = () => setIsRecording(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9998, backdropFilter: "blur(5px)" }} 
          />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed", bottom: 0, left: "50%", x: "-50%",
              height: "80vh", width: "100%", maxWidth: "500px",
              backgroundColor: "#050505", borderTop: "1px solid #222",
              borderRadius: "30px 30px 0 0", zIndex: 9999,
              display: "flex", flexDirection: "column", padding: "20px",
              boxShadow: "0 -10px 40px rgba(0,0,0,1)"
            }}
          >
            <div style={{ width: 45, height: 5, background: "#333", borderRadius: 10, margin: "0 auto 15px" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, padding: "0 10px" }}>
              <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>Comentários</span>
              <span style={{ color: "#555", fontSize: "12px" }}>{comments.length} áudios</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingBottom: "120px" }}>
              {loading ? (
                [1,2,3].map(i => <div key={i} style={{ height: 90, background: "#111", borderRadius: 20, marginBottom: 15, opacity: 0.5 }} />)
              ) : (
                comments.map((c, index) => (
                  <div key={c.id} style={{ 
                    background: "#0f0f0f", padding: "15px", borderRadius: "20px", marginBottom: "12px",
                    border: index === 0 ? "1px solid #ffd700" : "1px solid #1a1a1a",
                    position: "relative"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#222", marginRight: 10, overflow: 'hidden' }}>
                         <img src={`https://github.com/identicons/${c.user_id}.png`} style={{width: '100%'}} />
                      </div>
                      <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>@{c.user_email?.split('@')[0]}</span>
                      {index === 0 && <span style={{ marginLeft: "auto", fontSize: "14px" }}>🏆</span>}
                    </div>
                    
                    <audio controls src={c.audio_url} style={{ width: "100%", height: "35px", filter: "invert(1)" }} />
                    
                    <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "11px", color: "#666" }}>
                      <span style={{ cursor: "pointer" }}>❤️ Curtir</span>
                      <span style={{ cursor: "pointer" }}>💬 Responder</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* BOTÃO GRAVAR BLACK PIANO */}
            <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "linear-gradient(to top, #050505 80%, transparent)" }}>
              <motion.button
                onMouseDown={startRecording} onMouseUp={stopRecording}
                onTouchStart={startRecording} onTouchEnd={stopRecording}
                animate={isRecording ? { scale: 1.2, backgroundColor: "#ff0000", boxShadow: "0 0 30px #ff0000" } : { scale: 1 }}
                style={{
                  width: "75px", height: "75px", borderRadius: "50%",
                  background: "linear-gradient(145deg, #1a1a1a, #000000)",
                  border: "2px solid #333", cursor: "pointer",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px"
                }}
              >
                {isRecording ? "🔴" : "🎤"}
              </motion.button>
              <span style={{ color: isRecording ? "#ff0000" : "#444", fontSize: "11px", marginTop: "10px", fontWeight: "bold" }}>
                {isRecording ? "GRAVANDO..." : "SEGURE PARA GRAVAR"}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
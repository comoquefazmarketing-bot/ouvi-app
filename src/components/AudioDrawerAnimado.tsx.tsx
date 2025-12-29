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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9998 }} 
          />
          
          <motion.div 
            initial={{ y: "100%" }} // Começa embaixo da tela
            animate={{ y: 0 }}      // Sobe para a posição final
            exit={{ y: "100%" }}    // Desce ao fechar
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed",
              bottom: 0,
              right: 20,
              height: "85vh",
              width: "400px",
              backgroundColor: "#080808",
              borderLeft: "5px solid #ff00ff", // Borda rosa choque
              borderTop: "1px solid #333",
              borderRadius: "25px 25px 0 0",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              padding: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ color: "#00f2fe", fontSize: "14px" }}>RESSONÂNCIAS V14</h2>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto" }}>
              {comments.map((c: any) => (
                <div key={c.id} style={{ background: "#111", padding: "12px", borderRadius: "12px", marginBottom: "10px" }}>
                  <audio controls src={c.audio_url} style={{ width: "100%", filter: "invert(1)" }} />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
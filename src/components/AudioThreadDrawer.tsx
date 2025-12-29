"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AudioThreadDrawer({ postId, open, onClose }: any) {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (open && postId) {
      supabase.from("audio_comments").select("*").eq("post_id", postId)
        .then(({ data }) => setComments(data || []));
    }
  }, [open, postId]);

  if (!open) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9998 }} onClick={onClose} />
      <div style={{ 
        position: "fixed", top: 0, right: 0, height: "100vh", 
        width: "400px", // 🎯 LARGURA FIXA
        backgroundColor: "#080808",
        borderLeft: "2px solid #00f2fe", // Borda neon para confirmar atualização
        zIndex: 9999, display: "flex", flexDirection: "column",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
      }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ color: "#00f2fe", fontSize: "14px" }}>RESSONÂNCIAS (v3)</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {comments.map((c) => (
            <div key={c.id} style={{ background: "#111", padding: "15px", borderRadius: "15px", marginBottom: "15px", border: "1px solid #222" }}>
              <span style={{ fontSize: "11px", color: "#00f2fe", display: "block", marginBottom: "8px" }}>@{c.user_email?.split('@')[0]}</span>
              <audio controls src={c.audio_url} style={{ width: "100%", height: "35px", filter: "invert(100%) brightness(1.5)" }} />
              
              {/* Botões de Reação solicitados */}
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                {['🔥', '⚡', '🔊', '💎'].map(emoji => (
                  <button key={emoji} style={{ background: "#1a1a1a", border: "none", borderRadius: "8px", padding: "5px 10px", cursor: "pointer" }}>{emoji}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
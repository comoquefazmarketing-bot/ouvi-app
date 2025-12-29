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
      {/* Fundo escuro */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9998 }} onClick={onClose} />
      
      {/* Gaveta com Borda de Teste Magenta */}
      <div style={{ 
        position: "fixed", top: 0, right: 0, height: "100vh", 
        width: "400px", // 🎯 LARGURA FIXA 400PX
        backgroundColor: "#050505", 
        borderLeft: "4px solid #ff00ff", // 🎯 SE ISSO NÃO APARECER, O IMPORT ESTÁ ERRADO
        zIndex: 9999, display: "flex", flexDirection: "column",
        boxShadow: "-10px 0 50px #000"
      }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ color: "#00f2fe", fontSize: "14px", letterSpacing: "2px" }}>RESSONÂNCIAS ATIVAS</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {comments.map((c) => (
            <div key={c.id} style={{ background: "#111", padding: "15px", borderRadius: "15px", marginBottom: "15px", border: "1px solid #222" }}>
              <span style={{ fontSize: "11px", color: "#00f2fe", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                @{c.user_email?.split('@')[0]}
              </span>
              
              {/* Player Corrigido */}
              <audio controls src={c.audio_url} style={{ width: "100%", height: "35px", filter: "invert(1) brightness(1.5)" }} />
              
              {/* Reações para Euforia */}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {['🔥', '⚡', '🔊', '💎'].map(emoji => (
                  <button key={emoji} style={{ background: "#1a1a1a", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}>{emoji}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
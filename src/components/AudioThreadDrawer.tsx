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
        width: "400px", // 🎯 TRAVADO EM 400PX
        backgroundColor: "#000033", // 🎯 AZUL PARA TESTE
        borderLeft: "5px solid #ffff00", // 🎯 BORDA AMARELA PARA TESTE
        zIndex: 9999, display: "flex", flexDirection: "column", padding: "20px"
      }}>
        <h2 style={{ color: "#fff" }}>VERSÃO FORÇADA 5.0</h2>
        <button onClick={onClose} style={{ color: "white", position: "absolute", top: 20, right: 20 }}>✕</button>
        
        <div style={{ marginTop: "40px", flex: 1, overflowY: "auto" }}>
          {comments.map((c: any) => (
            <div key={c.id} style={{ background: "#111", padding: "15px", borderRadius: "10px", marginBottom: "10px" }}>
              <audio controls src={c.audio_url} style={{ width: "100%", filter: "invert(1) brightness(2)" }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AudioThreadDrawerProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export default function AudioThreadDrawer({ postId, open, onClose }: AudioThreadDrawerProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && postId) fetchComments();
  }, [open, postId]);

  async function fetchComments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("audio_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error) setComments(data || []);
    setLoading(false);
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      <div style={styles.overlay} onClick={onClose} />
      
      <div style={styles.drawer}>
        <div style={styles.header}>
          <h2 style={styles.title}>RESSONÂNCIAS</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.status}>Sintonizando...</div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} style={styles.audioCard}>
                <span style={styles.user}>@{c.user_email?.split('@')[0] || 'membro'}</span>
                {/* 🎯 Player com filtro para aparecer no tema escuro */}
                <audio controls src={c.audio_url} style={styles.player} />
                
                {/* Reações Rápidas */}
                <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                  {['🔥', '⚡', '🔊', '💎'].map(emoji => (
                    <button key={emoji} style={styles.emojiBtn}>{emoji}</button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.empty}>Silêncio absoluto por aqui.</div>
          )}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9998 },
  drawer: { 
    position: "fixed", top: 0, right: 0, height: "100vh", 
    width: "400px", // 🎯 FIXO: Largura perfeita
    maxWidth: "85vw", backgroundColor: "#080808", borderLeft: "1px solid #1A1A1A", 
    zIndex: 9999, display: "flex", flexDirection: "column", boxShadow: "-20px 0 50px rgba(0,0,0,0.9)" 
  },
  header: { padding: "20px", borderBottom: "1px solid #151515", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "14px", fontWeight: "bold", color: "#00f2fe", letterSpacing: "2px" },
  closeBtn: { background: "none", border: "none", color: "#444", fontSize: "20px", cursor: "pointer" },
  content: { flex: 1, overflowY: "auto", padding: "20px" },
  audioCard: { background: "#111", borderRadius: "15px", padding: "15px", marginBottom: "15px", border: "1px solid #222" },
  user: { fontSize: "11px", color: "#00f2fe", display: "block", marginBottom: "8px", fontWeight: "bold" },
  player: { width: "100%", height: "35px", filter: "invert(100%) hue-rotate(180deg) brightness(1.5)" },
  emojiBtn: { background: "#181818", border: "none", borderRadius: "8px", padding: "5px 10px", cursor: "pointer" },
  status: { textAlign: "center", color: "#444", marginTop: "50px" },
  empty: { textAlign: "center", color: "#333", marginTop: "50px" }
};
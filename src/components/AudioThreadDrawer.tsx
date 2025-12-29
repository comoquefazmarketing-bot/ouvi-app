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

  // Função para salvar a reação no seu banco
  async function handleReaction(commentId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("resonances").insert([
      { comment_id: commentId, user_id: user?.id, content: emoji, type: 'emoji' }
    ]);
    console.log("Ressonância captada:", emoji);
  }

  if (!open) return null;

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      
      <div style={styles.drawer}>
        <div style={styles.header}>
          <h2 style={styles.title}>RESSONÂNCIAS v2</h2> {/* Adicionado v2 para teste */}
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.status}>Sintonizando frequências...</div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} style={styles.audioCard}>
                <span style={styles.user}>@{c.user_email?.split('@')[0] || 'membro'}</span>
                
                <audio controls src={c.audio_url} style={styles.player} />
                
                <div style={styles.reactionRow}>
                  {['🔥', '⚡', '🔊', '💎'].map(emoji => (
                    <button 
                      key={emoji} 
                      style={styles.emojiBtn}
                      onClick={() => handleReaction(c.id, emoji)}
                    >
                      {emoji}
                    </button>
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
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9998 },
  drawer: { 
    position: "fixed", top: 0, right: 0, height: "100vh", 
    width: "400px", // 🎯 FORÇADO
    maxWidth: "85vw", backgroundColor: "#050505", borderLeft: "1px solid #111", 
    zIndex: 9999, display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(0,0,0,1)" 
  },
  header: { padding: "20px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "14px", fontWeight: "bold", color: "#00f2fe", letterSpacing: "2px" },
  closeBtn: { background: "none", border: "none", color: "#444", fontSize: "20px", cursor: "pointer" },
  content: { flex: 1, overflowY: "auto", padding: "20px" },
  audioCard: { background: "#0c0c0c", borderRadius: "15px", padding: "18px", marginBottom: "15px", border: "1px solid #151515" },
  user: { fontSize: "11px", color: "#00f2fe", display: "block", marginBottom: "10px", fontWeight: "bold" },
  player: { width: "100%", height: "35px", filter: "invert(100%) brightness(1.8)" },
  reactionRow: { display: "flex", gap: "8px", marginTop: "15px" },
  emojiBtn: { background: "#1a1a1a", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "16px" },
  status: { textAlign: "center", color: "#333", marginTop: "50px" },
  empty: { textAlign: "center", color: "#222", marginTop: "50px" }
};
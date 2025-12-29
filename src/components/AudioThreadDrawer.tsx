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
                <span style={styles.user}>@{c.user_email?.split('@')[0]}</span>
                <audio controls src={c.audio_url} style={styles.player} />
              </div>
            ))
          ) : (
            <div style={styles.empty}>Nenhum sinal sonoro.</div>
          )}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 999 },
  drawer: { position: "fixed", top: 0, right: 0, height: "100vh", width: "100%", maxWidth: "400px", background: "#050505", borderLeft: "1px solid #111", zIndex: 1000, display: "flex", flexDirection: "column" },
  header: { padding: "20px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "14px", fontWeight: "bold", color: "#00f2fe", letterSpacing: "2px" },
  closeBtn: { background: "none", border: "none", color: "#444", fontSize: "20px", cursor: "pointer" },
  content: { flex: 1, overflowY: "auto", padding: "20px" },
  audioCard: { background: "#0a0a0a", borderRadius: "15px", padding: "12px", marginBottom: "12px", border: "1px solid #151515" },
  user: { fontSize: "11px", color: "#666", display: "block", marginBottom: "8px" },
  player: { width: "100%", height: "30px" },
  status: { textAlign: "center", color: "#333", marginTop: "50px" },
  empty: { textAlign: "center", color: "#222", marginTop: "50px" }
};
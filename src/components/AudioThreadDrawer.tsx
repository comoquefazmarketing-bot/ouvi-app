"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export default function AudioThreadDrawer({ postId, open, onClose }: Props) {
  const [comments, setComments] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (open) fetchComments();
  }, [open, postId]);

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments(data || []);
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Ative o microfone!"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${Date.now()}.webm`;
      await supabase.storage.from("post-images").upload(`audios/${fileName}`, blob);
      const { data: pubUrl } = supabase.storage.from("post-images").getPublicUrl(`audios/${fileName}`);

      await supabase.from("comments").insert([{
        post_id: postId,
        user_id: user?.id || "0c8314cc-2731-4bf2-99a1-d8cd2725d77f",
        audio_url: pubUrl.publicUrl,
        user_email: user?.email || "felipe@ouvi.app"
      }]);
      fetchComments();
    } catch (err) { console.error(err); }
  };

  if (!open) return null;

  return (
    <>
      {/* OVERLAY: Ocupa tudo e fecha ao clicar */}
      <div 
        style={styles.overlay} 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }} 
      />

      {/* GAVETA: Travada na largura do feed e centralizada */}
      <div style={styles.drawerContainer}>
        <div style={styles.header}>
          <div style={styles.handle} />
          <div style={styles.headerTop}>
            <h2 style={styles.title}>Comentários</h2>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        <div style={styles.content}>
          {comments.length === 0 ? (
            <p style={styles.emptyText}>Ninguém falou nada ainda...</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={styles.commentRow}>
                <div style={styles.avatarMini} />
                <div style={styles.audioCard}>
                   <audio src={c.audio_url} controls style={styles.audioPlayer} />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.recordSection}>
            <span style={{...styles.label, color: isRecording ? "#ff3040" : "#666"}}>
              {isRecording ? "GRAVANDO... SOLTE" : "Segure para falar"}
            </span>
            <button 
              onMouseDown={startRecording} onMouseUp={stopRecording}
              onTouchStart={startRecording} onTouchEnd={stopRecording}
              style={{...styles.micBtn, background: isRecording ? "#ff3040" : "#fff"}}
            >
              🎙️
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { 
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 9998 
  },
  drawerContainer: { 
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", 
    width: "100%", maxWidth: 420, height: "70vh", background: "#0a0a0a", 
    borderTopLeftRadius: 30, borderTopRightRadius: 30, border: "1px solid #1a1a1a", 
    zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden" 
  },
  header: { padding: "15px 20px", borderBottom: "1px solid #151515" },
  handle: { width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 10px" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 14, fontWeight: "bold", color: "#fff", textTransform: "uppercase" },
  closeBtn: { background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" },
  content: { flex: 1, overflowY: "auto", padding: "20px" },
  commentRow: { display: "flex", gap: 10, marginBottom: 15 },
  avatarMini: { width: 28, height: 28, borderRadius: "50%", background: "#222" },
  audioCard: { flex: 1, background: "#111", borderRadius: 15, overflow: "hidden" },
  audioPlayer: { width: "100%", height: 30 },
  emptyText: { textAlign: "center", opacity: 0.3, marginTop: 30, fontSize: 13 },
  footer: { padding: "20px", background: "#050505", borderTop: "1px solid #151515" },
  recordSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  label: { fontSize: 10, fontWeight: "bold" },
  micBtn: { width: 65, height: 65, borderRadius: "50%", border: "none", fontSize: 24, cursor: "pointer", transition: "0.2s" },
};
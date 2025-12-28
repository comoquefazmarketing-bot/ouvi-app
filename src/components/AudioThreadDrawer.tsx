"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
}

interface AudioItem {
  id: string;
  user: string;
  url: string;
  duration: string;
}

export default function AudioThreadDrawer({ postId, open, onClose }: Props) {
  const [recording, setRecording] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open) return;

    async function loadAudios() {
      const { data, error } = await supabase
        .from("audio_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar áudios:", error);
        return;
      }

      setAudios(
        (data ?? []).map((a: any) => ({
          id: a.id,
          user: a.user_id?.slice(0, 6) ?? "user",
          url: a.audio_url,
          duration: "—",
        }))
      );
    }

    loadAudios();
  }, [open, postId]);

  if (!open) return null;

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      recorder.onstop = async () => {
        setLoading(true);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const filePath = `${postId}/${Date.now()}.webm`;

        const { error: uploadError } = await supabase.storage
          .from("audio-comments")
          .upload(filePath, blob, { contentType: "audio/webm" });

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          setLoading(false);
          return;
        }

        const { data: publicData } = supabase.storage.from("audio-comments").getPublicUrl(filePath);
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("audio_comments").insert({
          post_id: postId,
          user_id: user?.id,
          audio_url: publicData.publicUrl,
        });

        setAudios((prev) => [
          { id: crypto.randomUUID(), user: "voce", url: publicData.publicUrl, duration: "—" },
          ...prev,
        ]);

        setLoading(false);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error("Microfone negado:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  function playAudio(el: HTMLAudioElement) {
    if (activeAudioRef.current && activeAudioRef.current !== el) {
      activeAudioRef.current.pause();
    }
    activeAudioRef.current = el;
    el.play();
  }

  return (
    <div style={styles.overlay}>
      <style>{pulseCss}</style>
      <div style={styles.drawer}>
        <header style={styles.header}>
          <span style={styles.title}>Ressonâncias</span>
          <button onClick={onClose} style={styles.close}>✕</button>
        </header>

        <main style={styles.list}>
          {audios.length === 0 && !loading && (
            <span style={{ opacity: 0.4, fontSize: 13, textAlign: 'center', marginTop: 20 }}>
              Silêncio absoluto. Seja o primeiro a soar.
            </span>
          )}

          {audios.map((audio) => (
            <div key={audio.id} style={styles.audioRow}>
              <div style={styles.avatar} />
              <div style={{ flex: 1 }}>
                <b style={styles.user}>@{audio.user}</b>
                <audio
                  src={audio.url}
                  controls
                  onPlay={(e) => playAudio(e.currentTarget)}
                  style={styles.audio}
                />
              </div>
            </div>
          ))}
        </main>

        <footer style={styles.footer}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: recording ? "#ff3040" : "#fff" }}>
              {recording ? "OUVINDO VOCÊ..." : loading ? "SINTONIZANDO..." : "RESSONAR"}
            </span>
            <span style={{ fontSize: 10, opacity: 0.5 }}>
              {recording ? "Solte para enviar" : "Segure o mic"}
            </span>
          </div>

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{
              ...styles.micBtn,
              background: recording ? "#ff3040" : "#fff",
              color: recording ? "#fff" : "#000",
              animation: recording ? "pulse 1.2s infinite" : "none",
              transform: loading ? "scale(0.8)" : "scale(1)",
              opacity: loading ? 0.5 : 1
            }}
            disabled={loading}
          >
            {loading ? "..." : "🎙️"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const pulseCss = `
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255,48,64,0.7); transform: scale(1); }
  70% { box-shadow: 0 0 0 20px rgba(255,48,64,0); transform: scale(1.05); }
  100% { box-shadow: 0 0 0 0 rgba(255,48,64,0); transform: scale(1); }
}
audio::-webkit-media-controls-panel { background-color: #111; }
audio::-webkit-media-controls-current-time-display { color: #fff; }
audio::-webkit-media-controls-time-remaining-display { color: #fff; }
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", zIndex: 999, display: "flex", alignItems: "flex-end" },
  drawer: { width: "100%", maxHeight: "80vh", background: "#050505", borderRadius: "32px 32px 0 0", display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255,255,255,0.1)" },
  header: { padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: 'center' },
  title: { fontWeight: 900, fontSize: 18, letterSpacing: -0.5, color: '#fff' },
  close: { background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: '50%', cursor: "pointer" },
  list: { flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 },
  audioRow: { display: "flex", gap: 12, alignItems: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(45deg,#00f2fe,#4facfe)", flexShrink: 0 },
  user: { fontSize: 13, color: "#00f2fe", marginLeft: 4 },
  audio: { width: "100%", marginTop: 8, height: 36, filter: "invert(100%) hue-rotate(180deg) brightness(1.5)" },
  footer: { padding: "24px 30px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", background: '#080808' },
  micBtn: { width: 64, height: 64, borderRadius: "50%", border: "none", fontSize: 24, cursor: "pointer", transition: "all 0.3s ease", display: 'grid', placeItems: 'center' },
};
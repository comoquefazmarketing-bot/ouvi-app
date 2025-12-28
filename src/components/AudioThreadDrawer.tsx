"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export default function AudioThreadDrawer({ postId, open, onClose }: Props) {
  const [audios, setAudios] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const REAL_USER_ID = "0c8314cc-2731-4bf2-99a1-d8cd2725d77f";

  useEffect(() => {
    if (open) fetchAudios();
  }, [open, postId]);

  async function fetchAudios() {
    setLoading(true);
    const { data, error } = await supabase
      .from("audios")
      .select(`*, profiles (username, avatar_url)`)
      .eq("post_id", postId) // 🎯 Filtro crucial: apenas áudios deste post
      .order("created_at", { ascending: true });

    if (!error) setAudios(data || []);
    setLoading(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadAudio(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Erro ao acessar microfone");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function uploadAudio(blob: Blob) {
    const fileName = `${REAL_USER_ID}-${Date.now()}.webm`;
    const filePath = `resonances/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("post-audios")
      .upload(filePath, blob);

    if (uploadError) return alert("Erro no upload");

    const { data: publicUrl } = supabase.storage.from("post-audios").getPublicUrl(filePath);

    await supabase.from("audios").insert([{
      post_id: postId,
      user_id: REAL_USER_ID,
      audio_url: publicUrl.publicUrl
    }]);

    fetchAudios();
  }

  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.drawer}>
        <div style={styles.header}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <span style={styles.title}>RESSONÂNCIAS</span>
        </div>

        <div style={styles.audioList}>
          {loading ? (
            <div style={styles.status}>Sincronizando frequências...</div>
          ) : audios.length === 0 ? (
            <div style={styles.status}>Nenhuma voz detectada ainda.</div>
          ) : (
            audios.map((audio) => (
              <div key={audio.id} style={styles.audioItem}>
                <div style={{...styles.avatar, backgroundImage: `url(${audio.profiles?.avatar_url})` || 'none'}} />
                <div style={styles.audioContent}>
                   <div style={styles.audioInfo}>@{audio.profiles?.username || 'membro'}</div>
                   <audio src={audio.audio_url} controls style={styles.player} />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          <button 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{...styles.recordBtn, background: isRecording ? '#ff3040' : '#00f2fe'}}
          >
            {isRecording ? "GRAVANDO..." : "SEGURE PARA FALAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' },
  drawer: { width: '100%', maxWidth: 420, background: '#080808', borderTop: '1px solid #1a1a1a', borderRadius: '30px 30px 0 0', height: '80vh', display: 'flex', flexDirection: 'column' },
  header: { padding: 20, display: 'flex', alignItems: 'center', borderBottom: '1px solid #111' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 20, marginRight: 15 },
  title: { fontWeight: 'bold', fontSize: 12, letterSpacing: 2, color: '#444' },
  audioList: { flex: 1, overflowY: 'auto', padding: 20 },
  audioItem: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' },
  avatar: { width: 35, height: 35, borderRadius: '50%', background: '#222', backgroundSize: 'cover' },
  audioContent: { flex: 1 },
  audioInfo: { fontSize: 11, fontWeight: 'bold', marginBottom: 5, color: '#666' },
  player: { width: '100%', height: 35 },
  status: { textAlign: 'center', marginTop: 50, fontSize: 12, opacity: 0.4 },
  footer: { padding: 20, borderTop: '1px solid #111' },
  recordBtn: { width: '100%', padding: 18, borderRadius: 20, border: 'none', fontWeight: 'bold', fontSize: 13, color: '#000', cursor: 'pointer' }
};
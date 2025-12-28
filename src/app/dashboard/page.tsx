"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

interface AudioThreadProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export default function AudioThreadDrawer({ postId, open, onClose }: AudioThreadProps) {
  const [audios, setAudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Ouvindo...");
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // 1. Carregar áudios existentes quando abrir
  useEffect(() => {
    if (open && postId) {
      fetchAudios();
    }
  }, [open, postId]);

  async function fetchAudios() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audios") // Certifique-se que o nome da tabela é 'audios'
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAudios(data || []);
    } catch (err) {
      console.error("Erro ao carregar ressonâncias:", err);
    } finally {
      setLoading(false);
    }
  }

  // 2. Lógica de Gravação de Áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        await uploadAudio(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingStatus("Gravando frequência...");
    } catch (err) {
      alert("Permita o acesso ao microfone para gravar.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setRecordingStatus("Enviando...");
    }
  };

  // 3. Upload para o Storage e Banco
  const uploadAudio = async (blob: Blob) => {
    const REAL_USER_ID = "0c8314cc-2731-4bf2-99a1-d8cd2725d77f";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
    const filePath = `audios/${fileName}`;

    try {
      // Envia para o Storage
      const { error: uploadError } = await supabase.storage
        .from("post-images") // Usando o bucket que você já configurou
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      // Insere na tabela de áudios
      const { error: insertError } = await supabase.from("audios").insert([
        {
          post_id: postId,
          user_id: REAL_USER_ID,
          audio_url: publicUrlData.publicUrl,
        },
      ]);

      if (insertError) throw insertError;
      
      fetchAudios(); // Atualiza a lista
    } catch (err: any) {
      console.error("Erro no upload:", err.message);
      alert("Falha ao enviar áudio.");
    }
  };

  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.drawer}>
        <div style={styles.header}>
          <button onClick={onClose} style={styles.closeBtn}>FECHAR</button>
          <div style={styles.pulseDot} />
          <h3 style={styles.title}>RESSONÂNCIAS</h3>
        </div>

        <div style={styles.audioList}>
          {loading ? (
            <div style={styles.statusMsg}>Sincronizando áudios...</div>
          ) : audios.length > 0 ? (
            audios.map((audio) => (
              <div key={audio.id} style={styles.audioCard}>
                <div style={styles.audioHeader}>
                  <span style={styles.userTag}>@{audio.profiles?.username || "membro"}</span>
                  <span style={styles.timeTag}>{new Date(audio.created_at).toLocaleTimeString()}</span>
                </div>
                <audio controls src={audio.audio_url} style={styles.player} />
              </div>
            ))
          ) : (
            <div style={styles.statusMsg}>Silêncio absoluto. Seja o primeiro a ressoar.</div>
          )}
        </div>

        <div style={styles.recorderArea}>
          <button 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{
              ...styles.micBtn,
              background: isRecording ? "#ff3040" : "rgba(0,242,254,0.1)",
              borderColor: isRecording ? "#ff3040" : "#00f2fe",
              transform: isRecording ? "scale(1.1)" : "scale(1)"
            }}
          >
            {isRecording ? "🔴 SOLTE" : "🎙️ SEGURE"}
          </button>
          <p style={styles.micHint}>{isRecording ? "Gravando..." : "Segure para falar"}</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-end" },
  drawer: { width: "100%", maxWidth: 450, background: "#050505", borderTopLeftRadius: 40, borderTopRightRadius: 40, border: '1px solid #111', padding: 25, height: "85vh", display: "flex", flexDirection: "column" },
  header: { textAlign: "center", marginBottom: 30, position: 'relative' },
  closeBtn: { background: "none", border: "none", color: "#444", fontWeight: "bold", cursor: "pointer", fontSize: 10, letterSpacing: 2, marginBottom: 15 },
  title: { color: "#00f2fe", margin: 0, fontSize: 18, letterSpacing: 5, fontWeight: 900 },
  pulseDot: { width: 6, height: 6, background: '#00f2fe', borderRadius: '50%', margin: '0 auto 10px', boxShadow: '0 0 10px #00f2fe' },
  audioList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, paddingBottom: 20 },
  audioCard: { background: "#0c0c0c", padding: 20, borderRadius: 25, border: "1px solid #151515" },
  audioHeader: { display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 11, fontWeight: "bold" },
  userTag: { color: "#fff", opacity: 0.9 },
  timeTag: { color: "#444" },
  player: { width: "100%", height: 40, filter: "invert(1) hue-rotate(180deg)" },
  statusMsg: { textAlign: "center", color: "#333", marginTop: 50, fontSize: 13, letterSpacing: 1 },
  recorderArea: { padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, borderTop: "1px solid #111" },
  micBtn: { width: 80, height: 80, borderRadius: "50%", border: "2px solid", color: "#00f2fe", fontSize: 12, fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" },
  micHint: { fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase" }
};
/** * PROJETO OUVI — Hardware Core Estabilizado
 * Endereço de Armazenamento: audio-comments (Confirmado via Print)
 */
"use client";
import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AudioRecorder({ postId, onUploadComplete }: any) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadToSupabase(audioBlob);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Erro no hardware:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const uploadToSupabase = async (blob: Blob) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Caminho usando os buckets existentes no seu Supabase
    const filePath = `${user.id}/${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("audio-comments") 
      .upload(filePath, blob);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from("audio-comments")
        .getPublicUrl(filePath);

      await supabase.from("audio_comments").insert({
        post_id: postId,
        audio_url: publicUrl,
        user_id: user.id,
        content: "🎙️ Voz enviada"
      });

      if (onUploadComplete) onUploadComplete();
    }
  };

  return (
    <button 
      onMouseDown={startRecording} 
      onMouseUp={stopRecording}
      onTouchStart={startRecording} 
      onTouchEnd={stopRecording}
      style={styles.micBtn}
    >
      <span style={{ filter: recording ? "drop-shadow(0 0 10px #00f2fe)" : "none" }}>🎙️</span>
    </button>
  );
}

const styles = {
  micBtn: {
    background: "rgba(0, 242, 254, 0.1)",
    border: "1px solid #00f2fe",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    transition: "0.2s"
  }
};
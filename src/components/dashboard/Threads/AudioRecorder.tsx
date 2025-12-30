/** * PROJETO OUVI — Hardware V12 (Multi-Plataforma & Estabilizado) 
 * Local: src/components/Audio/AudioRecorder.tsx
 */
"use client";
import React, { useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AudioRecorder({ postId, onUploadComplete }: any) {
  const [recording, setRecording] = useState(false);
  const [volume, setVolume] = useState(0); 
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number>();

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    chunksRef.current = [];

    try {
      // 1. Pede permissão
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Setup do Visualizador (VU Meter)
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      
      // Se o contexto estiver suspenso (comum no Chrome), ele "acorda" aqui
      if (ctx.state === 'suspended') await ctx.resume();

      analyserRef.current = ctx.createAnalyser();
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setVolume(average); 
          animationRef.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      // 3. Configuração de Formato (Compatível com iPhone e Android/PC)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                       ? 'audio/webm;codecs=opus' 
                       : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (ev) => { 
        if (ev.data.size > 0) chunksRef.current.push(ev.data); 
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        if (audioBlob.size > 1000) await uploadAudio(audioBlob);
      };

      recorder.start(200);
      setRecording(true);
    } catch (err) { 
      console.error("Erro no Mic:", err);
      alert("Microfone não autorizado ou não encontrado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      
      mediaRecorderRef.current.stop();

      // Desliga o hardware (Luzinha do microfone)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      
      if (audioCtxRef.current) audioCtxRef.current.close();
      
      setRecording(false);
      setVolume(0);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Garante a extensão correta
    const extension = blob.type.includes('webm') ? 'webm' : 'm4a';
    const path = `threads/${user.id}/${Date.now()}.${extension}`;

    const { error: stError } = await supabase.storage.from("audio-comments").upload(path, blob);
    
    if (!stError) {
      const { data: { publicUrl } } = supabase.storage.from("audio-comments").getPublicUrl(path);
      
      await supabase.from("audio_comments").insert({
        post_id: postId,
        audio_url: publicUrl,
        user_id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        content: "🎙️ Voz enviada"
      });
      
      if (onUploadComplete) onUploadComplete();
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <button
        onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording}
        onTouchStart={startRecording} onTouchEnd={stopRecording}
        style={{
          ...styles.micButton,
          background: recording ? "#00f2fe" : "#111", // Mudei para ciano para combinar com o app
          boxShadow: recording ? `0 0 ${15 + volume / 1.5}px rgba(0, 242, 254, 0.5)` : "none",
        }}
      >
        {recording ? "●" : "🎙️"}
      </button>

      {recording && (
        <div style={styles.vuContainer}>
          <div style={{ ...styles.vuBar, height: `${Math.min(100, volume * 2)}%` }} />
        </div>
      )}
    </div>
  );
}

const styles = {
  micButton: {
    width: "55px", height: "55px", borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "0.2s",
    fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center",
    userSelect: "none" as const,
  },
  vuContainer: { width: "4px", height: "30px", background: "#222", borderRadius: "2px", overflow: "hidden", display: "flex", alignItems: "flex-end" },
  vuBar: { width: "100%", background: "#00f2fe", transition: "height 0.05s ease" }
};
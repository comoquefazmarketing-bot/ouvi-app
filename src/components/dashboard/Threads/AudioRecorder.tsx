/** * PROJETO OUVI — Hardware V11 (Interativo & Estabilizado) */
"use client";
import React, { useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AudioRecorder({ postId, onUploadComplete }: any) {
  const [recording, setRecording] = useState(false);
  const [volume, setVolume] = useState(0); 
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // GARANTE O ACESSO AO MICROFONE
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number>();

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // ARMAZENA O STREAM PARA DESLIGAR DEPOIS

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
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

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 1000) await uploadAudio(audioBlob);
      };

      recorder.start(200);
      setRecording(true);
    } catch (err) { console.error("Mic Error:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      
      // 1. PARA A GRAVAÇÃO
      mediaRecorderRef.current.stop();

      // 2. MATA O MICROFONE (Luzinha apaga aqui)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          t.stop(); 
          console.log("Hardware desligado");
        });
        streamRef.current = null;
      }
      
      // 3. FECHA O MOTOR DE ÁUDIO
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      
      setRecording(false);
      setVolume(0);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `threads/${Date.now()}.webm`;
    const { error: stError } = await supabase.storage.from("audio-comments").upload(path, blob);
    if (!stError) {
      const { data: { publicUrl } } = supabase.storage.from("audio-comments").getPublicUrl(path);
      await supabase.from("audio_comments").insert({
        post_id: postId,
        audio_url: publicUrl,
        user_id: user.id,
        username: user.email?.split('@')[0] || 'membro_ouvi',
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
          width: "50px", height: "50px", borderRadius: "50%",
          background: recording ? "#FF0000" : "#111",
          border: "2px solid #222", cursor: "pointer", transition: "0.1s",
          boxShadow: recording ? `0 0 ${10 + volume / 1.5}px #FF0000` : "none",
          fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center",
          userSelect: "none" 
        }}
      >
        🎙️
      </button>

      {recording && (
        <div style={styles.vuContainer}>
          <div style={{ ...styles.vuBar, height: `${Math.min(100, volume * 1.8)}%` }} />
        </div>
      )}
    </div>
  );
}

const styles = {
  vuContainer: { width: "6px", height: "35px", background: "#111", borderRadius: "3px", overflow: "hidden", display: "flex", alignItems: "flex-end" },
  vuBar: { width: "100%", background: "#FF0000", transition: "height 0.05s ease" }
};
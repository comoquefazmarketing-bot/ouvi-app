/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 4.5 (Social Hardware - Foco em Conversa)
 */

"use client";

import React, { useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AudioRecorder({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const chunksRef = useRef<Blob[]>([]);

  // Funções sociais diretas
  const handleLike = () => console.log("Curtiu!");
  const handleComment = () => console.log("Abriu Comentários!");
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'OUVI', text: 'Entre na conversa!', url: window.location.href });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const updateVolume = () => {
        const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
        analyserRef.current?.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; }
        setVolume(sum / dataArray.length);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const fileName = `${Date.now()}_voice_${session.user.id.slice(0, 5)}.webm`;
        const filePath = `threads/${fileName}`; // [cite: 2025-12-29]
        
        const { data, error } = await supabase.storage.from("post-images").upload(filePath, blob);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(filePath);
          onUploadComplete(publicUrl);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) { alert("Mic off."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setVolume(0);
      cancelAnimationFrame(animationFrameRef.current!);
      audioContextRef.current?.close();
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .btn-active:active { background: #111 !important; transform: translateY(2px); }
        .recording-glow { box-shadow: 0 0 20px rgba(255, 48, 64, 0.4); border-color: #ff3040 !important; }
      `}</style>

      <div style={styles.hardwarePanel}>
        {/* VU Meter sutil de hardware */}
        <div style={styles.vuMeter}>
          <div style={{
            ...styles.vuLevel,
            width: `${Math.min(volume * 2, 100)}%`,
            background: recording ? "#ff3040" : "#00f2fe"
          }} />
        </div>

        <div style={styles.buttonRow}>
          <button onClick={handleLike} style={styles.actionBtn} className="btn-active">
            <span style={styles.icon}>❤️</span>
          </button>

          <button onClick={handleComment} style={styles.actionBtn} className="btn-active">
            <span style={styles.icon}>💬</span>
          </button>

          {/* O Botão de "Falar" é o destaque - cara de Intercomunicador */}
          <button 
            onMouseDown={startRecording} onMouseUp={stopRecording}
            onTouchStart={startRecording} onTouchEnd={stopRecording}
            style={{...styles.talkBtn, ...(recording ? styles.talkBtnActive : {})}}
            className={recording ? "recording-glow" : ""}
          >
            <span style={styles.talkIcon}>{recording ? "●" : "TALK"}</span>
          </button>

          <button onClick={handleShare} style={styles.actionBtn} className="btn-active">
            <span style={styles.icon}>📤</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { width: "100%", padding: "10px" },
  hardwarePanel: {
    background: "#0c0c0c",
    borderRadius: "30px",
    padding: "10px",
    border: "1px solid #1a1a1a",
    boxShadow: "0 15px 35px rgba(0,0,0,0.8)"
  },
  vuMeter: {
    height: "2px", width: "40%", margin: "0 auto 10px", 
    background: "#111", borderRadius: "1px", overflow: "hidden"
  },
  vuLevel: { height: "100%", transition: "width 0.1s ease" },
  buttonRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" },
  actionBtn: {
    flex: 1, background: "none", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", height: "45px"
  },
  icon: { fontSize: "18px", opacity: 0.6 },
  talkBtn: {
    flex: 2, height: "50px", background: "#151515", border: "1px solid #222",
    borderRadius: "20px", color: "#fff", fontWeight: "900" as "900",
    fontSize: "12px", letterSpacing: "2px", cursor: "pointer",
    transition: "all 0.2s"
  },
  talkBtnActive: { background: "#ff3040", color: "#fff", border: "none" },
  talkIcon: { display: "block" },
};
/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 1.3 (Efeito Viciante - Haptic Visual)
 */

"use client";

import React, { useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AudioRecorder({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const fileName = `${Date.now()}_${session.user.id.slice(0, 5)}.webm`;
        const filePath = `threads/${fileName}`;
        const { data, error } = await supabase.storage.from("post-images").upload(filePath, blob);
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(filePath);
          onUploadComplete(publicUrl);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) { alert("Microfone não autorizado."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes liquid-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 48, 64, 0.4), 0 0 0 0 rgba(0, 242, 254, 0.2); }
          50% { box-shadow: 0 0 0 20px rgba(255, 48, 64, 0), 0 0 0 35px rgba(0, 242, 254, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 48, 64, 0), 0 0 0 0 rgba(0, 242, 254, 0); }
        }
        .recording-active {
          animation: liquid-pulse 1.2s infinite cubic-bezier(0.66, 0, 0, 1);
          transform: scale(0.95) !important;
          filter: brightness(1.2);
        }
        .btn-ouvi {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>

      <button 
        onMouseDown={startRecording} onMouseUp={stopRecording}
        onTouchStart={startRecording} onTouchEnd={stopRecording}
        className={`btn-ouvi ${recording ? "recording-active" : ""}`}
        style={{ 
          ...styles.btn, 
          background: recording ? "#ff3040" : "rgba(255,255,255,0.03)",
          border: recording ? "none" : "1px solid #1a1a1a",
          color: recording ? "#fff" : "#888",
        }}
      >
        <span style={{ fontSize: "20px", marginBottom: "4px" }}>
          {recording ? "●" : "🎙️"}
        </span>
        {recording ? "GRAVANDO..." : "SEGURE PARA FALAR"}
      </button>
    </div>
  );
}

const styles = {
  container: { width: "100%", display: "flex", justifyContent: "center", padding: "10px 0" },
  btn: { 
    width: "100%", height: "70px", borderRadius: "20px", 
    fontWeight: "900" as "900", fontSize: "10px", cursor: "pointer",
    display: "flex", flexDirection: "column" as "column", 
    alignItems: "center", justifyContent: "center",
    letterSpacing: "2px", outline: "none"
  }
};
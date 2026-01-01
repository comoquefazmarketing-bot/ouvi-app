"use client";
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AudioRecorder({ postId, triggerRecord, onUploadComplete }: { postId: any, triggerRecord: boolean, onUploadComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (triggerRecord) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [triggerRecord]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await handleUpload(audioBlob);
      };

      mediaRecorder.current.start();
    } catch (err) {
      console.error("Erro Mic:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
  };

  const handleUpload = async (blob: Blob) => {
    if (blob.size < 1000) return;
    setUploading(true);
    const fileName = `voice_${Date.now()}.webm`;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Ajustado para o nome do bucket que vi na sua imagem: audio-comments
      const { error: sErr } = await supabase.storage
        .from('audio-comments')
        .upload(fileName, blob);
      
      if (sErr) throw sErr;
      
      const { data: { publicUrl } } = supabase.storage.from('audio-comments').getPublicUrl(fileName);
      
      const { error: dbErr } = await supabase.from('audio_comments').insert([{ 
        post_id: postId, 
        user_id: user?.id,
        audio_url: publicUrl, 
        content: "Voz sintonizada",
        username: user?.user_metadata?.username || "membro"
      }]);
      
      if (dbErr) throw dbErr;
      onUploadComplete();
    } catch (err: any) { 
      console.error("Erro no envio:", err.message);
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {uploading ? (
        <span style={{ fontSize: "12px" }}>⌛</span>
      ) : (
        <span style={{ fontSize: "18px", filter: triggerRecord ? "brightness(0)" : "none" }}>
          {triggerRecord ? "●" : "🎙️"}
        </span>
      )}
    </div>
  );
}
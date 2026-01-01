"use client";
import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AudioRecorder({ postId, triggerRecord, onUploadComplete }: any) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (triggerRecord) startRecording();
    else stopRecording();
  }, [triggerRecord]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        handleUpload(audioBlob);
      };
      mediaRecorder.current.start();
    } catch (err) { console.error("Erro Mic:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === "recording") mediaRecorder.current.stop();
  };

  const handleUpload = async (blob: Blob) => {
    if (blob.size < 1000) return;
    setUploading(true);
    const fileName = `voice_${Date.now()}.webm`;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // GARANTIDO: Bucket 'audio-comments' e pasta 'replies/'
      const { error: sErr } = await supabase.storage.from('audio-comments').upload(fileName, blob);
      if (sErr) throw sErr;
      
      const { data: { publicUrl } } = supabase.storage.from('audio-comments').getPublicUrl(fileName);
      
      const { error: dbErr } = await supabase.from('audio_comments').insert([{ 
        post_id: postId, user_id: user?.id, audio_url: publicUrl, content: "Voz sintonizada", username: user?.user_metadata?.username || "membro"
      }]);
      
      if (dbErr) throw dbErr;
      onUploadComplete();
    } catch (err: any) { 
      console.error("Erro no envio do áudio:", err.message); 
    } finally {
      setUploading(false);
    }
  };

  return <span style={{ pointerEvents: "none", fontSize: "18px" }}>{uploading ? "⌛" : (triggerRecord ? "●" : "🎙️")}</span>;
}
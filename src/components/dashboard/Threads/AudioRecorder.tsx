"use client";
import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function AudioRecorder({ postId, onUploadComplete }: { postId: any, onUploadComplete: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Evita comportamentos estranhos em mobile
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return alert("Conecte-se para enviar uma voz.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Codec Opus: Alta qualidade, pouco peso
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorder.current = new MediaRecorder(stream, options);
      
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        // Para o stream de áudio (limpa o ícone de mic do navegador)
        stream.getTracks().forEach(track => track.stop());
        await handleUpload(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) { 
      console.error("Erro Mic:", err);
      alert("Microfone não encontrado ou bloqueado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async (blob: Blob) => {
    if (blob.size < 1000) return; // Ignora áudios curtíssimos (ruído)
    
    setUploading(true);
    const fileName = `reply_${Date.now()}.webm`;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Upload para a pasta de comentários de áudio
      const { error: sErr } = await supabase.storage.from('audio-comments').upload(fileName, blob);
      if (sErr) throw sErr;
      
      const { data: { publicUrl } } = supabase.storage.from('audio-comments').getPublicUrl(fileName);
      
      // 2. Insere na tabela de respostas (Replies)
      const { error: dbErr } = await supabase.from('post_replies').insert([{ 
        post_id: postId, 
        user_id: user?.id,
        audio_url: publicUrl, 
        content: "Voz sintonizada" 
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative' }}>
        {/* Efeito de Ondas quando está gravando */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.4)', zIndex: 0
              }}
            />
          )}
        </AnimatePresence>

        <motion.button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          animate={isRecording ? { scale: 1.2 } : { scale: 1 }}
          disabled={uploading}
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: isRecording ? '#ff4444' : '#00f2fe',
            border: 'none', cursor: 'pointer', fontSize: '24px',
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isRecording ? '0 0 30px rgba(255, 68, 68, 0.6)' : '0 10px 20px rgba(0,0,0,0.3)',
            transition: 'background 0.3s ease'
          }}
        >
          {uploading ? (
             <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
             >
               ⏳
             </motion.div>
          ) : (
            <span style={{ filter: isRecording ? 'none' : 'grayscale(1) brightness(0.5)' }}>🎙️</span>
          )}
        </motion.button>
      </div>

      <span style={{ 
        color: isRecording ? '#ff4444' : '#666', 
        fontSize: '10px', 
        fontWeight: '900', 
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        {isRecording ? "Sintonizando..." : "Segure para falar"}
      </span>
    </div>
  );
}
/**
 * PROJETO OUVI — ReactionBar (Comentários e Feed)
 * Foco: Visibilidade Total e Ergonomia na Direita
 */

"use client";
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function ReactionBar({ 
  postId, 
  commentId, 
  initialReactions, 
  onUploadComplete,
  onOpenThread 
}: any) {
  const [recording, setRecording] = useState(false);
  const [reactions, setReactions] = useState(initialReactions || { loved_by: [], energy: 0 });
  const [userId, setUserId] = useState<string | null>(null);
  const [realCommentCount, setRealCommentCount] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Busca respostas específicas deste comentário ou post
      const targetId = commentId || postId;
      const { count, error } = await supabase
        .from("audio_comments")
        .select("*", { count: 'exact', head: true })
        .eq(commentId ? "parent_id" : "post_id", targetId);
      
      if (!error) setRealCommentCount(count || 0);
    };

    loadData();
  }, [postId, commentId]);

  const hasLoved = userId && reactions?.loved_by?.includes(userId);

  // Lógica de Gravação (Core Intocável)
  const startRecording = async (e: any) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fileName = `${Date.now()}-${userId}.webm`;
        const path = `responses/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("audio-posts").upload(path, blob);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("audio-posts").getPublicUrl(path);
          await supabase.from("audio_comments").insert({
            post_id: postId,
            parent_id: commentId || null,
            audio_url: publicUrl,
            user_id: userId,
            content: "🎙️ Resposta de voz"
          });
          setRealCommentCount(prev => prev + 1);
          if (onUploadComplete) onUploadComplete();
        }
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) { console.warn("Erro no Mic"); }
  };

  const stopRecording = (e: any) => {
    e.stopPropagation();
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div style={styles.wrapper} onClick={(e) => e.stopPropagation()}>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.pill}
      >
        {/* INTERAÇÕES (ESQUERDA) */}
        <div style={styles.btnGroup}>
          <button style={styles.btn}>
            <span style={styles.emoji}>{hasLoved ? "❤️" : "🤍"}</span>
            <span style={styles.count}>{reactions?.loved_by?.length || 0}</span>
          </button>

          <button 
            onClick={() => onOpenThread && onOpenThread(commentId)} 
            style={styles.btn}
          >
            <span style={styles.emoji}>💬</span>
            <span style={styles.count}>{realCommentCount}</span>
          </button>
        </div>

        {/* MICROFONE (DIREITA - ALCANCE DO POLEGAR) */}
        <div style={styles.resContainer}>
          <AnimatePresence>
            {recording && (
              <div style={{ position: 'absolute' }}>
                <motion.div initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 1 }} style={styles.wave} />
              </div>
            )}
          </AnimatePresence>

          <motion.div 
            onPointerDown={startRecording} 
            onPointerUp={stopRecording}
            animate={recording ? { scale: 1.2, backgroundColor: "rgba(255, 0, 0, 0.4)" } : { scale: 1 }}
            style={styles.innerRes}
          >
            {!recording && (
              <div style={styles.idleWrapper}>
                <span style={styles.responderBtn}>RESPONDER</span>
                <div style={styles.divider} />
              </div>
            )}
            <span style={styles.emojiMic}>🎙️</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  wrapper: { 
    width: "100%", 
    display: "flex", 
    justifyContent: "flex-end", // Alinha tudo na direita da tela
    padding: "8px 0" 
  },
  pill: { 
    display: "inline-flex", 
    alignItems: "center", 
    gap: "12px", 
    padding: "4px 8px 4px 14px", 
    background: "rgba(15, 15, 15, 0.8)", 
    backdropFilter: "blur(20px)", 
    borderRadius: "100px", 
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
  },
  btnGroup: { display: "flex", gap: "12px", alignItems: "center" },
  btn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" },
  emoji: { fontSize: "14px" },
  emojiMic: { fontSize: "16px" },
  count: { fontSize: "11px", color: "#fff", fontWeight: "700" as const },
  divider: { width: "1px", height: "10px", background: "rgba(255,255,255,0.1)", margin: "0 8px" },
  resContainer: { position: "relative" as const, display: "flex", alignItems: "center", justifyContent: "center" },
  innerRes: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: "6px 10px", 
    borderRadius: "100px", 
    background: "rgba(0, 242, 254, 0.08)" 
  },
  idleWrapper: { display: "flex", alignItems: "center" },
  responderBtn: { fontSize: "9px", fontWeight: "900" as const, color: "#00f2fe", letterSpacing: "0.5px" },
  wave: { position: "absolute" as const, width: "30px", height: "30px", borderRadius: "100%", border: "2px solid #ff0000", pointerEvents: "none" as const }
};
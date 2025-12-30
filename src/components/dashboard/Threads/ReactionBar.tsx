"use client";
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function ReactionBar({ 
  postId, 
  commentId, 
  initialReactions, 
  onUploadComplete,
  onOpenThread 
}: any) {
  const [isHovered, setIsHovered] = useState(false);
  const [recording, setRecording] = useState(false);
  const [reactions, setReactions] = useState(initialReactions || { loved_by: [], energy: 0 });
  const [userId, setUserId] = useState<string | null>(null);
  const [realCommentCount, setRealCommentCount] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Carrega dados do usuário e contagem real de respostas (sub-threads)
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Busca quantas respostas este comentário específico possui
      const { count, error } = await supabase
        .from("audio_comments")
        .select("*", { count: 'exact', head: true })
        .eq("parent_id", commentId);
      
      if (!error) setRealCommentCount(count || 0);
    };

    loadData();
    
    const style = document.createElement("style");
    style.innerHTML = `* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }`;
    document.head.appendChild(style);

    const handleClickOutside = () => { if (!recording) setIsHovered(false); };
    window.addEventListener("click", handleClickOutside);
    
    return () => {
      window.removeEventListener("click", handleClickOutside);
      document.head.removeChild(style);
    };
  }, [recording, commentId]);

  const hasLoved = userId && reactions?.loved_by?.includes(userId);

  // --- LÓGICA DE ENGAJAMENTO (❤️ e ⚡) ---
  const handleLove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || !commentId) return;
    const newLovedBy = hasLoved ? reactions.loved_by.filter((id: string) => id !== userId) : [...reactions.loved_by, userId];
    const updated = { ...reactions, loved_by: newLovedBy };
    setReactions(updated);
    await supabase.from("audio_comments").update({ reactions: updated }).eq("id", commentId);
  };

  const handleEnergy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!commentId) return;
    const updated = { ...reactions, energy: (reactions.energy || 0) + 1 };
    setReactions(updated);
    await supabase.from("audio_comments").update({ reactions: updated }).eq("id", commentId);
  };

  // --- LÓGICA DE SUBIDA DE ÁUDIO (🎙️) ---
  const startRecording = async (e: any) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fileName = `${Date.now()}-${userId}.webm`;
        const path = `threads/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from("audio-comments").upload(path, blob);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("audio-comments").getPublicUrl(path);
          
          // SALVA COMO COMENTÁRIO FILHO (Tudo acontece dentro da thread)
          const { error: dbError } = await supabase.from("audio_comments").insert({
            post_id: postId,
            parent_id: commentId, // Vinculo crucial para a resposta subir no lugar certo
            audio_url: publicUrl,
            user_id: userId,
            username: "membro",
            content: "🎙️ Resposta em áudio",
            reactions: { loved_by: [], energy: 0 }
          });
          
          if (!dbError) {
            setRealCommentCount(prev => prev + 1);
            if (onUploadComplete) onUploadComplete();
          }
        }
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setRecording(true);
    } catch (err) { console.warn("Mic off"); }
  };

  const stopRecording = (e: any) => {
    e.stopPropagation();
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => !recording && setIsHovered(false)}
      onClick={(e) => { 
        e.stopPropagation(); 
        setIsHovered(true); 
      }}
      style={styles.wrapper}
    >
      <AnimatePresence>
        {(isHovered || recording || hasLoved) && (
          <motion.div 
            layout
            initial={{ opacity: 0, height: 0, scale: 0.9 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.9 }}
            style={styles.pill}
          >
            {/* ❤️ LOVE */}
            <motion.button whileTap={{ scale: 0.8 }} onClick={handleLove} style={styles.btn}>
              <span style={styles.emoji}>{hasLoved ? "❤️" : "🤍"}</span>
              <span style={styles.count}>{reactions?.loved_by?.length || 0}</span>
            </motion.button>

            {/* 💬 COMENTÁRIOS / ABRIR SUB-THREAD */}
            <motion.button 
              whileTap={{ scale: 0.8 }} 
              onClick={(e) => { e.stopPropagation(); if(onOpenThread) onOpenThread(commentId); }} 
              style={styles.btn}
            >
              <span style={styles.emoji}>💬</span>
              <span style={styles.count}>{realCommentCount}</span>
            </motion.button>

            {/* 🎙️ RESPONDER (GRAVA RESPOSTA) */}
            <div style={styles.resContainer}>
              <AnimatePresence>
                {recording && (
                  <div style={{ position: 'absolute' }}>
                    {[1, 2].map((i) => (
                      <motion.div key={i} initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 3, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }} style={styles.wave} />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <motion.div 
                onPointerDown={startRecording} 
                onPointerUp={stopRecording}
                animate={recording ? { scale: 1.8, backgroundColor: "rgba(255, 0, 0, 0.6)" } : { scale: 1 }}
                style={styles.innerRes}
              >
                <span style={styles.emoji}>🎙️</span>
                {!recording && (
                  <div style={styles.idleWrapper}>
                    <div style={styles.divider} />
                    <span style={styles.responderBtn}>RESPONDER</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ⚡ ENERGIA */}
            <motion.button whileTap={{ scale: 1.4 }} onClick={handleEnergy} style={styles.btn}>
              <span style={styles.emoji}>⚡</span>
              <span style={styles.count}>{reactions?.energy || 0}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    minHeight: "10px", 
    display: "flex",
    flexDirection: "column" as "column",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    marginTop: "-6px"
  },
  pill: { 
    display: "inline-flex", 
    alignItems: "center", 
    alignSelf: "flex-start",
    gap: "12px", 
    padding: "4px 14px",
    background: "rgba(10, 10, 10, 0.95)", 
    backdropFilter: "blur(20px)",
    borderRadius: "100px", 
    border: "1px solid rgba(0,255,255,0.15)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
    marginTop: "6px",
    marginBottom: "4px"
  },
  btn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: "0" },
  emoji: { fontSize: "14px" },
  count: { fontSize: "11px", color: "#fff", fontWeight: "700" as "700" },
  divider: { width: "1px", height: "10px", background: "rgba(255,255,255,0.2)", margin: "0 8px" },
  resContainer: { position: "relative" as "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  innerRes: { display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", borderRadius: "100px" },
  idleWrapper: { display: "flex", alignItems: "center" },
  responderBtn: { fontSize: "9px", fontWeight: "900" as "900", color: "#00FFFF", letterSpacing: "0.5px" },
  wave: { position: "absolute" as "absolute", width: "20px", height: "20px", borderRadius: "100%", border: "2px solid rgba(255, 0, 0, 0.4)", pointerEvents: "none" as "none" }
};
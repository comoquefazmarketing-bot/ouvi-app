/**
 * PROJETO OUVI – REATOR INTEGRADO (VERSÃO FEED-SAFE)
 * Correção: Contenção total dentro dos limites do feed + Alinhamento Elite.
 */

"use client";
import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import AudioRecorder from "./AudioRecorder";
import { motion, AnimatePresence } from "framer-motion";

export default function ReplyInput({ postId, onRefresh }: any) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSendText = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("audio_comments").insert([{
        post_id: postId,
        content: text,
        user_id: user?.id || null,
        username: user?.email?.split('@')[0] || 'membro_ouvi'
      }]);
      if (!error) {
        setText("");
        if (onRefresh) onRefresh();
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      {/* ONDAS SENSORIAIS - CONTIDAS */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={styles.waveContainer}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [8, 20, 8] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                style={styles.waveBar}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.inputInner}>
        <input
          placeholder="O QUE VOCÊ TEM A DIZER?..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendText()}
          style={styles.input}
        />

        <div style={styles.actionGroup}>
          {text.trim() && !isRecording && (
            <motion.button 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={handleSendText} style={styles.sendBtn}
            >
              {loading ? "..." : "ENVIAR"}
            </motion.button>
          )}

          {/* REATOR SENSORIAL - PULSAÇÃO SUBTIL */}
          <div style={styles.micPosition}>
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={styles.aura}
                />
              )}
            </AnimatePresence>

            <motion.div 
              onPointerDown={() => setIsRecording(true)} 
              onPointerUp={() => setIsRecording(false)}
              onPointerLeave={() => setIsRecording(false)}
              animate={!isRecording ? {
                scale: [1, 1.03, 1],
                opacity: [0.9, 1, 0.9]
              } : { scale: 1.1 }}
              transition={!isRecording ? {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              } : { duration: 0.2 }}
              style={{
                ...styles.recorderWrapper,
                background: isRecording ? "#00f2fe" : "rgba(0, 242, 254, 0.1)",
                boxShadow: isRecording ? "0 0 15px #00f2fe" : "none",
                border: "1px solid rgba(0, 242, 254, 0.15)"
              }}
            >
              <div style={{ filter: isRecording ? "brightness(0)" : "brightness(1.8) contrast(1.2)" }}>
                <AudioRecorder 
                  postId={postId} 
                  onUploadComplete={() => {
                    setIsRecording(false);
                    if (onRefresh) onRefresh();
                  }} 
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <p style={{...styles.hint, color: isRecording ? "#ff4444" : "#00f2fe"}}>
        {isRecording ? "SINTONIZANDO..." : "OUVI • EXPERIÊNCIA SENSORIAL"}
      </p>
    </div>
  );
}

const styles = {
  container: { 
    padding: "10px 15px 35px", 
    background: "#050505", 
    width: "100%", 
    maxWidth: "100%", // Trava absoluta
    boxSizing: "border-box" as const,
    position: "relative" as const,
    overflow: "hidden" // Garante que nada escape
  },
  waveContainer: { 
    position: "absolute" as const, 
    top: "-20px", 
    left: "50%", 
    transform: "translateX(-50%)", 
    display: "flex", 
    gap: "3px" 
  },
  waveBar: { width: "2px", background: "#00f2fe", borderRadius: "10px" },
  inputInner: {
    background: "#000", 
    borderRadius: "100px", 
    padding: "4px 4px 4px 18px",
    display: "flex", 
    alignItems: "center", 
    border: "1px solid #1a1a1a",
    minHeight: "54px",
    width: "100%",
    boxSizing: "border-box" as const,
    justifyContent: "space-between"
  },
  input: { 
    flex: 1, 
    background: "none", 
    border: "none", 
    color: "#fff", 
    outline: "none", 
    fontSize: "12px", 
    fontWeight: "900" as const,
    minWidth: "0" // Evita que o input empurre a barra
  },
  actionGroup: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer" },
  micPosition: { position: "relative" as const, display: "flex", alignItems: "center", justifyContent: "center" },
  aura: { position: "absolute" as const, width: "30px", height: "30px", borderRadius: "50%", background: "#00f2fe", zIndex: 0 },
  recorderWrapper: { 
    zIndex: 1, 
    borderRadius: "50%", 
    width: "44px", 
    height: "44px",
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    cursor: "pointer"
  },
  hint: { fontSize: "7px", fontWeight: "900" as const, textAlign: "center" as const, marginTop: "12px", letterSpacing: "2px", opacity: 0.5 }
};
/**
 * PROJETO OUVI – REATOR DE ENVIO (Bypass de Erros)
 * Ajuste: Limpeza de campos para garantir inserção no Supabase
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
      
      // Enviamos apenas o essencial para evitar erro de coluna inexistente
      const { error } = await supabase.from("audio_comments").insert([{
        post_id: postId,
        content: text,
        user_id: user?.id || null,
        username: user?.email?.split('@')[0] || 'membro_ouvi'
      }]);

      if (error) {
        console.error("Erro ao enviar texto:", error.message);
        alert("Erro ao enviar. Verifique o console.");
      } else {
        setText("");
        if (onRefresh) await onRefresh(); // Força a atualização da lista
      }
    } catch (err) { 
      console.error("Falha crítica:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={styles.container}>
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
            <button 
              onClick={handleSendText} 
              style={styles.sendBtn}
              disabled={loading}
            >
              {loading ? "..." : "ENVIAR"}
            </button>
          )}

          <div style={styles.micPosition}>
            <motion.div 
              onPointerDown={() => setIsRecording(true)} 
              onPointerUp={() => setIsRecording(false)}
              onPointerLeave={() => setIsRecording(false)}
              animate={!isRecording ? { scale: [1, 1.03, 1] } : { scale: 1.15 }}
              transition={!isRecording ? { duration: 4, repeat: Infinity } : { duration: 0.1 }}
              style={{
                ...styles.recorderWrapper,
                background: isRecording ? "#00f2fe" : "rgba(0, 242, 254, 0.1)",
                boxShadow: isRecording ? "0 0 20px #00f2fe" : "none"
              }}
            >
              <div style={{ filter: isRecording ? "brightness(0)" : "brightness(1.8)" }}>
                <AudioRecorder 
                  postId={postId} 
                  onUploadComplete={() => {
                    setIsRecording(false);
                    if (onRefresh) onRefresh(); // Atualiza a lista após o áudio subir
                  }} 
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "10px 15px 30px", width: "100%", boxSizing: "border-box" as const, background: "#050505" },
  inputInner: {
    background: "#000", borderRadius: "100px", padding: "4px 4px 4px 18px",
    display: "flex", alignItems: "center", border: "1px solid #1a1a1a", minHeight: "54px", width: "100%", boxSizing: "border-box" as const
  },
  input: { flex: 1, background: "none", border: "none", color: "#fff", outline: "none", fontSize: "12px", minWidth: "0" },
  actionGroup: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer" },
  micPosition: { position: "relative" as const },
  recorderWrapper: { borderRadius: "50%", width: "46px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
};
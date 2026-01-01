"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AudioRecorder from "./AudioRecorder";
import { motion } from "framer-motion";

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
        username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'membro'
      }]);
      if (error) throw error;
      setText("");
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      console.error("Falha no envio:", err.message);
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
            <button onClick={handleSendText} style={styles.sendBtn} disabled={loading}>
              {loading ? "..." : "ENVIAR"}
            </button>
          )}

          <div style={styles.micPosition}>
            {/* O BOTÃO AGORA É UM SÓ E CONTROLA TUDO */}
            <motion.div 
              onPointerDown={() => setIsRecording(true)} 
              onPointerUp={() => setIsRecording(false)}
              onPointerLeave={() => isRecording && setIsRecording(false)}
              animate={isRecording ? { scale: 1.3 } : { scale: 1 }}
              style={{
                ...styles.recorderWrapper,
                background: isRecording ? "#ff4444" : "#00f2fe",
                boxShadow: isRecording ? "0 0 30px rgba(255, 68, 68, 0.6)" : "0 4px 15px rgba(0,0,0,0.2)"
              }}
            >
              <AudioRecorder 
                postId={postId} 
                triggerRecord={isRecording} // Novo prop para ligar o motor
                onUploadComplete={() => {
                  setIsRecording(false);
                  if (onRefresh) onRefresh();
                }} 
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "10px 15px 25px", width: "100%", background: "transparent" }, // Fundo transparente para não ser grosseiro
  inputInner: {
    background: "rgba(10, 10, 10, 0.9)", 
    backdropFilter: "blur(10px)",
    borderRadius: "100px", 
    padding: "6px 6px 6px 20px",
    display: "flex", 
    alignItems: "center", 
    border: "1px solid rgba(255,255,255,0.1)", 
    minHeight: "50px", 
    width: "100%", 
    boxSizing: "border-box" as const
  },
  input: { flex: 1, background: "none", border: "none", color: "#fff", outline: "none", fontSize: "13px" },
  actionGroup: { display: "flex", alignItems: "center", gap: "8px" },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer", padding: "0 10px" },
  micPosition: { position: "relative" as const },
  recorderWrapper: { 
    borderRadius: "50%", 
    width: "42px", 
    height: "42px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    cursor: "pointer", 
    transition: "background 0.2s, box-shadow 0.2s" 
  }
};
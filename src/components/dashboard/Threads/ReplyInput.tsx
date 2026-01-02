"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AudioRecorder from "./AudioRecorder";
import { motion, AnimatePresence } from "framer-motion";

export default function ReplyInput({ postId, parentId, parentUsername, onCancelReply, onRefresh }: any) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSendText = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Adicionado parent_id para a lógica de "escada"
      const { error } = await supabase.from("audio_comments").insert([{
        post_id: postId,
        parent_id: parentId || null, 
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
    <div style={styles.wrapper}>
      {/* INDICADOR DE RESPOSTA (ESCADA) */}
      <AnimatePresence>
        {parentUsername && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }}
            style={styles.replyNotice}
          >
            <span style={styles.replyText}>RESPONDENDO @{parentUsername.toUpperCase()}</span>
            <button onClick={onCancelReply} style={styles.cancelBtn}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.inputInner}>
        <input
          placeholder={isRecording ? "GRAVANDO VOZ..." : "O QUE VOCÊ TEM A DIZER?..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendText()}
          style={styles.input}
          disabled={isRecording}
        />

        <div style={styles.actionGroup}>
          {text.trim() && !isRecording && (
            <button onClick={handleSendText} style={styles.sendBtn} disabled={loading}>
              {loading ? "..." : "ENVIAR"}
            </button>
          )}

          <div style={styles.micPosition}>
            <motion.div 
              onPointerDown={() => setIsRecording(true)} 
              onPointerUp={() => setIsRecording(false)}
              onPointerLeave={() => isRecording && setIsRecording(false)}
              animate={isRecording ? { scale: 1.3 } : { scale: 1 }}
              style={{
                ...styles.recorderWrapper,
                background: isRecording ? "#ff4444" : "#00f2fe",
                boxShadow: isRecording ? "0 0 30px #ff4444" : "0 4px 15px rgba(0,242,254,0.3)"
              }}
            >
              <AudioRecorder 
                postId={postId} 
                parentId={parentId} // Passa para o gravador também
                triggerRecord={isRecording}
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
  wrapper: { width: "100%", padding: "10px 20px 20px 20px", boxSizing: "border-box" as const },
  replyNotice: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 15px", background: "rgba(0, 242, 254, 0.1)", borderRadius: "10px", marginBottom: "8px" },
  replyText: { color: "#00f2fe", fontSize: "9px", fontWeight: "900" as const, letterSpacing: "1px" },
  cancelBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "12px", opacity: 0.5 },
  inputInner: { 
    background: "rgba(20, 20, 20, 0.95)", 
    backdropFilter: "blur(20px)", 
    borderRadius: "100px", 
    padding: "0 6px 0 20px", 
    display: "flex", 
    alignItems: "center", 
    border: "1px solid rgba(255,255,255,0.05)", 
    height: "56px" 
  },
  input: { flex: 1, background: "none", border: "none", color: "#fff", outline: "none", fontSize: "13px", fontWeight: "500" as const },
  actionGroup: { display: "flex", alignItems: "center", gap: "10px" },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontSize: "11px", fontWeight: "900" as const, cursor: "pointer", letterSpacing: "1px" },
  micPosition: { position: "relative" as const },
  recorderWrapper: { borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.3s ease" }
};
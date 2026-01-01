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
      <style>{`
        ::-webkit-scrollbar { display: none; }
        body { -ms-overflow-style: none; scrollbar-width: none; overflow-x: hidden; }
      `}</style>
      
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
            <motion.div 
              onPointerDown={() => setIsRecording(true)} 
              onPointerUp={() => setIsRecording(false)}
              onPointerLeave={() => isRecording && setIsRecording(false)}
              animate={isRecording ? { scale: 1.15 } : { scale: 1 }}
              style={{
                ...styles.recorderWrapper,
                background: isRecording ? "#ff4444" : "rgba(0, 242, 254, 0.1)",
                boxShadow: isRecording ? "0 0 25px rgba(255, 68, 68, 0.5)" : "none",
                border: isRecording ? "none" : "1px solid rgba(0, 242, 254, 0.2)"
              }}
            >
              <AudioRecorder 
                postId={postId} 
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
  container: { 
    position: "fixed" as const, 
    bottom: "25px", 
    left: "50%", 
    transform: "translateX(-50%)", 
    width: "92%", 
    maxWidth: "420px", 
    zIndex: 1000 
  },
  inputInner: {
    background: "rgba(10, 10, 10, 0.9)", 
    backdropFilter: "blur(20px)",
    borderRadius: "100px", 
    padding: "0 6px 0 20px",
    display: "flex", 
    alignItems: "center", 
    border: "1px solid rgba(255,255,255,0.1)", 
    height: "56px", 
    width: "100%", 
    boxSizing: "border-box" as const
  },
  input: { flex: 1, background: "none", border: "none", color: "#fff", outline: "none", fontSize: "13px" },
  actionGroup: { display: "flex", alignItems: "center", gap: "8px", height: "100%" },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer", padding: "0 10px" },
  micPosition: { display: "flex", alignItems: "center" },
  recorderWrapper: { 
    borderRadius: "50%", 
    width: "44px", 
    height: "44px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    cursor: "pointer", 
    transition: "all 0.2s ease" 
  }
};
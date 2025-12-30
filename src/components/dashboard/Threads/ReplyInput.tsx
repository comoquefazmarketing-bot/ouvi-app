/**
 * PROJETO OUVI — Command Input Stage (Ergonômico)
 * Versão: 6.7 (Remoção de parent_id para Sincronia com Banco)
 */
"use client";
import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import AudioRecorder from "./AudioRecorder";

export default function ReplyInput({ postId, onRefresh }: any) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendText = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Enviamos apenas colunas que REALMENTE existem no seu banco atual
      const payload = {
        post_id: postId,
        content: text,
        user_id: user?.id || null, 
        username: user?.email?.split('@')[0] || 'membro_ouvi'
        // parent_id removido para evitar Erro 400 no console
      };

      console.log("Enviando texto para a estrutura atual:", payload);

      const { error } = await supabase
        .from("audio_comments")
        .insert([payload]);

      if (error) {
        console.error("Erro Supabase:", error.message);
        alert("Erro ao enviar texto: " + error.message);
      } else {
        setText("");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Erro crítico no envio:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputInner}>
        
        <input
          type="text"
          placeholder="O QUE VOCÊ TEM A DIZER?..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendText();
            }
          }}
          style={styles.input}
        />

        {text.trim() && (
          <button 
            onClick={handleSendText} 
            style={styles.sendBtn}
            disabled={loading}
          >
            <span style={styles.sendIcon}>
              {loading ? "..." : "ENVIAR"}
            </span>
          </button>
        )}

        <div style={styles.audioWrapper}>
          <AudioRecorder 
            postId={postId} 
            onUploadComplete={() => {
              console.log("Interface atualizada via Audio!");
              if (onRefresh) onRefresh();
            }} 
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    padding: "10px 15px 30px", 
    background: "#050505", 
    width: "100%", 
    boxSizing: "border-box" as "border-box" 
  },
  inputInner: {
    background: "#000",
    borderRadius: "100px",
    padding: "5px 5px 5px 20px",
    display: "flex",
    alignItems: "center",
    border: "1px solid #1a1a1a",
    boxShadow: "0 0 15px rgba(0, 255, 255, 0.05)"
  },
  input: { 
    flex: 1, 
    background: "none", 
    border: "none", 
    color: "#fff", 
    outline: "none", 
    fontSize: "12px", 
    fontWeight: "600" as "600" 
  },
  sendBtn: { 
    background: "none", 
    border: "none", 
    cursor: "pointer", 
    padding: "0 10px" 
  },
  sendIcon: { 
    color: "#00FFFF", 
    fontSize: "10px", 
    fontWeight: "900" as "900", 
    letterSpacing: "1px" 
  },
  audioWrapper: { 
    flexShrink: 0,
    marginLeft: "5px"
  }
};
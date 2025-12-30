/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 1.0 (Engajamento Contínuo)
 */

"use client";

import React, { useState } from "react";
import AudioRecorder from "./AudioRecorder";

interface ReplyInputProps {
  onSendMessage: (text: string, audioUrl?: string) => void;
}

export default function ReplyInput({ onSendMessage }: ReplyInputProps) {
  const [text, setText] = useState("");

  const handleSendText = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <div style={styles.container}>
      {/* Campo de Texto para respostas rápidas */}
      <input
        type="text"
        placeholder="O que você achou disso?..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSendText()}
        style={styles.input}
      />

      <div style={styles.actionGroup}>
        {/* Botão de Voz - O Diferencial do OUVI */}
        <AudioRecorder onUploadComplete={(url) => onSendMessage("", url)} />
        
        <button onClick={handleSendText} style={styles.sendIcon}>
          🚀
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "10px",
    background: "#000",
    padding: "15px",
    borderTop: "1px solid #111"
  },
  input: {
    width: "100%",
    background: "#0c0c0c",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "12px",
    color: "#fff",
    fontSize: "14px",
    outline: "none"
  },
  actionGroup: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sendIcon: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer"
  }
};
/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 1.0 (Identidade de Autor)
 */

"use client";

import React from "react";

interface PostHeaderProps {
  username: string;
  createdAt: string;
}

export default function PostHeader({ username, createdAt }: PostHeaderProps) {
  // Formata a data de forma simples e direta
  const dateLabel = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  });

  return (
    <div style={styles.header}>
      <div style={styles.userInfo}>
        <div style={styles.avatar}>
          {username ? username.charAt(0).toUpperCase() : "U"}
        </div>
        <div style={styles.details}>
          <span style={styles.name}>@{username}</span>
          <span style={styles.dot}>•</span>
          <span style={styles.date}>{dateLabel}</span>
        </div>
      </div>
      <button style={styles.moreBtn}>•••</button>
    </div>
  );
}

const styles = {
  header: {
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
    fontWeight: "bold" as "bold",
    fontSize: "14px",
  },
  details: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  name: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "bold" as "bold",
  },
  dot: { color: "#444", fontSize: "12px" },
  date: { color: "#666", fontSize: "12px" },
  moreBtn: { background: "none", border: "none", color: "#333", cursor: "pointer" }
};

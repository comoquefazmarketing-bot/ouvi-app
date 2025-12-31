/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 1.0 (Exibição de Mídia e Legenda)
 */

"use client";

import React from "react";

interface PostContentProps {
  content: string;
  imageUrl: string | null;
}

export default function PostContent({ content, imageUrl }: PostContentProps) {
  // Detecta se o link é de um vídeo para usar o player correto
  const isVideo = imageUrl?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div style={styles.container}>
      {imageUrl && (
        <div style={styles.mediaContainer}>
          {isVideo ? (
            <video 
              src={imageUrl} 
              controls 
              style={styles.media} 
              playsInline
            />
          ) : (
            <img 
              src={imageUrl} 
              alt="Conteúdo" 
              style={styles.media} 
              loading="lazy"
            />
          )}
        </div>
      )}
      
      {content && (
        <div style={styles.textContainer}>
          <p style={styles.description}>{content}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { width: "100%" },
  mediaContainer: {
    width: "100%",
    maxHeight: "500px",
    overflow: "hidden",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  media: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  textContainer: {
    padding: "15px",
  },
  description: {
    color: "#eee",
    fontSize: "15px",
    lineHeight: "1.5",
    margin: 0,
    whiteSpace: "pre-wrap" as "pre-wrap",
  }
};

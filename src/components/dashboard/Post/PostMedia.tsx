"use client";
import React from "react";

export default function PostMedia({ url }: { url: string }) {
  if (!url) return null;

  return (
    <div style={{ 
      width: "100%", 
      padding: "0 12px", 
      boxSizing: "border-box" 
    }}>
      <img 
        src={url} 
        alt="Conteúdo" 
        style={{ 
          width: "100%", 
          height: "auto", // Deixa a imagem ditar a própria altura
          maxHeight: "650px", // Limite apenas para não quebrar o scroll infinito
          objectFit: "contain", // Garante que nada da foto seja cortado
          borderRadius: "24px",
          display: "block",
          backgroundColor: "#050505" // Fundo neutro caso a imagem tenha transparência
        }} 
        loading="lazy"
      />
    </div>
  );
}
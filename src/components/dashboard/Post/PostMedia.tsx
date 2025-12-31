"use client";

import React from "react";

export default function PostMedia({ url }: { url: string }) {
  if (!url) return null;

  return (
    <div style={styles.container}>
      <img 
        src={url} 
        alt="Conteúdo do post" 
        style={styles.image} 
        loading="lazy"
      />
    </div>
  );
}

const styles = {
  container: { 
    width: "100%", 
    padding: "0 10px", // Pequeno respiro lateral
    boxSizing: "border-box" as "border-box" 
  },
  image: { 
    width: "100%", 
    aspectRatio: "1/1", 
    objectFit: "cover" as "cover", 
    borderRadius: "20px",
    display: "block"
  }
};

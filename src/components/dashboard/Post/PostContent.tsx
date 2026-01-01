"use client";
import React from "react";

interface PostContentProps {
  content: string;
  imageUrl: string | null;
}

export default function PostContent({ content, imageUrl }: PostContentProps) {
  const isVideo = imageUrl?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div style={{ width: "100%" }}>
      {imageUrl && (
        <div style={{ 
          width: "100%", 
          borderRadius: '25px', // Arredondamos para seguir o seu PostCard
          overflow: "hidden", 
          backgroundColor: "#000",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          marginBottom: content ? '12px' : '0' 
        }}>
          {isVideo ? (
            <video 
              src={imageUrl} 
              controls 
              style={{ width: "100%", height: "auto", display: "block" }} 
              playsInline
            />
          ) : (
            <img 
              src={imageUrl} 
              alt="Conteúdo" 
              style={{ width: "100%", height: "auto", display: "block" }} 
              loading="lazy"
            />
          )}
        </div>
      )}
      
      {content && (
        <div style={{ padding: "5px 5px 15px 5px" }}>
          <p style={{ 
            color: "#ccc", // Um pouco mais suave que o branco puro
            fontSize: "14px", 
            lineHeight: "1.4", 
            margin: 0, 
            whiteSpace: "pre-wrap",
            fontWeight: '500' 
          }}>
            {content}
          </p>
        </div>
      )}
    </div>
  );
}
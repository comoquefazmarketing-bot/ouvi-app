"use client";

import React, { useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface CreatePostCardProps {
  onPostCreated: () => void; 
}

export default function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const [postText, setPostText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!postText.trim() && !selectedMedia) return;
    setIsPublishing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Acesse sua conta para publicar!");
      setIsPublishing(false);
      return;
    }

    let mediaUrl = null;
    if (selectedMedia) {
      const filePath = `post-media/${session.user.id}/${Date.now()}_${selectedMedia.name}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images") 
        .upload(filePath, selectedMedia);

      if (uploadError) {
        alert("Erro ao enviar imagem ou vídeo.");
        setIsPublishing(false);
        return;
      }
      
      mediaUrl = supabase.storage.from("post-images").getPublicUrl(filePath).data.publicUrl;
    }

    const { error: insertError } = await supabase.from("posts").insert([{
      content: postText.trim(),
      image_url: mediaUrl,
      user_id: session.user.id,
      user_email: session.user.email
    }]);

    if (!insertError) {
      setPostText("");
      setSelectedMedia(null);
      setMediaPreviewUrl(null);
      onPostCreated(); 
    }
    setIsPublishing(false);
  };

  return (
    <div style={styles.card}>
      {/* Botão de seleção inicial se não houver mídia */}
      {!mediaPreviewUrl && (
        <button 
          onClick={() => fileInputRef.current?.click()} 
          style={styles.bigSelectBtn}
        >
          <span>📸</span>
          Compartilhar Foto ou Vídeo
        </button>
      )}

      {/* Espaço da Prévia Visual com Legenda */}
      {mediaPreviewUrl && (
        <div style={styles.previewContainer}>
          <img src={mediaPreviewUrl} alt="Prévia" style={styles.previewImg} />
          
          <div style={styles.captionOverlay}>
            <textarea
              placeholder="Escreva uma legenda..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              style={styles.captionInput}
              rows={2}
            />
          </div>

          <button 
            onClick={() => {setMediaPreviewUrl(null); setSelectedMedia(null);}} 
            style={styles.removeBtn}
          >
            Trocar Mídia
          </button>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*,video/*" 
        onChange={handleMediaChange} 
      />

      {mediaPreviewUrl && (
        <button 
          onClick={handlePost} 
          style={styles.publishBtn}
          disabled={isPublishing}
        >
          {isPublishing ? "PUBLICANDO..." : "POSTAR AGORA"}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: { 
    width: "95%", 
    maxWidth: "500px", 
    margin: "20px auto",
    display: "flex",
    flexDirection: "column" as "column",
    gap: "10px"
  },
  bigSelectBtn: {
    width: "100%",
    padding: "40px",
    background: "#080808",
    border: "2px dashed #222",
    borderRadius: "20px",
    color: "#888",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px"
  },
  previewContainer: {
    position: "relative" as "relative",
    width: "100%",
    borderRadius: "20px",
    overflow: "hidden",
    background: "#000",
    border: "1px solid #111"
  },
  previewImg: {
    width: "100%",
    display: "block",
    opacity: 0.7
  },
  captionOverlay: {
    position: "absolute" as "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
    padding: "20px 15px"
  },
  captionInput: {
    width: "100%",
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
    resize: "none" as "none",
    fontFamily: "inherit"
  },
  removeBtn: {
    position: "absolute" as "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "10px",
    cursor: "pointer"
  },
  publishBtn: {
    width: "100%",
    padding: "15px",
    background: "#00f2fe",
    color: "#000",
    border: "none",
    borderRadius: "15px",
    fontWeight: "bold" as "bold",
    fontSize: "13px",
    cursor: "pointer",
    letterSpacing: "1px"
  }
};
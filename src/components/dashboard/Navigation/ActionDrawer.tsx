/**
 * PROJETO OUVI — Estúdio de Criação Consolidado
 * Autor: Felipe Makarios
 * Ajuste: Ergonomia para Polegar Direito (Mic/Ação na Direita)
 */

"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Film, Send, Trash2, Loader2, Mic } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActionDrawer({ isOpen, onClose }: ActionDrawerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePublish = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Utilizador não autenticado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `post-photos/${fileName}`; 

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      const isVideo = file.type.startsWith('video');
      
      const postData = {
        content: caption,
        caption: caption,
        user_id: user.id,
        user_email: user.email,
        image_url: isVideo ? null : publicUrl,
        video_url: isVideo ? publicUrl : null,
        is_viral: false,
        created_at: new Date().toISOString()
      };

      const { error: postError } = await supabase
        .from('posts')
        .insert([postData]);

      if (postError) throw postError;

      handleClose();
      setTimeout(() => { window.location.reload(); }, 500);

    } catch (err: any) {
      alert(`Erro: ${err.message || "Falha ao publicar"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setFile(null);
    setCaption("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={handleClose} 
            style={styles.overlay} 
          />

          <motion.div
            initial={{ y: "100%", x: "-50%" }}
            animate={{ y: 0, x: "-50%" }}
            exit={{ y: "100%", x: "-50%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            style={styles.drawer}
          >
            <div style={styles.handle} />
            
            <div style={styles.content}>
              {!file ? (
                <div style={styles.uploadGrid}>
                  {/* FOTO À ESQUERDA */}
                  <label style={styles.uploadBtn}>
                    <Image size={28} color="rgba(255,255,255,0.4)" />
                    <span style={styles.btnText}>FOTO</span>
                    <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>

                  {/* VÍDEO NO MEIO */}
                  <label style={styles.uploadBtn}>
                    <Film size={28} color="rgba(255,255,255,0.4)" />
                    <span style={styles.btnText}>VÍDEO</span>
                    <input type="file" accept="video/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>

                  {/* VOZ À DIREITA (AÇÃO PRINCIPAL / FÁCIL ALCANCE) */}
                  <label style={{...styles.uploadBtn, borderColor: "#00f2fe", background: "rgba(0, 242, 254, 0.05)"}}>
                    <Mic size={32} color="#00f2fe" />
                    <span style={{...styles.btnText, color: "#00f2fe"}}>VOZ</span>
                    {/* Aqui entrará sua lógica de gravação direta se desejar */}
                  </label>
                </div>
              ) : (
                <div style={styles.previewContainer}>
                  <div style={styles.mediaBox}>
                    {file.type.startsWith('video') ? (
                       <video src={previewUrl!} style={styles.mediaPreview} autoPlay muted loop playsInline />
                    ) : (
                       <img src={previewUrl!} style={styles.mediaPreview} alt="" />
                    )}
                    {!isUploading && (
                      <button onClick={() => setFile(null)} style={styles.removeBtn}>
                        <Trash2 size={18} color="#fff" />
                      </button>
                    )}
                  </div>

                  <textarea
                    placeholder="Dê voz ao seu pensamento..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={isUploading}
                    style={styles.captionInput}
                  />

                  {/* BOTÃO DE LANÇAR - MANTIDO NO CENTRO MAS COM DESTAQUE NA DIREITA */}
                  <motion.button 
                    onClick={handlePublish}
                    disabled={isUploading}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      ...styles.sendBtn,
                      opacity: isUploading ? 0.6 : 1,
                    }}
                  >
                    {isUploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {isUploading ? "LANÇANDO..." : "LANÇAR NO FEED"}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AnimatePresence>
  );
}

const styles = {
  overlay: { position: "fixed" as const, top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(15px)", zIndex: 999 },
  drawer: { 
    position: "fixed" as const, bottom: 0, left: "50%", transform: "translateX(-50%)", 
    width: "100%", maxWidth: "480px", background: "#0a0a0a", 
    borderTop: "1px solid rgba(255, 255, 255, 0.05)", 
    borderRadius: "32px 32px 0 0", padding: "24px", zIndex: 1000,
    maxHeight: "85vh", overflowY: "auto" as const,
    paddingBottom: "env(safe-area-inset-bottom, 40px)" 
  },
  handle: { width: "40px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", margin: "0 auto 24px" },
  content: { display: "flex", flexDirection: "column" as const, gap: "15px" },
  uploadGrid: { display: "flex", gap: "12px", padding: "10px 0" },
  uploadBtn: { flex: 1, height: "110px", background: "rgba(255,255,255,0.02)", borderRadius: "24px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.2s" },
  btnText: { color: "rgba(255,255,255,0.4)", fontSize: "9px", fontWeight: "900", letterSpacing: "1.5px" },
  previewContainer: { display: "flex", flexDirection: "column" as const, gap: "16px" },
  mediaBox: { position: "relative" as const, width: "100%", borderRadius: "24px", overflow: "hidden", aspectRatio: "1/1", background: "#000", border: "1px solid rgba(255,255,255,0.05)" },
  mediaPreview: { width: "100%", height: "100%", objectFit: "cover" as const },
  removeBtn: { position: "absolute" as const, top: "15px", right: "15px", background: "rgba(255,0,0,0.8)", border: "none", borderRadius: "50%", padding: "10px", cursor: "pointer", backdropFilter: "blur(5px)" },
  captionInput: { width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "18px", padding: "15px", color: "#fff", fontSize: "15px", minHeight: "100px", outline: "none", resize: "none" as const },
  sendBtn: { width: "100%", padding: "18px", borderRadius: "20px", background: "#00f2fe", border: "none", color: "#000", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", boxShadow: "0 10px 20px rgba(0, 242, 254, 0.2)" },
};

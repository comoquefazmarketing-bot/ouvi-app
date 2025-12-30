/**
 * PROJETO OUVI — Estúdio de Criação Consolidado
 * Autor: Felipe Makarios
 * Correção: Mapeamento exato de colunas (image_url, video_url, content, caption, user_email)
 */

"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Film, Send, Trash2, Loader2 } from "lucide-react";
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
      // 1. Obter dados do utilizador
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Utilizador não autenticado.");

      // 2. Preparar ficheiro
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `post-photos/${fileName}`; 

      // 3. Upload para o bucket 'post-images'
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 4. Obter a URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      // 5. Mapeamento Inteligente conforme as tuas fotos do Table Editor
      const isVideo = file.type.startsWith('video');
      
      const postData = {
        content: caption,            // Vi que usas 'content' para o texto principal
        caption: caption,            // Preenchemos ambos para garantir que apareça
        user_id: user.id,            // Obrigatório conforme o teu schema
        user_email: user.email,      // Coluna extra que vi no teu banco
        image_url: isVideo ? null : publicUrl,
        video_url: isVideo ? publicUrl : null,
        is_viral: false,
        created_at: new Date().toISOString()
      };

      // 6. Inserção na tabela 'posts'
      const { error: postError } = await supabase
        .from('posts')
        .insert([postData]);

      if (postError) throw postError;

      // Sucesso
      handleClose();
      // Pequeno delay antes do reload para garantir a sincronia do banco
      setTimeout(() => {
        window.location.reload(); 
      }, 500);

    } catch (err: any) {
      console.error("Erro detalhado:", err);
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={styles.drawer}
          >
            <div style={styles.handle} />
            
            <div style={styles.content}>
              {!file ? (
                <div style={styles.uploadGrid}>
                  <label style={styles.uploadBtn}>
                    <Image size={32} color="#00f2fe" />
                    <span style={styles.btnText}>FOTO</span>
                    <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <label style={styles.uploadBtn}>
                    <Film size={32} color="#00f2fe" />
                    <span style={styles.btnText}>VÍDEO</span>
                    <input type="file" accept="video/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              ) : (
                <div style={styles.previewContainer}>
                  <div style={styles.mediaBox}>
                    {file.type.startsWith('video') ? (
                       <video src={previewUrl!} style={styles.mediaPreview} autoPlay muted loop />
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
                    placeholder="Escreve uma legenda..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={isUploading}
                    style={styles.captionInput}
                  />

                  <motion.button 
                    onClick={handlePublish}
                    disabled={isUploading}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      ...styles.sendBtn,
                      opacity: isUploading ? 0.6 : 1,
                      cursor: isUploading ? "not-allowed" : "pointer"
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
  overlay: { position: "fixed" as "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 999 },
  drawer: { 
    position: "fixed" as "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", 
    width: "100%", maxWidth: "480px", background: "#0a0a0a", 
    borderTop: "1px solid rgba(0, 242, 254, 0.2)", 
    borderRadius: "32px 32px 0 0", padding: "24px", zIndex: 1000,
    maxHeight: "90vh", overflowY: "auto" as "auto",
    paddingBottom: "40px" 
  },
  handle: { width: "40px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", margin: "0 auto 24px" },
  content: { display: "flex", flexDirection: "column" as "column", gap: "15px" },
  uploadGrid: { display: "flex", gap: "15px", padding: "20px 0" },
  uploadBtn: { flex: 1, height: "120px", background: "rgba(255,255,255,0.03)", borderRadius: "20px", display: "flex", flexDirection: "column" as "column", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)" },
  btnText: { color: "#fff", fontSize: "10px", fontWeight: "800", letterSpacing: "2px" },
  previewContainer: { display: "flex", flexDirection: "column" as "column", gap: "16px" },
  mediaBox: { position: "relative" as "relative", width: "100%", borderRadius: "16px", overflow: "hidden", aspectRatio: "1/1", background: "#000" },
  mediaPreview: { width: "100%", height: "100%", objectFit: "cover" as "cover" },
  removeBtn: { position: "absolute" as "absolute", top: "12px", right: "12px", background: "rgba(255,0,0,0.7)", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer" },
  captionInput: { width: "100%", background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "12px", color: "#fff", fontSize: "14px", minHeight: "80px", outline: "none", resize: "none" as "none" },
  sendBtn: { width: "100%", padding: "16px", borderRadius: "16px", background: "#00f2fe", border: "none", color: "#000", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer" },
};
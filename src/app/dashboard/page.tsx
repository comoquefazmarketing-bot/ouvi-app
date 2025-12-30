/**
 * PROJETO OUVI — Feed de Impacto Sensorial (Visual Edition)
 * Autor: Felipe Makarios
 * Correção: Suporte para image_url, video_url e content
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

const PostCard = ({ post }: { post: any }) => {
  // Decidimos se é vídeo ou imagem baseado nas colunas do teu banco
  const isVideo = !!post.video_url;
  const mediaUrl = post.video_url || post.image_url;

  return (
    <motion.div 
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={styles.card}
    >
      {/* HEADER: Identidade do Criador */}
      <div style={styles.cardHeader}>
        <div style={styles.avatar}>
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} style={styles.img} alt="avatar" />
          ) : "👤"}
        </div>
        <div style={styles.userInfo}>
          <span style={styles.username}>@{post.profiles?.username || post.user_email?.split('@')[0] || "membro_ouvi"}</span>
          <span style={styles.time}>transmitindo • {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      {/* ÁREA VISUAL: Onde a imagem/vídeo ganha destaque */}
      <div style={styles.mediaArea}>
        {isVideo ? (
          <video 
            src={mediaUrl} 
            style={styles.mediaContent} 
            autoPlay 
            muted 
            loop 
            playsInline
          />
        ) : mediaUrl ? (
          <img src={mediaUrl} style={styles.mediaContent} alt="Post visual" />
        ) : (
          <div style={styles.noMedia}>SEM PREVIEW VISUAL</div>
        )}
      </div>

      {/* CONTEÚDO: A legenda/texto do post */}
      {post.content && (
        <div style={styles.textContent}>
          <p style={styles.captionText}>{post.content}</p>
        </div>
      )}

      {/* FOOTER: Interação Social */}
      <div style={styles.footer}>
        <div style={styles.actions}>
          <motion.span whileTap={{ scale: 1.2 }} style={{cursor: 'pointer'}}>❤️ {post.likes || 0}</motion.span>
          <span style={styles.threadLink}>ENTRAR NA THREAD 💬</span>
        </div>
        <div style={{ opacity: 0.2 }}>🔗</div>
      </div>
    </motion.div>
  );
};

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      // Puxamos 'content', 'image_url' e 'video_url' conforme as tuas tabelas
      const { data, error } = await supabase
        .from("posts")
        .select(`*, profiles:user_id (username, avatar_url)`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar feed:", error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };
    fetchFeed();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.ambientGlow} />

      <AnimatePresence>
        {loading ? (
          <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.status}>
            SINTONIZANDO VIBES...
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div key="e" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.status}>
            O SILÊNCIO É PROFUNDO POR AQUI.<br/>
            <span style={{fontSize: "10px", color: "#444", marginTop: "10px", display: "block"}}>SEJA O PRIMEIRO A QUEBRÁ-LO.</span>
          </motion.div>
        ) : (
          <div style={styles.list}>
            {posts.map((post, index) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", background: "#000", minHeight: "100vh", position: "relative" as "relative" },
  ambientGlow: { position: "absolute" as "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: "120%", height: "500px", background: "radial-gradient(circle, rgba(0,242,254,0.06) 0%, transparent 70%)", pointerEvents: "none" as "none" },
  list: { display: "flex", flexDirection: "column" as "column", gap: "24px", position: "relative" as "relative", zIndex: 1, maxWidth: "500px", margin: "0 auto" },
  card: { background: "linear-gradient(145deg, #0d0d0d 0%, #050505 100%)", borderRadius: "32px", padding: "20px", border: "1px solid #161616", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" },
  cardHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" },
  avatar: { width: "40px", height: "40px", borderRadius: "12px", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #222" },
  img: { width: "100%", height: "100%", objectFit: "cover" as "cover" },
  userInfo: { display: "flex", flexDirection: "column" as "column" },
  username: { color: "#fff", fontWeight: "bold", fontSize: "14px" },
  time: { color: "#555", fontSize: "10px" },
  mediaArea: { width: "100%", aspectRatio: "1/1", background: "#000", borderRadius: "20px", overflow: "hidden", border: "1px solid #1a1a1a" },
  mediaContent: { width: "100%", height: "100%", objectFit: "cover" as "cover" },
  noMedia: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "10px", fontWeight: "bold" },
  textContent: { marginTop: "16px", padding: "0 4px" },
  captionText: { color: "#ccc", fontSize: "14px", lineHeight: "1.5", fontWeight: "400" },
  footer: { display: "flex", justifyContent: "space-between", marginTop: "18px", alignItems: "center" },
  actions: { display: "flex", gap: "20px", fontSize: "13px", color: "#666", alignItems: "center" },
  threadLink: { color: "#00f2fe", fontWeight: "900", fontSize: "10px", letterSpacing: "1px" },
  status: { color: "#00f2fe", textAlign: "center" as "center", marginTop: "180px", letterSpacing: "4px", fontWeight: "900", fontSize: "12px" }
};
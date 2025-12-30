/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\page.tsx
 * Autor: Felipe Makarios
 * Versão: 4.0 (Blindagem de Refresh + Recuperação de Posts Antigos)
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

const PostCard = ({ post, currentUserId }: { post: any, currentUserId: string | null }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [shares, setShares] = useState(post.shares || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isVideo = !!post.video_url;
  const mediaUrl = post.video_url || post.image_url;
  
  // Fallback de perfil para posts órfãos
  const profile = post.profiles || { username: "pioneiro_ouvi", avatar_url: null };

  const handleDeletePost = async () => {
    if (!confirm("Deseja apagar sua voz permanentemente?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (!error) {
       // O Realtime cuidará do refresh para os outros, mas forçamos localmente se necessário
    } else {
      alert("Erro ao apagar: " + error.message);
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    const newLikes = likes + 1;
    setLikes(newLikes);
    
    // Atualiza o banco silenciosamente (sem disparar refresh global no Realtime ajustado)
    await supabase.from("posts").update({ likes: newLikes }).eq("id", post.id);
  };

  const handleShare = async () => {
    if (!hasShared) {
      const newShares = shares + 1;
      setShares(newShares);
      setHasShared(true);
      await supabase.from("posts").update({ shares: newShares }).eq("id", post.id);
    }
    if (navigator.share) {
      navigator.share({ title: 'OUVI', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado!");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={styles.card}
    >
      <div style={styles.userRow}>
        <div style={{
          ...styles.avatar, 
          backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {!profile.avatar_url && "👤"}
        </div>
        <div style={styles.userInfo}>
          <span style={styles.username}>@{profile.username}</span>
          <span style={styles.time}>transmitindo agora</span>
        </div>

        {currentUserId === post.user_id && post.user_id !== null && (
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={styles.moreBtn}>•••</button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div style={styles.overlay} onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={styles.dropdown}
                  >
                    <div onClick={handleDeletePost} style={styles.deleteOption}>Apagar Post</div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {(post.content || post.caption) && (
        <div style={{ padding: "0 20px 16px 20px" }}>
          <p style={{ color: "#efefef", fontSize: "15px", lineHeight: "1.5", fontWeight: "300" }}>
            {post.content || post.caption}
          </p>
        </div>
      )}

      <div style={styles.mediaContainer}>
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} style={styles.media} autoPlay muted loop playsInline />
          ) : (
            <img src={mediaUrl} style={styles.media} alt="Conteúdo" />
          )
        ) : (
          <div style={styles.audioOnly}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={styles.pulseIcon}>
              VIVE O SOM
            </motion.div>
          </div>
        )}
      </div>

      <motion.div 
        onClick={() => window.location.href = `/dashboard/post/${post.id}`}
        whileTap={{ scale: 0.98 }}
        style={styles.previewContainer}
      >
        <div style={styles.previewHeader}>
          <div style={styles.liveIndicator} />
          <span style={styles.previewTitle}>PRÉVIA DA CONVERSA</span>
        </div>
        <div style={styles.previewText}>
          Toque para ouvir o que estão falando sobre isso...
        </div>
      </motion.div>

      <div style={styles.interactionArea}>
        <div style={styles.reactionGroup}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike} style={styles.iconBtn}>
            <span style={{ color: hasLiked ? "#00FFFF" : "#fff", fontSize: "18px" }}>
              {hasLiked ? "❤️" : "🤍"}
            </span>
            <span style={{...styles.counter, color: hasLiked ? "#00FFFF" : "rgba(255,255,255,0.5)"}}>
              {likes}
            </span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.8 }} style={styles.iconBtn} onClick={() => window.location.href = `/dashboard/post/${post.id}`}>
            <span style={{fontSize: "18px"}}>💬</span>
            <span style={styles.counter}>{post.comment_count || 0}</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} style={styles.micBtn} onClick={() => window.location.href = `/dashboard/post/${post.id}`}>
            <span style={{fontSize: "22px"}}>🎙️</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.8 }} onClick={handleShare} style={styles.iconBtn}>
            <span style={{ fontSize: "18px", color: hasShared ? "#00FFFF" : "#fff" }}>⚡</span>
            <span style={{...styles.counter, color: hasShared ? "#00FFFF" : "rgba(255,255,255,0.5)"}}>
              {shares}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchFeed = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // !left garante que posts sem dono (user_id NULL) apareçam no feed
      const { data, error } = await supabase
        .from("posts")
        .select(`*, profiles!left (username, avatar_url)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Erro no Feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchFeed(); 

    // REALTIME OTIMIZADO: Só recarrega em posts novos ou deletados.
    // Ignora 'UPDATE' para evitar refresh ao curtir.
    const channel = supabase.channel('feed-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchFeed(false))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => fetchFeed(false))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.ambientGlow} />
      <AnimatePresence>
        {loading ? (
          <motion.div key="l" style={styles.status}>SINTONIZANDO VIBES...</motion.div>
        ) : (
          <div style={styles.list}>
            {posts.map((post) => <PostCard key={post.id} post={post} currentUserId={userId} />)}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", background: "#000", minHeight: "100vh", position: "relative" as "relative" },
  ambientGlow: { position: "absolute" as "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: "100%", height: "400px", background: "radial-gradient(circle, rgba(0,242,254,0.05) 0%, transparent 70%)", pointerEvents: "none" as "none" },
  list: { display: "flex", flexDirection: "column" as "column", gap: "24px", maxWidth: "480px", margin: "0 auto", position: "relative" as "relative", zIndex: 1 },
  card: { background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(25px)", borderRadius: "32px", border: "1px solid rgba(255, 255, 255, 0.05)", overflow: "hidden", boxShadow: "0 15px 35px rgba(0, 0, 0, 0.6)", marginBottom: "10px" },
  userRow: { padding: "18px", display: "flex", alignItems: "center", gap: "14px" },
  avatar: { width: "44px", height: "44px", borderRadius: "50%", backgroundSize: "cover", backgroundPosition: "center", border: "1.5px solid #00FFFF", boxShadow: "0 0 12px rgba(0, 255, 255, 0.4)", background: "#111" },
  userInfo: { display: "flex", flexDirection: "column" as "column" },
  username: { color: "#fff", fontSize: "14px", fontWeight: "800" },
  time: { color: "rgba(255,255,255,0.25)", fontSize: "10px" },
  moreBtn: { background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "18px" },
  overlay: { position: "fixed" as "fixed", inset: 0, zIndex: 90 },
  dropdown: { position: "absolute" as "absolute", top: "30px", right: "0", width: "140px", background: "rgba(20, 20, 20, 0.95)", backdropFilter: "blur(10px)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)", zIndex: 100, overflow: "hidden" },
  deleteOption: { padding: "15px", color: "#ff4444", fontSize: "12px", fontWeight: "800" as "bold", cursor: "pointer" },
  mediaContainer: { width: "100%", background: "rgba(0,0,0,0.6)", minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" },
  media: { width: "100%", height: "auto", display: "block" },
  audioOnly: { height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#00FFFF", fontWeight: "900", letterSpacing: "6px" },
  pulseIcon: { fontSize: "11px", border: "1px solid #00FFFF", padding: "8px 18px", borderRadius: "200px" },
  previewContainer: { margin: "10px 20px", padding: "15px", background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(10px)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)", cursor: "pointer" },
  previewHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" },
  liveIndicator: { width: "6px", height: "6px", borderRadius: "50%", background: "#00f2fe", boxShadow: "0 0 8px #00f2fe" },
  previewTitle: { fontSize: "9px", fontWeight: "900", color: "rgba(0, 242, 254, 0.5)", letterSpacing: "1px" },
  previewText: { fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic" },
  interactionArea: { padding: "16px 20px", display: "flex", justifyContent: "center", background: "rgba(255, 255, 255, 0.02)" },
  reactionGroup: { display: "flex", gap: "30px", alignItems: "center" },
  iconBtn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  micBtn: { background: "rgba(0, 255, 255, 0.15)", border: "1px solid #00FFFF", borderRadius: "50%", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center" },
  counter: { color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "600" },
  status: { color: "#00f2fe", textAlign: "center" as "center", marginTop: "150px", letterSpacing: "2px", fontWeight: "bold", fontSize: "12px" }
};
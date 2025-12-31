/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\page.tsx
 * Versão: 5.1 (Ajuste de Visual Elite + Core de Voz)
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import AudioRecorder from "@/components/Audio/AudioRecorder"; 

const PostCard = ({ post, currentUserId, onRefresh }: { post: any, currentUserId: string | null, onRefresh: () => void }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [shares, setShares] = useState(post.shares || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const mediaUrl = post.media_url || post.video_url || post.image_url;
  const isVideo = post.type === 'video' || !!post.video_url;
  const profile = post.profiles || { username: "membro_ouvi", avatar_url: null };

  const handleDeletePost = async () => {
    if (!confirm("Deseja apagar sua voz permanentemente?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (!error) onRefresh();
  };

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes(prev => prev + 1);
    await supabase.from("posts").update({ likes: likes + 1 }).eq("id", post.id);
  };

  const handleShare = async () => {
    if (!hasShared) {
      setShares(prev => prev + 1);
      setHasShared(true);
      await supabase.from("posts").update({ shares: shares + 1 }).eq("id", post.id);
    }
    if (navigator.share) {
      navigator.share({ title: 'OUVI', url: `${window.location.origin}/dashboard/post/${post.id}` });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/post/${post.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={styles.card}
    >
      {/* Header do Post */}
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

        {currentUserId === post.user_id && (
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

      {/* Conteúdo de Texto */}
      {(post.content || post.caption) && (
        <div style={{ padding: "0 20px 16px 20px" }}>
          <p style={{ color: "#efefef", fontSize: "15px", lineHeight: "1.5", fontWeight: "300" }}>
            {post.content || post.caption}
          </p>
        </div>
      )}

      {/* Mídia Principal */}
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

      {/* Prévia da Conversa (Thread) */}
      <motion.div 
        onClick={() => window.location.href = `/dashboard/post/${post.id}`}
        whileTap={{ scale: 0.98 }}
        style={styles.previewContainer}
      >
        <div style={styles.previewHeader}>
          <div style={styles.liveIndicator} />
          <span style={styles.previewTitle}>PRÉVIA DA CONVERSA</span>
        </div>
        <div style={styles.previewText}>Toque para ouvir as vozes sobre isso...</div>
      </motion.div>

      {/* Barra de Interação com Microfone Core */}
      <div style={styles.interactionArea}>
        <div style={styles.reactionGroup}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike} style={styles.iconBtn}>
            <span style={{ color: hasLiked ? "#00FFFF" : "#fff", fontSize: "18px" }}>{hasLiked ? "❤️" : "🤍"}</span>
            <span style={{...styles.counter, color: hasLiked ? "#00FFFF" : "rgba(255,255,255,0.5)"}}>{likes}</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.8 }} style={styles.iconBtn} onClick={() => window.location.href = `/dashboard/post/${post.id}`}>
            <span style={{fontSize: "18px"}}>💬</span>
            <span style={styles.counter}>{post.comment_count || 0}</span>
          </motion.button>

          <div style={styles.micWrapper}>
             <AudioRecorder postId={post.id} onUploadComplete={onRefresh} />
          </div>

          <motion.button whileTap={{ scale: 0.8 }} onClick={handleShare} style={styles.iconBtn}>
            <span style={{ fontSize: "18px", color: hasShared ? "#00FFFF" : "#fff" }}>⚡</span>
            <span style={{...styles.counter, color: hasShared ? "#00FFFF" : "rgba(255,255,255,0.5)"}}>{shares}</span>
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

      const { data, error } = await supabase
        .from("posts")
        .select(`*, profiles!left (username, avatar_url)`)
        .order("created_at", { ascending: false });

      if (!error) setPosts(data || []);
    } catch (err) {
      console.error("Erro no Feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchFeed(); 
    const channel = supabase.channel('feed-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchFeed(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.ambientGlow} />
      <AnimatePresence>
        {loading ? (
          <motion.div key="l" style={styles.status}>SINTONIZANDO...</motion.div>
        ) : (
          <div style={styles.list}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={userId} onRefresh={() => fetchFeed(false)} />
            ))}
            {/* Espaçador final para a TabBar não cobrir o último post */}
            <div style={{ height: "120px" }} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", background: "#000", minHeight: "100vh", position: "relative" as const, overflowX: "hidden" as const },
  ambientGlow: { position: "absolute" as const, top: "-10%", left: "50%", transform: "translateX(-50%)", width: "100%", height: "400px", background: "radial-gradient(circle, rgba(0,242,254,0.05) 0%, transparent 70%)", pointerEvents: "none" as const },
  list: { display: "flex", flexDirection: "column" as const, gap: "24px", maxWidth: "480px", margin: "0 auto", position: "relative" as const, zIndex: 1 },
  card: { background: "rgba(12, 12, 12, 0.8)", backdropFilter: "blur(20px)", borderRadius: "32px", border: "1px solid rgba(255, 255, 255, 0.06)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)" },
  userRow: { padding: "18px", display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "42px", height: "42px", borderRadius: "50%", backgroundSize: "cover", backgroundPosition: "center", border: "1.5px solid #00FFFF" },
  userInfo: { display: "flex", flexDirection: "column" as const },
  username: { color: "#fff", fontSize: "13px", fontWeight: "900", letterSpacing: "0.5px" },
  time: { color: "#00FFFF", fontSize: "8px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase" as const },
  moreBtn: { background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "16px" },
  overlay: { position: "fixed" as const, inset: 0, zIndex: 90 },
  dropdown: { position: "absolute" as const, top: "30px", right: "0", width: "140px", background: "#111", borderRadius: "12px", border: "1px solid #222", zIndex: 100 },
  deleteOption: { padding: "12px", color: "#ff4444", fontSize: "11px", fontWeight: "bold" as const, cursor: "pointer", textAlign: "center" as const },
  mediaContainer: { width: "100%", background: "#050505", minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" },
  media: { width: "100%", height: "100%", objectFit: "cover" as const },
  audioOnly: { height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#00FFFF" },
  pulseIcon: { fontSize: "10px", border: "1px solid #00FFFF", padding: "6px 15px", borderRadius: "100px", fontWeight: "900" as const, letterSpacing: "2px" },
  previewContainer: { margin: "15px 20px", padding: "12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "18px", border: "1px solid rgba(255, 255, 255, 0.05)" },
  previewHeader: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" },
  liveIndicator: { width: "5px", height: "5px", borderRadius: "50%", background: "#00f2fe", boxShadow: "0 0 8px #00f2fe" },
  previewTitle: { fontSize: "8px", fontWeight: "900", color: "rgba(0, 242, 254, 0.7)", letterSpacing: "1px" },
  previewText: { fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", fontStyle: "italic" },
  interactionArea: { padding: "15px 20px", display: "flex", justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.03)" },
  reactionGroup: { display: "flex", gap: "35px", alignItems: "center" },
  iconBtn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
  micWrapper: { transform: "scale(1.1)" },
  counter: { color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: "700" },
  status: { color: "#00f2fe", textAlign: "center" as const, marginTop: "150px", letterSpacing: "4px", fontWeight: "900", fontSize: "10px" }
};
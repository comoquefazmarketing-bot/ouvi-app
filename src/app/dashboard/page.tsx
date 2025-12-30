/**
 * PROJETO OUVI — Feed Premium (Elite Interaction + Realtime)
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\page.tsx
 * Versão: 4.5 (Restauração de Layout Premium + Busca Total)
 * Autor: Felipe Makarios
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import ThreadDrawer from "@/components/dashboard/Threads/ThreadDrawer";

// Funções de Utilidade
const getRelativeTime = (date: string) => {
  if (!date) return "AGORA";
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  if (diffInMins < 1) return "AGORA";
  if (diffInMins < 60) return `${diffInMins}M`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}H`;
  return past.toLocaleDateString('pt-BR');
};

const PostCard = ({ post, currentUserId }: { post: any, currentUserId: string | null }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Fallback para posts sem perfil (Garante que a foto apareça)
  const profile = post.profiles || { username: "pioneiro_ouvi", avatar_url: null };

  const fetchStats = async () => {
    const { count } = await supabase
      .from("audio_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);
    if (count !== null) setCommentCount(count);
  };

  useEffect(() => { 
    fetchStats(); 
  }, [post.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;
    setHasLiked(true);
    setLikes((prev: number) => prev + 1);
    await supabase.from("posts").update({ likes: (post.likes || 0) + 1 }).eq("id", post.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja apagar sua voz permanentemente?")) {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) alert("Erro ao apagar: " + error.message);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        viewport={{ once: true }}
        style={styles.card}
      >
        <div style={styles.glassOverlay} />

        {/* Header do Card */}
        <div style={styles.userRow}>
          <div style={{...styles.avatar, backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : 'none'}}>
            {!profile.avatar_url && "👤"}
          </div>
          <div style={styles.userInfo}>
            <span style={styles.username}>@{profile.username}</span>
            <div style={styles.liveIndicator}>
              <span style={styles.liveDot} />
              <span style={styles.time}>{getRelativeTime(post.created_at)}</span>
            </div>
          </div>

          {currentUserId === post.user_id && post.user_id !== null && (
            <div style={{ marginLeft: "auto", position: "relative" }}>
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} style={styles.moreBtn}> ••• </button>
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div style={styles.overlay} onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.dropdown}>
                      <div onClick={handleDelete} style={styles.deleteOption}>Apagar Post</div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Texto do Post */}
        {(post.content || post.caption) && (
          <div style={styles.textContent}>
            <p style={styles.postText}>{post.content || post.caption}</p>
          </div>
        )}

        {/* Mídia Premium */}
        <div style={styles.mediaFrame}>
          {post.video_url ? (
            <video src={post.video_url} style={styles.media} autoPlay muted loop playsInline />
          ) : post.image_url ? (
            <img src={post.image_url} style={styles.media} alt="Conteúdo" />
          ) : (
            <div style={styles.audioPlaceholder}>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 4, repeat: Infinity }} style={styles.sonar} />
              <span style={styles.audioLabel}>VIVE O SOM</span>
            </div>
          )}
        </div>

        {/* Barra de Interação Elite */}
        <div style={styles.interactionBar}>
          <div style={styles.statsGroup}>
            <motion.button onClick={handleLike} whileTap={{ scale: 0.7 }} style={styles.statBtn}>
              <span style={{ fontSize: "18px", opacity: (hasLiked || isHovered) ? 1 : 0.3 }}>{hasLiked ? "❤️" : "🤍"}</span>
              <motion.span animate={{ opacity: (hasLiked || isHovered) ? 1 : 0 }} style={styles.statNum}>{likes}</motion.span>
            </motion.button>
            <motion.button onClick={() => setIsThreadOpen(true)} whileTap={{ scale: 0.7 }} style={styles.statBtn}>
              <span style={{ fontSize: "18px", opacity: isHovered ? 1 : 0.3 }}>💬</span>
              <motion.span animate={{ opacity: isHovered ? 1 : 0 }} style={styles.statNum}>{commentCount}</motion.span>
            </motion.button>
          </div>

          <motion.button 
            onClick={() => setIsThreadOpen(true)}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.98 }}
            style={styles.talkBtn}
          >
            O QUE ESTÃO FALANDO...
          </motion.button>
        </div>
      </motion.div>

      {isThreadOpen && <ThreadDrawer post={post} onClose={() => setIsThreadOpen(false)} />}
    </>
  );
};

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchFeed = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // BUSCA TOTAL: Profiles!left garante que posts órfãos apareçam
      const { data, error } = await supabase
        .from("posts")
        .select(`*, profiles!left (username, avatar_url)`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Erro ao sintonizar feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    // REALTIME: Apenas para novos posts ou deleções (Evita refresh no like)
    const channel = supabase.channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchFeed(true))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => fetchFeed(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={styles.container}>
      {loading ? (
        <div style={styles.loader}>SINTONIZANDO...</div>
      ) : posts.length > 0 ? (
        <div style={styles.list}>
          {posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <span style={{fontSize: '40px'}}>🤫</span>
          <h2 style={styles.emptyTitle}>O SILÊNCIO REINA</h2>
          <button onClick={() => window.location.reload()} style={styles.emptyBtn}>RECARREGAR</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#000", minHeight: "100vh", padding: "20px 16px" },
  list: { display: "flex", flexDirection: "column" as const, gap: "35px", maxWidth: "460px", margin: "0 auto" },
  card: { background: "#080808", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", position: "relative" as const, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" },
  glassOverlay: { position: "absolute" as const, inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)", pointerEvents: "none" as const },
  userRow: { padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px", zIndex: 10, position: "relative" as const },
  avatar: { width: "38px", height: "38px", borderRadius: "50%", backgroundSize: "cover", border: "1.5px solid #00FFFF", backgroundPosition: "center" },
  userInfo: { display: "flex", flexDirection: "column" as const },
  username: { color: "#FFF", fontSize: "14px", fontWeight: "900" },
  liveIndicator: { display: "flex", alignItems: "center", gap: "6px" },
  liveDot: { width: "4px", height: "4px", borderRadius: "50%", background: "#00FFFF", boxShadow: "0 0 8px #00FFFF" },
  time: { color: "#00FFFF", fontSize: "9px", fontWeight: "900", letterSpacing: "0.5px" },
  moreBtn: { background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "18px" },
  overlay: { position: "fixed" as const, inset: 0, zIndex: 90 },
  dropdown: { position: "absolute" as const, top: "30px", right: "0", width: "130px", background: "rgba(10, 10, 10, 0.95)", backdropFilter: "blur(20px)", borderRadius: "15px", border: "1px solid rgba(255, 255, 255, 0.1)", zIndex: 100 },
  deleteOption: { padding: "15px", color: "#ff4444", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer", textAlign: "center" as const },
  textContent: { padding: "0 20px 15px 20px" },
  postText: { color: "#efefef", fontSize: "15px", fontWeight: "300", lineHeight: "1.6" },
  mediaFrame: { width: "100%", background: "#000", minHeight: "280px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  media: { width: "100%", height: "auto", display: "block" },
  interactionBar: { padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  statsGroup: { display: "flex", gap: "20px", alignItems: "center" },
  statBtn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  statNum: { fontSize: "12px", fontWeight: "800", color: "#00FFFF" },
  talkBtn: { background: "rgba(0, 255, 255, 0.05)", border: "1px solid rgba(0, 255, 255, 0.2)", borderRadius: "100px", padding: "10px 20px", color: "#00FFFF", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", cursor: "pointer" },
  audioPlaceholder: { display: "flex", flexDirection: "column" as const, alignItems: "center" },
  sonar: { width: "50px", height: "50px", borderRadius: "50%", border: "1.5px solid #00FFFF" },
  audioLabel: { color: "#00FFFF", fontSize: "9px", marginTop: "15px", fontWeight: "900", opacity: 0.5, letterSpacing: "2px" },
  loader: { color: "#00FFFF", textAlign: "center" as const, marginTop: "200px", fontWeight: "900", letterSpacing: "4px", fontSize: "12px" },
  emptyState: { textAlign: 'center' as const, marginTop: '150px' },
  emptyTitle: { color: '#fff', fontSize: '14px', fontWeight: '900', marginTop: '20px' },
  emptyBtn: { background: '#00FFFF', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: '900', marginTop: '20px', cursor: 'pointer' }
};
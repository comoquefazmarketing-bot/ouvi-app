/**
 * PROJETO OUVI — Feed Premium (Elite Interaction + Realtime)
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\page.tsx
 * Versão: 3.5 (Realtime + Silêncio + Delete + Threads)
 * Autor: Felipe Makarios
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import ThreadDrawer from "@/components/dashboard/Threads/ThreadDrawer";

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
  const [shares, setShares] = useState(post.shares || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [audioCount, setAudioCount] = useState(0);
  const [previews, setPreviews] = useState<any[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const fetchThreadData = async () => {
    const { data, count } = await supabase
      .from("audio_comments")
      .select("content, username, audio_url", { count: "exact" })
      .eq("post_id", post.id)
      .order("created_at", { ascending: false });

    if (count !== null) setCommentCount(count);
    if (data) {
      setPreviews(data.slice(0, 2));
      const audios = data.filter(t => !!t.audio_url).length;
      setAudioCount(audios);
    }
  };

  useEffect(() => {
    fetchThreadData();
    const channel = supabase.channel(`stats-${post.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audio_comments', filter: `post_id=eq.${post.id}` }, 
      () => fetchThreadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [post.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;
    setLikes(prev => prev + 1);
    setHasLiked(true);
    await supabase.from("posts").update({ likes: likes + 1 }).eq("id", post.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja apagar sua voz permanentemente?")) {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (!error) {
        // O Realtime cuidará de remover do feed, mas forçamos localmente para agilizar
        window.location.reload();
      } else {
        alert("Erro ao apagar: " + error.message);
      }
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

        <div style={styles.userRow}>
          <div style={{...styles.avatar, backgroundImage: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url})` : 'none'}}>
            {!post.profiles?.avatar_url && "👤"}
          </div>
          <div style={styles.userInfo}>
            <span style={styles.username}>@{post.profiles?.username || "membro_ouvi"}</span>
            <div style={styles.liveIndicator}>
              <span style={styles.liveDot} />
              <span style={styles.time}>{getRelativeTime(post.created_at)}</span>
            </div>
          </div>

          {currentUserId === post.user_id && (
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

        {(post.content || post.caption) && (
          <div style={styles.textContent}>
            <p style={styles.postText}>{post.content || post.caption}</p>
          </div>
        )}

        <div style={styles.mediaFrame}>
          {post.video_url ? (
            <video src={post.video_url} style={styles.media} autoPlay muted loop playsInline />
          ) : post.image_url ? (
            <img src={post.image_url} style={styles.media} alt="Live" />
          ) : (
            <div style={styles.audioPlaceholder}>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 4, repeat: Infinity }} style={styles.sonar} />
              <span style={styles.audioLabel}>VIVE O SOM</span>
            </div>
          )}
        </div>

        {previews.length > 0 && (
          <div style={styles.previewSection} onClick={() => setIsThreadOpen(true)}>
            {previews.map((msg, i) => (
              <div key={i} style={styles.previewLine}>
                <span style={styles.previewUser}>@{msg.username}:</span>
                <span style={styles.previewText}>{msg.audio_url ? "🎙️ Áudio" : msg.content}</span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.interactionBar}>
          <div style={styles.statsGroup}>
            <motion.button onClick={handleLike} whileTap={{ scale: 0.7 }} style={styles.statBtn}>
              <span style={{ fontSize: "18px", opacity: (hasLiked || isHovered) ? 1 : 0.3 }}>{hasLiked ? "❤️" : "🤍"}</span>
              <motion.span animate={{ opacity: (hasLiked || isHovered) ? 1 : 0 }} style={styles.statNum}>{likes}</motion.span>
            </motion.button>
            <motion.button onClick={() => setIsThreadOpen(true)} whileTap={{ scale: 0.7 }} style={styles.statBtn}>
              <span style={{ fontSize: "18px", opacity: isHovered ? 1 : 0.3 }}>⌨️</span>
              <motion.span animate={{ opacity: isHovered ? 1 : 0 }} style={styles.statNum}>{commentCount}</motion.span>
            </motion.button>
            <motion.button onClick={() => setIsThreadOpen(true)} whileTap={{ scale: 0.7 }} style={styles.statBtn}>
              <span style={{ fontSize: "18px", opacity: isHovered ? 1 : 0.3 }}>🎙️</span>
              <motion.span animate={{ opacity: isHovered ? 1 : 0 }} style={styles.statNum}>{audioCount}</motion.span>
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

  const fetchFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    const { data } = await supabase.from("posts").select(`*, profiles:user_id (username, avatar_url)`).order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();

    // MOTOR REALTIME: Atualiza feed automaticamente em INSERT ou DELETE
    const channel = supabase.channel('feed-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchFeed();
      })
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
        /* ESTADO DE SILÊNCIO */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.emptyState}>
          <div style={styles.emptyIcon}>🤫</div>
          <h2 style={styles.emptyTitle}>O SILÊNCIO REINA POR AQUI</h2>
          <p style={styles.emptyText}>Seja a primeira voz a quebrar esse vácuo.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={styles.emptyBtn}
          >
            SOLTAR A VOZ AGORA
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#000", minHeight: "100vh", padding: "20px 16px" },
  list: { display: "flex", flexDirection: "column" as const, gap: "35px", maxWidth: "460px", margin: "0 auto" },
  card: { background: "#080808", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", position: "relative" as const, overflow: "hidden" },
  glassOverlay: { position: "absolute" as const, inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)", pointerEvents: "none" as const },
  userRow: { padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" as const, zIndex: 10 },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", backgroundSize: "cover", border: "1px solid #00FFFF" },
  userInfo: { display: "flex", flexDirection: "column" as const },
  username: { color: "#FFF", fontSize: "13px", fontWeight: "900" },
  liveIndicator: { display: "flex", alignItems: "center", gap: "6px" },
  liveDot: { width: "4px", height: "4px", borderRadius: "50%", background: "#00FFFF", boxShadow: "0 0 8px #00FFFF" },
  time: { color: "#00FFFF", fontSize: "8px", fontWeight: "900" },
  moreBtn: { background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "18px", padding: "5px" },
  overlay: { position: "fixed" as const, inset: 0, zIndex: 90 },
  dropdown: { position: "absolute" as const, top: "30px", right: "0", width: "130px", background: "rgba(10, 10, 10, 0.95)", backdropFilter: "blur(20px)", borderRadius: "15px", border: "1px solid rgba(255, 255, 255, 0.1)", zIndex: 100 },
  deleteOption: { padding: "15px", color: "#ff4444", fontSize: "10px", fontWeight: "900" as const, cursor: "pointer", textAlign: "center" as const },
  textContent: { padding: "0 20px 15px 20px" },
  postText: { color: "#efefef", fontSize: "14px", fontWeight: "300", lineHeight: "1.5" },
  mediaFrame: { width: "100%", background: "#000", minHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center" },
  media: { width: "100%", height: "auto" },
  previewSection: { padding: "12px 20px", background: "rgba(0, 255, 255, 0.01)", borderTop: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" },
  previewLine: { fontSize: "11px", marginBottom: "4px", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", color: "rgba(255,255,255,0.5)" },
  previewUser: { color: "#00FFFF", fontWeight: "800", marginRight: "6px" },
  previewText: { fontWeight: "300" },
  interactionBar: { padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  statsGroup: { display: "flex", gap: "18px", alignItems: "center" },
  statBtn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: 0 },
  statNum: { fontSize: "12px", fontWeight: "800", color: "#00FFFF" },
  talkBtn: { background: "rgba(0, 255, 255, 0.05)", border: "1px solid rgba(0, 255, 255, 0.2)", borderRadius: "100px", padding: "8px 16px", color: "#00FFFF", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", cursor: "pointer" },
  audioPlaceholder: { display: "flex", flexDirection: "column" as const, alignItems: "center" },
  sonar: { width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #00FFFF" },
  audioLabel: { color: "#00FFFF", fontSize: "8px", marginTop: "12px", fontWeight: "900", opacity: 0.4 },
  loader: { color: "#00FFFF", textAlign: "center" as const, marginTop: "200px", fontWeight: "900", letterSpacing: "4px" },
  emptyState: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", marginTop: "150px", textAlign: "center" as const },
  emptyIcon: { fontSize: "40px", marginBottom: "15px" },
  emptyTitle: { color: "#fff", fontSize: "14px", fontWeight: "900", letterSpacing: "2px", marginBottom: "8px" },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: "11px", marginBottom: "25px" },
  emptyBtn: { background: "#00FFFF", border: "none", borderRadius: "100px", padding: "12px 24px", color: "#000", fontSize: "10px", fontWeight: "900", cursor: "pointer" }
};
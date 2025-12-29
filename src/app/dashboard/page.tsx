"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

/**
 * -----------------------------------------------------------------------
 * ARQUITETURA DE SISTEMA - PROJETO OUVI
 * -----------------------------------------------------------------------
 * Desenvolvido por: Felipe Makarios
 * Blindagem de Autoria e Integridade - 2025-12-29
 * -----------------------------------------------------------------------
 */

// --- PAINEL DE INTERAÇÃO (COMENTÁRIOS E ÁUDIOS) ---
function PainelAcoes({ postId, open, onClose }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [textComment, setTextComment] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: string, name: string } | null>(null);
  const [user, setUser] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_TIME = 30;

  useEffect(() => {
    if (open && postId) {
      const getInitialData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        fetchComments();
      };
      getInitialData();

      const channel = supabase.channel(`room_${postId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_comments', filter: `post_id=eq.${postId}` }, () => {
          fetchComments();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [open, postId]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_TIME) { stopRecording(); return MAX_TIME; }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  async function fetchComments() {
    const { data, error } = await supabase.from("audio_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (!error) setComments(data || []);
  }

  async function handleReact(commentId: string, emoji: string) {
    if (!user) return alert("Faça login para interagir!");
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const currentReactions = comment.reactions || {};
    const userList = Array.isArray(currentReactions[emoji]) ? currentReactions[emoji] : [];
    let newUserList = userList.includes(user.id) ? userList.filter((id: string) => id !== user.id) : [...userList, user.id];
    const newReactions = { ...currentReactions, [emoji]: newUserList };

    setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: newReactions } : c));
    await supabase.from("audio_comments").update({ reactions: newReactions }).eq("id", commentId);
  }

  async function handleSend(audioUrl: string | null = null) {
    if (!textComment.trim() && !audioUrl) return;
    if (!user) return alert("Sessão expirada.");
    
    setIsSending(true);
    const myUsername = user.email?.split('@')[0] || 'membro_ouvi';

    const { error } = await supabase.from("audio_comments").insert([{
      post_id: postId,
      parent_id: replyTarget?.id || null, 
      content: textComment.trim() || null,
      audio_url: audioUrl,
      user_id: user.id,
      username: myUsername,
      reactions: {}
    }]);

    if (!error) { setTextComment(""); setReplyTarget(null); fetchComments(); }
    setIsSending(false);
  }

  async function startRecording(e: any) {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (ev) => { if (ev.data.size > 0) audioChunksRef.current.push(ev.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          const fileName = `audio_${Date.now()}.webm`;
          const { error } = await supabase.storage.from("post-images").upload(`audios/${fileName}`, audioBlob);
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(`audios/${fileName}`);
            await handleSend(publicUrl);
          }
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Microfone bloqueado."); }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  const renderComment = (c: any, isReply = false) => {
    const isPlaying = playingId === c.id;
    const replies = comments.filter(r => r.parent_id === c.id);
    const hasReacted = (emoji: string) => user && c.reactions?.[emoji]?.includes(user.id);

    return (
      <div key={c.id} style={{ marginBottom: "20px", marginLeft: isReply ? "30px" : "0", borderLeft: isReply ? "1px solid #222" : "none", paddingLeft: isReply ? "15px" : "0" }}>
        <motion.div animate={isPlaying ? { scale: 0.98 } : { scale: 1 }} style={{ background: isPlaying ? "rgba(0,242,254,0.1)" : "#111", padding: "12px", borderRadius: "15px", border: "1px solid #1a1a1a" }}>
          <div style={{ color: "#00f2fe", fontSize: "10px", fontWeight: "bold", marginBottom: "5px" }}>@{c.username || "MEMBRO"}</div>
          {c.content && <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>{c.content}</p>}
          {c.audio_url && <audio onPlay={() => setPlayingId(c.id)} onPause={() => setPlayingId(null)} controls src={c.audio_url} style={{ width: "100%", height: "30px" }} />}
        </motion.div>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px", alignItems: "center" }}>
          <button onClick={() => setShowEmojiPicker(showEmojiPicker === c.id ? null : c.id)} style={styles.miniBtn}>REAGIR</button>
          <button onClick={() => { setReplyTarget({id: c.id, name: c.username || "membro"}); inputRef.current?.focus(); }} style={styles.textBtn}>RESPONDER</button>
        </div>
        {showEmojiPicker === c.id && (
          <div style={{ display: 'flex', gap: '10px', background: '#111', padding: '8px', borderRadius: '10px', marginTop: '5px' }}>
            {['❤️', '🔥', '👏', '😂'].map(emoji => <span key={emoji} onClick={() => { handleReact(c.id, emoji); setShowEmojiPicker(null); }} style={{ cursor: 'pointer' }}>{emoji}</span>)}
          </div>
        )}
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={styles.overlay} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={styles.sheet}>
            <div style={styles.dragHandle} />
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>{comments.filter(c => !c.parent_id).map(c => renderComment(c))}</div>
            <div style={styles.inputArea}>
              {replyTarget && <div style={styles.replyLabel}>Respondendo @{replyTarget.name} <span onClick={() => setReplyTarget(null)}>✕</span></div>}
              <div style={styles.inputWrapper}>
                <input ref={inputRef} placeholder="Escreva aqui..." value={textComment} onChange={(e) => setTextComment(e.target.value)} style={styles.textInput} />
                <button onClick={() => handleSend()} disabled={isSending} style={styles.sendBtn}>ENVIAR</button>
              </div>
              <div style={styles.micContainer}>
                <motion.button onMouseDown={startRecording} onTouchStart={startRecording} onMouseUp={stopRecording} onTouchEnd={stopRecording} animate={isRecording ? { scale: 1.2, backgroundColor: "#ff3040" } : { scale: 1, backgroundColor: "#1a1a1a" }} style={styles.micBtn}>🎙️</motion.button>
                <div style={{fontSize: '9px', color: '#444', marginTop: '5px'}}>SEGURE PARA FALAR</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- DASHBOARDPAGE ---
export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data: postsData } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (postsData) {
      setPosts(postsData);
      const { data: comms } = await supabase.from("audio_comments").select("*");
      if (comms) {
        const grouped = comms.reduce((acc: any, curr: any) => {
          if (!acc[curr.post_id]) acc[curr.post_id] = [];
          acc[curr.post_id].push(curr);
          return acc;
        }, {});
        setCommentsByPost(grouped);
      }
    }
    setLoading(false);
  }

  async function handleCreatePost() {
    if (!newPost.trim() && !selectedMedia) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Logue para postar!");

    let imageUrl = null;
    let videoUrl = null;

    if (selectedMedia) {
      const isVideo = selectedMedia.type.startsWith('video/');
      const folder = isVideo ? 'post-videos' : 'post-photos';
      const fileName = `${Date.now()}`;
      const { error: upError } = await supabase.storage.from("post-images").upload(`${folder}/${fileName}`, selectedMedia);
      
      if (!upError) {
        const publicUrl = supabase.storage.from("post-images").getPublicUrl(`${folder}/${fileName}`).data.publicUrl;
        if (isVideo) videoUrl = publicUrl; else imageUrl = publicUrl;
      }
    }

    await supabase.from("posts").insert([{ 
      content: newPost, 
      image_url: imageUrl, 
      video_url: videoUrl,
      user_id: session.user.id, 
      user_email: session.user.email 
    }]);
    
    setNewPost(""); setSelectedMedia(null); fetchPosts();
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>OUVI</h1>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} style={styles.logoutBtn}>SAIR</button>
        </div>
      </header>

      <main style={styles.feed}>
        <div style={styles.createCard}>
          <textarea placeholder="O que você está ouvindo hoje?" value={newPost} onChange={(e) => setNewPost(e.target.value)} style={styles.createInput} />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Mídia</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => setSelectedMedia(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn}>Publicar</button>
          </div>
        </div>

        {posts.map((post) => {
          const postComments = commentsByPost[post.id] || [];
          return (
            <article key={post.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarWrapper}><div style={styles.avatarInner} /></div>
                <div style={styles.username}>@{post.user_email?.split('@')[0]}</div>
              </div>

              {post.video_url ? (
                <video src={post.video_url} controls style={styles.postMedia} />
              ) : post.image_url && (
                <img src={post.image_url} alt="" style={styles.postMedia} />
              )}

              <div style={styles.socialBar}>
                 <span onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>💬</span>
                 <span onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>🎙️</span>
              </div>

              <div style={styles.captionArea}>
                <p><strong>@{post.user_email?.split('@')[0]}</strong> {post.content}</p>
              </div>

              <div style={styles.actionPadding}>
                <button onClick={() => { setActivePostId(post.id); setOpenThread(true); }} style={styles.listenBtn}>OUVIR CONVERSA ({postComments.length})</button>
              </div>
            </article>
          );
        })}
      </main>

      <nav style={styles.bottomNav}><span>🏠</span><span>🔍</span><span style={styles.plusBtn}>+</span><span>🎬</span><span>👤</span></nav>
      <PainelAcoes postId={activePostId || ""} open={openThread} onClose={() => { setOpenThread(false); fetchPosts(); }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { position: "sticky", top: 0, zIndex: 100, background: "#000", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", padding: "15px 20px", alignItems: "center" },
  logo: { fontSize: '20px', fontWeight: '900', color: '#00f2fe' },
  logoutBtn: { background: "none", border: "none", color: "#444", fontWeight: "bold" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "100px" },
  createCard: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 15, border: "1px solid #151515", padding: 15, margin: "20px 0" },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", fontSize: 16, minHeight: 60 },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10 },
  mediaBtn: { background: "#111", border: "none", color: "#aaa", padding: "8px 15px", borderRadius: 10 },
  publishBtn: { background: "#00f2fe", border: "none", color: "#000", padding: "8px 20px", borderRadius: 20, fontWeight: "bold" },
  card: { width: "100%", maxWidth: 500, borderBottom: "1px solid #111", paddingBottom: 25 },
  cardHeader: { display: "flex", gap: 10, padding: "15px", alignItems: "center" },
  avatarWrapper: { width: 35, height: 35, borderRadius: "50%", background: "#00f2fe" },
  avatarInner: { width: "100%", height: "100%", borderRadius: "50%", background: "#222" },
  username: { fontWeight: "bold", fontSize: 14 },
  postMedia: { width: "100%", maxHeight: "500px", objectFit: "cover" },
  socialBar: { display: "flex", gap: 20, padding: "15px", fontSize: "24px" },
  captionArea: { padding: "0 15px 15px", fontSize: "14px" },
  actionPadding: { padding: "0 15px" },
  listenBtn: { width: "100%", background: "none", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 12, padding: "15px", fontWeight: "bold" },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#000", borderTop: "1px solid #111", display: "flex", justifyContent: "space-around", padding: "15px", fontSize: "22px" },
  plusBtn: { background: "#fff", color: "#000", padding: "0 8px", borderRadius: "8px", fontWeight: "bold" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000 },
  sheet: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", height: "80vh", width: "100%", maxWidth: "500px", backgroundColor: "#050505", borderRadius: "30px 30px 0 0", zIndex: 1001, display: "flex", flexDirection: "column", borderTop: "1px solid #333" },
  dragHandle: { width: 40, height: 5, background: "#333", borderRadius: 10, margin: "15px auto" },
  inputArea: { padding: "20px", borderTop: "1px solid #1a1a1a" },
  replyLabel: { fontSize: "11px", color: "#00f2fe", marginBottom: "5px" },
  inputWrapper: { display: "flex", gap: "10px", background: "#111", padding: "12px", borderRadius: "20px", marginBottom: "15px" },
  textInput: { flex: 1, background: "none", border: "none", color: "#fff", outline: "none" },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontWeight: "bold" },
  micContainer: { display: "flex", flexDirection: "column", alignItems: "center" },
  micBtn: { width: 60, height: 60, borderRadius: "50%", border: "none", fontSize: "25px", display: "flex", alignItems: "center", justifyContent: "center" },
  miniBtn: { background: "#00f2fe10", border: "none", color: "#00f2fe", borderRadius: "10px", padding: "3px 8px", fontSize: "10px" },
  textBtn: { background: "none", border: "none", color: "#555", fontSize: "10px", fontWeight: "bold" }
};
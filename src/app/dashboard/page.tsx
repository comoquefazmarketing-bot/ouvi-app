"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_comments' }, () => {
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
    const { data, error } = await supabase
      .from("audio_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    
    if (!error) setComments(data || []);
  }

  async function handleReact(commentId: string, emoji: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert("Faça login para interagir!");

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const currentReactions = comment.reactions || {};
    const userList = Array.isArray(currentReactions[emoji]) ? currentReactions[emoji] : [];

    let newUserList = userList.includes(session.user.id) 
      ? userList.filter((id: string) => id !== session.user.id) 
      : [...userList, session.user.id];

    const newReactions = { ...currentReactions, [emoji]: newUserList };

    setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: newReactions } : c));
    await supabase.from("audio_comments").update({ reactions: newReactions }).eq("id", commentId);
  }

  async function handleSend(audioUrl: string | null = null) {
    if (!textComment.trim() && !audioUrl) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert("Sessão expirada. Faça login novamente.");
    
    setIsSending(true);

    const { error } = await supabase.from("audio_comments").insert([{
      post_id: postId,
      parent_id: replyTarget?.id || null, 
      content: audioUrl ? null : textComment,
      audio_url: audioUrl,
      user_id: session.user.id,
      reactions: {}
    }]);

    if (!error) {
      setTextComment("");
      setReplyTarget(null);
      fetchComments();
    }
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
        if (audioBlob.size > 2000) await uploadAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);

      const stopHandler = () => { stopRecording(); window.removeEventListener("mouseup", stopHandler); window.removeEventListener("touchend", stopHandler); };
      window.addEventListener("mouseup", stopHandler);
      window.addEventListener("touchend", stopHandler);
    } catch (err) { alert("Microfone bloqueado."); }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  async function uploadAudio(blob: Blob) {
    const fileName = `audio_${Date.now()}.webm`;
    const { error } = await supabase.storage.from("audio-comments").upload(`audios/${fileName}`, blob);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("audio-comments").getPublicUrl(`audios/${fileName}`);
      await handleSend(publicUrl);
    }
  }

  const renderComment = (c: any, isReply = false) => {
    const isPlaying = playingId === c.id;
    const replies = comments.filter(r => r.parent_id === c.id);
    const hasReacted = (emoji: string) => user && c.reactions?.[emoji]?.includes(user.id);

    return (
      <div key={c.id} style={{ marginBottom: "20px", marginLeft: isReply ? "30px" : "0", borderLeft: isReply ? "1px solid #333" : "none", paddingLeft: isReply ? "15px" : "0" }}>
        <motion.div animate={isPlaying ? { scale: 0.98, borderColor: "#00f2fe" } : { scale: 1, borderColor: "#1a1a1a" }}
          style={{ background: isPlaying ? "rgba(0,242,254,0.1)" : "#111", padding: "12px", borderRadius: "20px", border: "1px solid", position: "relative" }}>
          <div style={{ color: "#00f2fe", fontSize: "9px", fontWeight: "bold", marginBottom: "4px" }}>@MEMBRO</div>
          {c.audio_url ? <audio onPlay={() => setPlayingId(c.id)} onPause={() => setPlayingId(null)} controls src={c.audio_url} style={{ width: "100%", height: "30px" }} /> 
                       : <p style={{ margin: 0, fontSize: "14px", color: "#ccc" }}>{c.content}</p>}
        </motion.div>
        
        <div style={{ display: "flex", gap: "10px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {c.reactions && Object.entries(c.reactions).map(([emoji, ids]: any) => (
            Array.isArray(ids) && ids.length > 0 && (
              <div key={emoji} onClick={() => handleReact(c.id, emoji)} style={{ background: hasReacted(emoji) ? "#00f2fe20" : "#1a1a1a", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", color: hasReacted(emoji) ? "#00f2fe" : "#555", border: "1px solid", borderColor: hasReacted(emoji) ? "#00f2fe" : "#333", cursor: "pointer" }}>
                {emoji} {ids.length}
              </div>
            )
          ))}
          <button onClick={() => setShowEmojiPicker(showEmojiPicker === c.id ? null : c.id)} style={styles.miniBtn}>INTERAGIR +</button>
          <button onClick={() => { setReplyTarget({id: c.id, name: "membro"}); inputRef.current?.focus(); }} style={styles.textBtn}>RESPONDER</button>
        </div>

        {showEmojiPicker === c.id && (
          <div style={{ display: 'flex', gap: '12px', background: '#111', padding: '10px', borderRadius: '15px', marginTop: '10px', border: '1px solid #333', width: 'fit-content', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            {['❤️', '🔥', '👏', '😂', '😮'].map(emoji => (
              <span key={emoji} onClick={() => { handleReact(c.id, emoji); setShowEmojiPicker(null); }} style={{ fontSize: '20px', cursor: 'pointer' }}>{emoji}</span>
            ))}
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
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
              {comments.filter(c => !c.parent_id).map(c => renderComment(c))}
            </div>
            
            <div style={styles.inputArea}>
              {replyTarget && <div style={styles.replyLabel}>Respondendo a @{replyTarget.name} <span onClick={() => setReplyTarget(null)} style={{cursor:'pointer', fontWeight:'bold'}}>✕</span></div>}
              <div style={styles.inputWrapper}>
                <input ref={inputRef} placeholder="Escreva algo..." value={textComment} onChange={(e) => setTextComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} style={styles.textInput} />
                <button onClick={() => handleSend()} disabled={isSending} style={styles.sendBtn}>{isSending ? "..." : "ENVIAR"}</button>
              </div>
              <div style={styles.micContainer}>
                <div style={styles.micRing}>
                  <svg style={styles.svgRing}>
                    <circle cx="40" cy="40" r="36" stroke="#222" strokeWidth="4" fill="none" />
                    {isRecording && <motion.circle cx="40" cy="40" r="36" stroke={recordingTime > 25 ? "#ff3040" : "#00f2fe"} strokeWidth="4" fill="none" strokeDasharray="226" strokeDashoffset={226 - (226 * recordingTime) / MAX_TIME} />}
                  </svg>
                  <motion.button onMouseDown={startRecording} onTouchStart={startRecording} animate={isRecording ? { scale: 0.9, backgroundColor: "#ff3040" } : { scale: 1, backgroundColor: "#1a1a1a" }} style={styles.micBtn}>
                    <span style={{ fontSize: "26px" }}>🎙️</span>
                  </motion.button>
                </div>
                <div style={{fontSize: '10px', color: '#555', marginTop: '5px'}}>SEGURE PARA GRAVAR ÁUDIO</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- DASHBOARDPAGE COM PRÉVIA DE 4 INTERAÇÕES ---
export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data: postsData } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (postsData) {
      setPosts(postsData);
      // Busca todos os comentários para agrupar as prévias
      const { data: comms } = await supabase.from("audio_comments").select("*").order("created_at", { ascending: true });
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
    if (!newPost.trim() && !selectedImage) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Logue para postar!");

    let imageUrl = null;
    if (selectedImage) {
      const fileName = `${Date.now()}`;
      const { error: upError } = await supabase.storage.from("post-images").upload(`photos/${fileName}`, selectedImage);
      if (!upError) imageUrl = supabase.storage.from("post-images").getPublicUrl(`photos/${fileName}`).data.publicUrl;
    }

    await supabase.from("posts").insert([{ 
      content: newPost, 
      image_url: imageUrl, 
      user_id: session.user.id, 
      user_email: session.user.email 
    }]);
    
    setNewPost(""); setSelectedImage(null); fetchPosts();
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
          <textarea placeholder="No que você está pensando?" value={newPost} onChange={(e) => setNewPost(e.target.value)} style={styles.createInput} />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn}>Publicar</button>
          </div>
        </div>

        {!loading && posts.map((post) => {
          const postComments = commentsByPost[post.id] || [];
          // PEGA AS ÚLTIMAS 4 INTERAÇÕES PARA INSTIGAR O CLIQUE
          const recentPreviews = postComments.slice(-4);

          return (
            <article key={post.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarWrapper}>
                  <div style={styles.avatarInner}>
                     <img src={`https://github.com/identicons/${post.user_id}.png`} alt="" style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.username}>@{post.user_email?.split('@')[0]}</div>
                  <div style={styles.meta}>Brasil</div>
                </div>
              </div>

              {post.image_url && <img src={post.image_url} alt="" style={styles.postImg} />}

              <div style={styles.socialBar}>
                 <span style={{ cursor: 'pointer' }}>🤍</span>
                 <span style={{ cursor: 'pointer' }} onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>💬</span>
                 <span style={{ cursor: 'pointer', fontSize: '26px' }} onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>🎙️</span>
              </div>

              <div style={styles.captionArea}>
                <p style={{ margin: 0, fontSize: 14 }}>
                  <span style={{ fontWeight: "bold", marginRight: 8 }}>@{post.user_email?.split('@')[0]}</span>
                  {post.content}
                </p>
              </div>

              {/* BOX DE PRÉVIA DA THREAD (3-4 COMENTÁRIOS) */}
              <div onClick={() => { setActivePostId(post.id); setOpenThread(true); }} style={styles.previewBox}>
                <div style={{ color: "#444", fontSize: "10px", fontWeight: 'bold', marginBottom: "8px", textTransform: 'uppercase' }}>
                   Conversa Ativa • {postComments.length} interações
                </div>
                
                {recentPreviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {recentPreviews.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.4 + (idx * 0.2) }}>
                        <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#00f2fe' }} />
                        <div style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.audio_url ? "🎤 Mensagem de áudio..." : c.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#333' }}>Seja o primeiro a interagir aqui.</div>
                )}
              </div>

              <div style={styles.actionPadding}>
                <button onClick={() => { setActivePostId(post.id); setOpenThread(true); }} style={styles.listenBtn}>O QUE ESTÃO FALANDO</button>
              </div>
            </article>
          );
        })}
      </main>

      <nav style={styles.bottomNav}><span>🏠</span><span>🔍</span><span style={styles.plusBtn}>+</span><span>🎬</span><span>👤</span></nav>
      
      <PainelAcoes postId={activePostId || ""} open={openThread} onClose={() => { setOpenThread(false); setActivePostId(null); fetchPosts(); }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { position: "sticky", top: 0, zIndex: 10, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", padding: "12px 20px", alignItems: "center" },
  logo: { fontSize: '18px', fontWeight: '900', letterSpacing: '2px' },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "100px" },
  createCard: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 20, border: "1px solid #151515", padding: 15, margin: "20px 0" },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", resize: "none", fontSize: 15, minHeight: 50 },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10 },
  mediaBtn: { background: "#111", border: "none", color: "#aaa", padding: "8px 15px", borderRadius: 10, fontSize: 12, cursor: "pointer" },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "8px 20px", borderRadius: 10, fontSize: 12, fontWeight: "bold", cursor: "pointer" },
  card: { width: "100%", maxWidth: 500, borderBottom: "1px solid #111", paddingBottom: 20 },
  cardHeader: { display: "flex", gap: 12, padding: "12px 15px", alignItems: "center" },
  avatarWrapper: { padding: "2px", borderRadius: "50%", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" },
  avatarInner: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#000', border: '2px solid #000', overflow: 'hidden' },
  username: { fontWeight: 700, fontSize: 13 },
  meta: { fontSize: 10, color: '#444' },
  postImg: { width: "100%", aspectRatio: "1/1", objectFit: "cover" },
  socialBar: { display: "flex", gap: 20, padding: "12px 15px 8px", fontSize: "24px", alignItems: 'center' },
  captionArea: { padding: "0 15px 10px" },
  previewBox: { margin: "0 15px 15px", padding: "12px", background: "#080808", borderRadius: "15px", border: "1px solid #111", cursor: "pointer" },
  actionPadding: { padding: "0 15px" },
  listenBtn: { width: "100%", background: "rgba(0,242,254,0.05)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 10, padding: "14px", fontWeight: "bold", fontSize: 11, cursor: "pointer" },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#000", borderTop: "1px solid #111", display: "flex", justifyContent: "space-around", padding: "15px", zIndex: 100, fontSize: "20px" },
  plusBtn: { fontSize: "28px", background: "#fff", borderRadius: "8px", color: "#000", padding: "0 6px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 10000, backdropFilter: "blur(12px)" },
  sheet: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", height: "85vh", width: "100%", maxWidth: "500px", backgroundColor: "#050505", borderRadius: "40px 40px 0 0", zIndex: 10001, display: "flex", flexDirection: "column", borderTop: "1px solid #333" },
  dragHandle: { width: 40, height: 4, background: "#222", borderRadius: 10, margin: "15px auto" },
  inputArea: { borderTop: "1px solid #1a1a1a", padding: "20px", background: "#050505" },
  replyLabel: { fontSize: "11px", color: "#00f2fe", marginBottom: "8px", display: "flex", justifyContent: "space-between" },
  inputWrapper: { display: "flex", gap: "10px", background: "#111", padding: "12px 20px", borderRadius: "30px", border: "1px solid #222", marginBottom: "15px" },
  textInput: { flex: 1, background: "none", border: "none", color: "#fff", outline: "none" },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontWeight: "bold", cursor: "pointer" },
  micContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" },
  micRing: { position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" },
  svgRing: { position: "absolute", transform: "rotate(-90deg)", width: "80px", height: "80px" },
  micBtn: { width: 60, height: 60, borderRadius: "50%", border: "none", cursor: "pointer", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  miniBtn: { background: "#00f2fe10", border: "none", color: "#00f2fe", borderRadius: "20px", padding: "4px 10px", fontSize: "10px", cursor: "pointer" },
  textBtn: { background: "none", border: "none", color: "#555", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }
};
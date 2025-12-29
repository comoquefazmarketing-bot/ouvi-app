"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

/**
 * -----------------------------------------------------------------------
 * ARQUITETURA DE SISTEMA - PROJETO OUVI
 * -----------------------------------------------------------------------
 * Desenvolvido por: Felipe Makarios (A Maker Filos)
 * build: 2025-12-29 | Video & Storage Optimized
 * -----------------------------------------------------------------------
 */

type PainelAcoesProps = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

// --- PAINEL DE INTERAÇÃO (COMENTÁRIOS E ÁUDIOS) ---
function PainelAcoes({ postId, open, onClose }: PainelAcoesProps) {
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_comments', filter: `post_id=eq.${postId}` }, () => fetchComments())
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

  async function handleSend(audioUrl: string | null = null) {
    const contentToSend = textComment.trim();
    if (!contentToSend && !audioUrl) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert("Sessão expirada.");
    
    setIsSending(true);
    const myUsername = session.user.email?.split('@')[0] || 'felipe_makarios';

    const { error } = await supabase.from("audio_comments").insert([{
      post_id: postId,
      parent_id: replyTarget?.id || null, 
      content: contentToSend || null,
      audio_url: audioUrl,
      user_id: session.user.id,
      username: myUsername,
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
    if (typeof window === "undefined" || !navigator.mediaDevices) return;
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
    // Ajustado para o bucket e pasta do seu print: post-images/audios/
    const { error } = await supabase.storage.from("post-images").upload(`audios/${fileName}`, blob);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(`audios/${fileName}`);
      await handleSend(publicUrl);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={styles.overlay} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={styles.sheet}>
            <div style={styles.dragHandle} />
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
              {comments.filter(c => !c.parent_id).map(c => (
                <div key={c.id} style={{ marginBottom: "20px" }}>
                   <div style={{ color: "#00f2fe", fontSize: "10px", fontWeight: "bold" }}>@{c.username}</div>
                   {c.content && <p style={{ fontSize: "14px", margin: "5px 0" }}>{c.content}</p>}
                   {c.audio_url && <audio controls src={c.audio_url} style={{ width: "100%", height: "35px" }} />}
                </div>
              ))}
            </div>
            <div style={styles.inputArea}>
              <div style={styles.inputWrapper}>
                <input ref={inputRef} placeholder="Escreva algo..." value={textComment} onChange={(e) => setTextComment(e.target.value)} style={styles.textInput} />
                <button onClick={() => handleSend()} disabled={isSending} style={styles.sendBtn}>{isSending ? "..." : "ENVIAR"}</button>
              </div>
              <div style={styles.micContainer}>
                <motion.button onMouseDown={startRecording} onTouchStart={startRecording} style={styles.micBtn}>🎙️</motion.button>
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
  const [loading, setLoading] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }

  async function handleCreatePost() {
    if (!newPost.trim() && !selectedImage) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Logue para postar!");

    let imageUrl = null;
    let videoUrl = null;

    if (selectedImage) {
      const isVideo = selectedImage.type.startsWith('video/');
      const folder = isVideo ? 'post-videos' : 'post-photos'; // Organizado conforme seu print
      const fileName = `${Date.now()}`;

      const { error: upError } = await supabase.storage
        .from("post-images")
        .upload(`${folder}/${fileName}`, selectedImage);

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
    
    setNewPost(""); setSelectedImage(null); fetchPosts();
  }

  return (
    <div style={styles.page}>
      <main style={styles.feed}>
        <div style={styles.createCard}>
          <textarea placeholder="No que você está pensando?" value={newPost} onChange={(e) => setNewPost(e.target.value)} style={styles.createInput} />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto/Vídeo</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn}>Publicar</button>
          </div>
        </div>

        {posts.map((post) => (
          <article key={post.id} style={styles.card}>
            <div style={styles.username}>@{post.user_email?.split('@')[0]}</div>
            
            {/* LÓGICA DE EXIBIÇÃO: VÍDEO OU FOTO */}
            {post.video_url ? (
              <video src={post.video_url} controls style={{ width: "100%", borderRadius: "10px" }} />
            ) : post.image_url && (
              <img src={post.image_url} alt="" style={styles.postImg} />
            )}

            <div style={{ padding: "10px 0" }}>{post.content}</div>
            <button onClick={() => { setActivePostId(post.id); setOpenThread(true); }} style={styles.listenBtn}>OUVIR CONVERSA</button>
          </article>
        ))}
      </main>

      <PainelAcoes postId={activePostId || ""} open={openThread} onClose={() => { setOpenThread(false); setActivePostId(null); }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" },
  createCard: { width: "100%", maxWidth: 500, background: "#080808", borderRadius: 20, border: "1px solid #151515", padding: 15, margin: "20px 0" },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", resize: "none" },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10 },
  mediaBtn: { background: "#111", border: "none", color: "#aaa", padding: "8px 15px", borderRadius: 10, cursor: "pointer" },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "8px 20px", borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  card: { width: "100%", maxWidth: 500, borderBottom: "1px solid #111", paddingBottom: 20, marginBottom: 20 },
  username: { fontWeight: "bold", padding: "10px 0", color: "#00f2fe" },
  postImg: { width: "100%", borderRadius: "10px" },
  listenBtn: { width: "100%", background: "rgba(0,242,254,0.1)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 10, padding: "12px", fontWeight: "bold", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 10000 },
  sheet: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", height: "80vh", width: "100%", maxWidth: "500px", background: "#050505", borderRadius: "30px 30px 0 0", zIndex: 10001, display: "flex", flexDirection: "column" },
  dragHandle: { width: 40, height: 4, background: "#333", borderRadius: 10, margin: "15px auto" },
  inputArea: { borderTop: "1px solid #1a1a1a", padding: "20px" },
  inputWrapper: { display: "flex", gap: "10px", background: "#111", padding: "10px 20px", borderRadius: "30px" },
  textInput: { flex: 1, background: "none", border: "none", color: "#fff", outline: "none" },
  sendBtn: { background: "none", border: "none", color: "#00f2fe", fontWeight: "bold", cursor: "pointer" },
  micContainer: { display: "flex", justifyContent: "center", marginTop: 15 },
  micBtn: { width: 60, height: 60, borderRadius: "50%", background: "#1a1a1a", border: "none", fontSize: "24px", cursor: "pointer" }
};
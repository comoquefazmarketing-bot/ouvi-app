"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

// --- PAINEL DE AÇÕES (GAVETA ESTILO INSTAGRAM) ---
function PainelAcoes({ postId, open, onClose }: any) {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (open && postId) {
      supabase.from("audio_comments").select("*").eq("post_id", postId)
        .then(({ data }) => setComments(data || []));
    }
  }, [open, postId]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay Escuro com Blur */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ 
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", 
              zIndex: 10000, backdropFilter: "blur(6px)" 
            }} 
          />
          
          {/* Gaveta que SOBE */}
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed", bottom: 0, left: "50%", x: "-50%",
              height: "80vh", width: "100%", maxWidth: "500px",
              backgroundColor: "#050505", borderTop: "1px solid #222",
              borderRadius: "30px 30px 0 0", zIndex: 10001,
              display: "flex", flexDirection: "column", padding: "20px"
            }}
          >
            <div style={{ width: 45, height: 5, background: "#333", borderRadius: 10, margin: "0 auto 20px" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
              <span style={{ color: "#fff", fontWeight: "bold", fontSize: "18px", letterSpacing: "1px" }}>RESSONÂNCIAS</span>
              <button onClick={onClose} style={{ background: "#222", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }}>
              {comments.length === 0 && <div style={{ textAlign: 'center', color: '#444', marginTop: 40 }}>Nenhum áudio ainda...</div>}
              {comments.map((c: any) => (
                <div key={c.id} style={{ background: "#111", padding: "15px", borderRadius: "20px", marginBottom: "15px", border: "1px solid #1a1a1a" }}>
                  <div style={{ color: "#00f2fe", fontSize: "11px", fontWeight: "bold", marginBottom: "10px" }}>@membro</div>
                  <audio controls src={c.audio_url} style={{ width: "100%", height: "38px", filter: "invert(1)" }} />
                </div>
              ))}
            </div>

            {/* BOTÃO MASTER DE GRAVAÇÃO: BLACK PIANO */}
            <div style={{ padding: "30px 0", display: "flex", flexDirection: "column", alignItems: "center", borderTop: "1px solid #111" }}>
               <button style={{
                  width: "85px", height: "85px", borderRadius: "50%",
                  background: "linear-gradient(145deg, #222, #000)",
                  border: "2px solid #333", cursor: "pointer",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.8), inset 0 2px 5px rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.2s"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.92)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <span style={{ fontSize: "35px" }}>🎙️</span>
                </button>
                <span style={{ color: "#444", fontSize: "10px", marginTop: "15px", fontWeight: "bold", letterSpacing: "2px" }}>SEGURE PARA FALAR</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- DASHBOARD PRINCIPAL ---
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
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (!error) setPosts(data || []);
    setLoading(false);
  }

  async function handleCreatePost() {
    const REAL_USER_ID = "0c8314cc-2731-4bf2-99a1-d8cd2725d77f";
    if (!newPost.trim() && !selectedImage) return;
    try {
      let imageUrl = null;
      if (selectedImage) {
        const fileName = `${Date.now()}`;
        await supabase.storage.from("post-images").upload(`photos/${fileName}`, selectedImage);
        imageUrl = supabase.storage.from("post-images").getPublicUrl(`photos/${fileName}`).data.publicUrl;
      }
      await supabase.from("posts").insert([{ 
        content: newPost, 
        image_url: imageUrl, 
        user_id: REAL_USER_ID, 
        user_email: "felipe@ouvi.app" 
      }]);
      setNewPost(""); setSelectedImage(null); fetchPosts();
    } catch (err) { console.error(err); }
  }

  const formatTime = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `há ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>OUVI</h1>
          <button onClick={() => window.location.reload()} style={styles.logoutBtn}>SAIR</button>
        </div>
      </header>

      <main style={styles.feed}>
        {/* ÁREA DE POSTAGEM COMPLETA */}
        <div style={styles.createCard}>
           <textarea 
            placeholder="No que você está pensando, Felipe?" 
            value={newPost} onChange={(e) => setNewPost(e.target.value)}
            style={styles.createInput}
          />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Adicionar Foto</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn}>Publicar</button>
          </div>
          {selectedImage && <div style={{ fontSize: 10, color: '#00f2fe', marginTop: 10 }}>✓ Imagem selecionada</div>}
        </div>

        {/* LISTA DE POSTS */}
        {!loading && posts.map((post) => (
          <article key={post.id} style={styles.card}>
            {/* CABEÇALHO DO POST COM AVATAR */}
            <div style={styles.cardHeader}>
              <div style={styles.avatar}>
                <img src={`https://github.com/identicons/${post.user_id}.png`} style={{ width: '100%' }} alt="avatar" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.username}>@{post.user_email?.split('@')[0]}</div>
                <div style={styles.meta}>{formatTime(post.created_at)}</div>
              </div>
              <div style={styles.heart}>❤️ 24</div>
            </div>

            {post.image_url && <img src={post.image_url} alt="" style={styles.postImg} />}

            {/* BOTÕES DE AÇÃO: NEON + STUDIO MIC */}
            <div style={styles.actions}>
              <button 
                onClick={() => { setActivePostId(post.id); setOpenThread(true); }}
                style={styles.listenBtn}
              >
                ESCUTAR ÁUDIOS
              </button>
              <button 
                onClick={() => { setActivePostId(post.id); setOpenThread(true); }}
                style={styles.studioMicBtn}
              >
                🎙️
              </button>
            </div>

            <div style={styles.caption}>
              <strong>@{post.user_email?.split('@')[0]}</strong> {post.content}
            </div>
          </article>
        ))}
      </main>

      {/* GAVETA QUE SOBE */}
      <PainelAcoes 
        postId={activePostId || ""} 
        open={openThread} 
        onClose={() => { setOpenThread(false); setActivePostId(null); }} 
      />
    </div>
  );
}

// --- ESTILOS V12 + REFINAMENTOS ---
const styles: Record<string, React.CSSProperties> = {
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { position: "sticky", top: 0, zIndex: 10, background: "#000", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", padding: "18px", alignItems: "center" },
  logo: { fontSize: '16px', color: '#fff', letterSpacing: '3px', fontWeight: 'bold' },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 28, padding: "20px 0" },
  createCard: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 25, border: "1px solid #151515", padding: 20 },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", resize: "none", fontSize: 16, minHeight: 70 },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 15, paddingTop: 15, borderTop: "1px solid #111" },
  mediaBtn: { background: "#111", border: "none", color: "#aaa", padding: "10px 18px", borderRadius: 12, fontSize: 12, cursor: "pointer" },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "10px 28px", borderRadius: 12, fontSize: 12, fontWeight: "bold", cursor: "pointer" },
  card: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 28, border: "1px solid #151515", overflow: "hidden" },
  cardHeader: { display: "flex", gap: 14, padding: "18px", alignItems: "center" },
  avatar: { width: 38, height: 38, borderRadius: '50%', backgroundColor: '#222', overflow: 'hidden', border: '1px solid #333' },
  username: { fontWeight: 700, fontSize: 14, color: '#eee' },
  meta: { fontSize: 11, color: '#555', marginTop: 2 },
  heart: { fontSize: '13px', color: '#333' },
  postImg: { width: "100%", display: "block", maxHeight: "500px", objectFit: "cover" },
  actions: { display: "flex", alignItems: "center", gap: 14, padding: "18px" },
  listenBtn: { flex: 1, background: "rgba(0,242,254,0.06)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 18, padding: "14px", fontWeight: "bold", fontSize: 11, letterSpacing: "1px", cursor: "pointer" },
  studioMicBtn: { 
    width: 52, height: 52, borderRadius: "50%", 
    background: "linear-gradient(145deg, #1a1a1a, #000)", 
    border: "1px solid #333", cursor: "pointer", 
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 6px 15px rgba(0,0,0,0.4)"
  },
  caption: { padding: "0 18px 22px", fontSize: 14, lineHeight: "1.6", color: "#ccc" },
};
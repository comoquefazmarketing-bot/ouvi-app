"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
// 🎯 IMPORT FORÇADO: Caminho relativo direto para ignorar alias/cache
import AudioThreadDrawer from "../../components/AudioThreadDrawer";

const formatTime = (date: string) => {
  const diff = new Date().getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return new Date(date).toLocaleDateString();
};

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPosts(data || []);
    }
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

      setNewPost("");
      setSelectedImage(null);
      fetchPosts();
    } catch (err) {
      console.error("Erro ao publicar:", err);
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
             {/* 🎯 MARCADOR VISUAL DE DEPLOY BEM SUCEDIDO */}
            <h1 style={{fontSize: '14px', color: '#00f2fe', letterSpacing: '2px'}}>OUVI DASHBOARD V12</h1>
          </div>
          <div style={styles.headerRight}>
             <button onClick={() => window.location.reload()} style={styles.logoutBtn}>SAIR</button>
          </div>
        </div>
      </header>

      <main style={styles.feed}>
        <div style={styles.createCard}>
           <textarea 
            placeholder="No que você está pensando, Felipe?" 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={styles.createInput}
          />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn}>Publicar</button>
          </div>
        </div>

        {!loading && posts.map((post) => (
          <article key={post.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{width: 40, height: 40, borderRadius: '50%', backgroundColor: '#333'}} />
              <div>
                <div style={styles.username}>@{post.user_email?.split('@')[0] || 'membro'}</div>
                <div style={styles.meta}>{formatTime(post.created_at)}</div>
              </div>
            </div>

            {post.image_url && <img src={post.image_url} alt="" style={styles.postImg} />}

            <div style={styles.actions}>
              <button 
                style={styles.listenBtn} 
                onClick={() => { setActivePostId(post.id); setOpenThread(true); }}
              >
                🎙️ OUVIR RESSONÂNCIAS (V12-400PX)
              </button>
            </div>

            <div style={styles.caption}>
              <strong>@{post.user_email?.split('@')[0] || 'membro'}</strong> {post.content}
            </div>
          </article>
        ))}
      </main>

      {/* COMPONENTE CHAMADO COM O NOVO IMPORT RELATIVO */}
      <AudioThreadDrawer 
        postId={activePostId || ""} 
        open={openThread} 
        onClose={() => { setOpenThread(false); setActivePostId(null); }} 
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { position: "sticky", top: 0, zIndex: 10, background: "#000", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" },
  headerLeft: { display: "flex", alignItems: "center", gap: 15, flex: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 15 },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontSize: 11, fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "20px 0" },
  createCard: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 25, border: "1px solid #151515", padding: 18 },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", resize: "none", fontSize: 15, minHeight: 60 },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 15, paddingTop: 15, borderTop: "1px solid #111" },
  mediaBtn: { background: "#111", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 10, fontSize: 12, cursor: "pointer" },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "8px 24px", borderRadius: 10, fontSize: 12, fontWeight: "bold", cursor: "pointer" },
  card: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 25, border: "1px solid #151515", overflow: "hidden" },
  cardHeader: { display: "flex", gap: 12, padding: 15, alignItems: "center" },
  username: { fontWeight: 700, fontSize: 14 },
  meta: { fontSize: 11, opacity: 0.5 },
  postImg: { width: "100%", height: "auto", display: "block" },
  actions: { display: "flex", alignItems: "center", gap: 12, padding: "15px" },
  listenBtn: { flex: 1, background: "rgba(0,242,254,0.05)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 15, padding: "12px", fontWeight: "bold", fontSize: 11, letterSpacing: 1, cursor: "pointer" },
  caption: { padding: "0 15px 20px", fontSize: 14, lineHeight: 1.5 },
};
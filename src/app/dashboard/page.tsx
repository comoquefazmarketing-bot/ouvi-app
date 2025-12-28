"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
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
  const [user, setUser] = useState<any>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState(false);
  
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    async function loadInitialData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        setUser(session.user);
      }
      await fetchPosts(mounted);
    }
    loadInitialData();
    return () => { mounted = false };
  }, []);

  // 🚀 BUSCA COMPLETA: POSTS + USUÁRIOS + ÁUDIOS
  async function fetchPosts(mounted = true) {
    // Buscamos os posts e fazemos o join com profiles
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && mounted) {
      setPosts(data || []);
      setLoading(false);
    } else {
      console.error("Erro ao carregar logs:", error);
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const REAL_USER_ID = "0c8314cc-2731-4bf2-99a1-d8cd2725d77f";
    const finalUserId = (!currentUser || currentUser.id === '00000000-0000-0000-0000-000000000000') 
      ? REAL_USER_ID 
      : currentUser.id;

    if (!newPost.trim() && !selectedImage) return;
    setStatus("uploading");

    try {
      let imageUrl = null;
      if (selectedImage) {
        const fileName = `${finalUserId}-${Date.now()}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(`post-photos/${fileName}`, selectedImage);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("post-images").getPublicUrl(`post-photos/${fileName}`).data.publicUrl;
      }

      const { error: insErr } = await supabase.from("posts").insert([{
        content: newPost,
        image_url: imageUrl,
        user_id: finalUserId,
        user_email: currentUser?.email || "felipe@ouvi.app"
      }]);

      if (insErr) throw insErr;
      setStatus("success");
      setTimeout(() => { setNewPost(""); setSelectedImage(null); setStatus("idle"); fetchPosts(); }, 800);
    } catch (err: any) {
      alert(err.message);
      setStatus("idle");
    }
  }

  if (loading) return <div style={styles.loading}>Recuperando logs da rede...</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h2 style={{color: '#00f2fe', letterSpacing: 4}}>OUVI</h2>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={styles.logoutBtn}>SAIR</button>
        </div>
      </header>

      <main style={styles.feed}>
        <div style={styles.createCard}>
          <textarea 
            placeholder="No que está pensando, Felipe?" 
            value={newPost} 
            onChange={(e) => setNewPost(e.target.value)} 
            style={styles.createInput} 
          />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
            <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn}>{status === "uploading" ? "..." : "Publicar"}</button>
          </div>
        </div>

        {posts.map((post) => (
          <article key={post.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{...styles.avatarSmall, backgroundImage: `url(${post.profiles?.avatar_url || ''})` || 'none', backgroundColor: '#222'}} />
              <div>
                <div style={styles.username}>@{post.profiles?.username || post.user_email?.split('@')[0]}</div>
                <div style={styles.meta}>{formatTime(post.created_at)}</div>
              </div>
            </div>

            {post.image_url && <img src={post.image_url} style={styles.postImg} />}
            <div style={styles.caption}>{post.content}</div>

            <div style={styles.actions}>
              {/* Esse botão abre os áudios que já foram enviados para este post */}
              <button 
                style={styles.listenBtn} 
                onClick={() => { setActivePostId(post.id); setOpenThread(true); }}
              >
                🎙️ OUVIR RESSONÂNCIAS
              </button>
            </div>
          </article>
        ))}
      </main>

      {/* Componente que puxa os áudios do banco de dados */}
      {activePostId && (
        <AudioThreadDrawer 
          postId={activePostId} 
          open={openThread} 
          onClose={() => setOpenThread(false)} 
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { position: "sticky", top: 0, zIndex: 10, background: "rgba(0,0,0,0.9)", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px" },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontWeight: "bold", cursor: "pointer", fontSize: 12 },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 0" },
  createCard: { width: "90%", maxWidth: 420, background: "#080808", borderRadius: 20, border: "1px solid #151515", padding: 16 },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", fontSize: 15, minHeight: 60, resize: 'none' },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10 },
  mediaBtn: { background: "#111", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 10, fontSize: 12 },
  publishBtn: { background: "#fff", color: "#000", border: "none", padding: "8px 20px", borderRadius: 10, fontWeight: "bold", fontSize: 12 },
  card: { width: "90%", maxWidth: 420, background: "#080808", borderRadius: 20, border: "1px solid #151515", overflow: "hidden" },
  cardHeader: { display: "flex", gap: 10, padding: 15, alignItems: "center" },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%', backgroundSize: 'cover' },
  username: { fontWeight: "bold", fontSize: 13 },
  meta: { fontSize: 11, opacity: 0.4 },
  postImg: { width: "100%", height: "auto", display: "block" },
  caption: { padding: "15px", fontSize: 14, lineHeight: 1.5 },
  actions: { padding: "0 15px 15px" },
  listenBtn: { width: "100%", background: "rgba(0,242,254,0.1)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 15, padding: "12px", fontWeight: "bold", fontSize: 11, cursor: "pointer" },
  loading: { height: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }
};
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
      if (mounted && session?.user) setUser(session.user);
      await fetchPosts(mounted);
    }
    loadInitialData();
    return () => { mounted = false };
  }, []);

  async function fetchPosts(mounted = true) {
    // 🎯 Busca os posts garantindo a relação com os perfis para as fotos e usernames
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles (username, avatar_url)`)
      .order("created_at", { ascending: false });

    if (!error && mounted) {
      setPosts(data || []);
      setLoading(false);
    } else {
      console.error("Erro no feed:", error);
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const REAL_USER_ID = "0c8314cc-2731-4bf2-99a1-d8cd2725d77f";
    const finalUserId = (!currentUser || currentUser.id === '00000000-0000-0000-0000-000000000000') 
      ? REAL_USER_ID : currentUser.id;

    if (!newPost.trim() && !selectedImage) return;
    setStatus("uploading");

    try {
      let imageUrl = null;
      if (selectedImage) {
        const fileName = `${finalUserId}-${Date.now()}`;
        await supabase.storage.from("post-images").upload(`post-photos/${fileName}`, selectedImage);
        imageUrl = supabase.storage.from("post-images").getPublicUrl(`post-photos/${fileName}`).data.publicUrl;
      }

      const { error } = await supabase.from("posts").insert([{
        content: newPost,
        image_url: imageUrl,
        user_id: finalUserId,
        user_email: currentUser?.email || "felipe@ouvi.app"
      }]);

      if (error) throw error;
      setStatus("success");
      setTimeout(() => { 
        setNewPost(""); 
        setSelectedImage(null); 
        setStatus("idle"); 
        fetchPosts(); 
      }, 800);
    } catch (err: any) {
      alert(err.message);
      setStatus("idle");
    }
  }

  if (loading) return <div style={styles.loading}>Sintonizando ambiente...</div>;

  return (
    <div style={styles.page}>
      {/* 🛡️ CABEÇALHO COM LOGO E PESQUISA (Identidade image_19ee20) */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.logoCircle}><img src="/logo-dashboard.svg" alt="" style={styles.logoImg} /></div>
            <div style={styles.searchBar}>
               <input type="text" placeholder="Pesquisar..." style={styles.searchInput} />
            </div>
          </div>
          <div style={styles.headerRight}>
             <span style={styles.headerUserName}>COMO</span>
             <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} style={styles.logoutBtn}>SAIR</button>
          </div>
        </div>
      </header>

      <main style={styles.feed}>
        {/* CARD DE POSTAGEM - FELIPE MAKARIOS */}
        <div style={styles.createCard}>
           <div style={styles.createHeader}>
              <div style={{...styles.avatarSmall, backgroundImage: user?.user_metadata?.avatar_url ? `url(${user.user_metadata.avatar_url})` : 'none', backgroundColor: '#222', backgroundSize: 'cover'}} />
              <span style={styles.username}>Como Que Faz Felipe Makarios</span>
           </div>
           <textarea 
            placeholder="No que você está pensando, Felipe?" 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={styles.createInput}
          />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn}>
              {status === "uploading" ? "..." : "Publicar"}
            </button>
          </div>
        </div>

        {/* FEED DE POSTS (Restaurado) */}
        {posts.map((post) => {
          const author = post.profiles?.username || post.user_email?.split('@')[0] || "membro";
          return (
            <article key={post.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarContainer}>
                  {post.profiles?.avatar_url && <img src={post.profiles.avatar_url} style={styles.avatarImg} alt="" />}
                  <div style={styles.avatarPlaceholder} />
                </div>
                <div>
                  <div style={styles.username}>@{author}</div>
                  <div style={styles.meta}>{formatTime(post.created_at)}</div>
                </div>
              </div>

              {post.image_url && <img src={post.image_url} alt="" style={styles.postImg} />}

              <div style={styles.actions}>
                <button style={styles.iconBtn}>🤍</button>
                <button 
                  style={styles.listenBtn} 
                  onClick={() => { setActivePostId(post.id); setOpenThread(true); }}
                >
                  🎙️ OUVIR RESSONÂNCIAS
                </button>
                <button style={styles.iconBtn}>🚀</button>
              </div>

              <div style={styles.caption}>
                <strong>@{author}</strong> {post.content}
              </div>
            </article>
          )
        })}
      </main>

      {/* COMPONENTE DE ÁUDIO INTEGRADO */}
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
  header: { position: "sticky", top: 0, zIndex: 10, background: "#000", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" },
  headerLeft: { display: "flex", alignItems: "center", gap: 15, flex: 1 },
  logoCircle: { width: 30, height: 30, borderRadius: '50%', border: '1px solid #333', display: 'grid', placeItems: 'center' },
  logoImg: { height: 18 },
  searchBar: { background: "#111", padding: "8px 15px", borderRadius: 25, flex: 0.8, border: "1px solid #222" },
  searchInput: { background: 'none', border: 'none', color: '#fff', fontSize: 13, outline: 'none', width: '100%' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 15 },
  headerUserName: { fontSize: 10, color: '#444', fontWeight: 'bold' },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontSize: 11, fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 0" },
  createCard: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 25, border: "1px solid #151515", padding: 18 },
  createHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 },
  avatarSmall: { width: 35, height: 35, borderRadius: '50%' },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", resize: "none", fontSize: 15, minHeight: 50 },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 15, paddingTop: 15, borderTop: "1px solid #111" },
  mediaBtn: { background: "#111", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 10, fontSize: 12, cursor: "pointer" },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "8px 24px", borderRadius: 10, fontSize: 12, fontWeight: "bold", cursor: "pointer" },
  card: { width: "95%", maxWidth: 500, background: "#080808", borderRadius: 25, border: "1px solid #151515", overflow: "hidden" },
  cardHeader: { display: "flex", gap: 12, padding: 15, alignItems: "center" },
  avatarContainer: { width: 40, height: 40, borderRadius: "50%", overflow: 'hidden', background: '#111', position: 'relative' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2 },
  avatarPlaceholder: { width: '100%', height: '100%', background: '#222' },
  username: { fontWeight: 700, fontSize: 14 },
  meta: { fontSize: 11, opacity: 0.5 },
  postImg: { width: "100%", height: "auto", display: "block" },
  actions: { display: "flex", alignItems: "center", gap: 12, padding: "15px" },
  iconBtn: { background: "#121212", border: "1px solid #1a1a1a", borderRadius: 15, padding: 10, cursor: "pointer", color: "#fff" },
  listenBtn: { flex: 1, background: "rgba(0,242,254,0.05)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 15, padding: "12px", fontWeight: "bold", fontSize: 11, letterSpacing: 1, cursor: "pointer" },
  caption: { padding: "0 15px 20px", fontSize: 14, lineHeight: 1.5 },
  loading: { height: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
};
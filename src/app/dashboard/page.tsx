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

  // 🛠️ CORREÇÃO AQUI: Adicionado o join com profiles para o feed aparecer
  async function fetchPosts(mounted = true) {
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
    } else if (error) {
      console.error("Erro ao buscar posts:", error);
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const REAL_USER_ID = "0c8314cc-2731-4bf2-99a1-d8cd2725d77f";
    const finalUserId = (!currentUser || currentUser.id === '00000000-0000-0000-0000-000000000000') 
      ? REAL_USER_ID 
      : currentUser.id;

    if (!newPost.trim() && !selectedImage) {
      alert("Escreva algo ou selecione uma imagem!");
      return;
    }
    
    setStatus("uploading");

    try {
      let imageUrl = null;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${finalUserId}-${Math.random()}.${fileExt}`;
        const filePath = `post-photos/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("post-images").upload(filePath, selectedImage);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("post-images").getPublicUrl(filePath).data.publicUrl;
      }

      const { error: insertError } = await supabase.from("posts").insert([
        {
          content: newPost,
          image_url: imageUrl,
          user_id: finalUserId, 
          user_email: currentUser?.email || "comoquefazmarketing@gmail.com",
        }
      ]);

      if (insertError) throw insertError;

      setStatus("success");
      setTimeout(() => {
        setNewPost("");
        setSelectedImage(null);
        setStatus("idle");
        fetchPosts(); 
      }, 800);

    } catch (err: any) {
      alert(`Erro ao postar: ${err.message}`);
      setStatus("idle");
    }
  }

  if (loading) return <div style={styles.loading}>Sintonizando feed...</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <h2 style={{color: '#00f2fe', margin: 0, fontSize: 18, letterSpacing: 2}}>OUVI</h2>
            <div style={styles.searchBar}><span>🔍 Pesquisar...</span></div>
          </div>
          <div style={styles.headerRight}>
             <span style={styles.headerUserName}>{user?.user_metadata?.full_name?.split(' ')[0] || "User"}</span>
             <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} style={styles.logoutBtn}>SAIR</button>
          </div>
        </div>
      </header>

      <main style={styles.feed}>
        {/* Card de Criação */}
        <div style={styles.createCard}>
           <div style={styles.createHeader}>
              <div style={{...styles.avatarSmall, background: '#333', backgroundImage: user?.user_metadata?.avatar_url ? `url(${user.user_metadata.avatar_url})` : 'none', backgroundSize: 'cover'}} />
              <span style={styles.username}>{user?.user_metadata?.full_name || "Seu Perfil"}</span>
           </div>
           <textarea 
            placeholder="No que está pensando, Felipe Makarios?" 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={styles.createInput}
            disabled={status !== "idle"}
          />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn} disabled={status !== "idle"}>
              {status === "uploading" ? "..." : "Publicar"}
            </button>
          </div>
        </div>

        {/* Listagem de Posts */}
        {posts.map((post) => {
          const displayNick = post.profiles?.username || post.user_email?.split("@")[0] || "membro";
          return (
            <article key={post.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarContainer}>
                  {post.profiles?.avatar_url && <img src={post.profiles.avatar_url} style={styles.avatarImg} alt="" />}
                  <div style={styles.avatarPlaceholder} />
                </div>
                <div>
                  <div style={styles.username}>@{displayNick}</div>
                  <div style={styles.meta}>{formatTime(post.created_at)}</div>
                </div>
              </div>
              <div style={styles.contentArea}>
                {post.image_url && <img src={post.image_url} style={styles.postImg} />}
                <div style={styles.caption}>
                  <strong>@{displayNick}</strong> {post.content}
                </div>
              </div>
              <div style={styles.actions}>
                <button style={styles.listenBtn} onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>🎙️ OUVIR RESSONÂNCIAS</button>
              </div>
            </article>
          );
        })}
      </main>

      {activePostId && <AudioThreadDrawer postId={activePostId} open={openThread} onClose={() => setOpenThread(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { position: "sticky", top: 0, zIndex: 10, background: "rgba(0,0,0,0.9)", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 450, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" },
  headerLeft: { display: "flex", alignItems: "center", gap: 15 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  searchBar: { background: "#111", padding: "6px 12px", borderRadius: 20, fontSize: 12, color: "#444", border: "1px solid #1a1a1a" },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontSize: 10, fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 0" },
  createCard: { width: "90%", maxWidth: 420, background: "#080808", borderRadius: 20, border: "1px solid #151515", padding: 16 },
  createHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatarSmall: { width: 28, height: 28, borderRadius: '50%' },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", fontSize: 14, minHeight: 40, resize: 'none' },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10 },
  mediaBtn: { background: "#111", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 11 },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: "bold" },
  card: { width: "90%", maxWidth: 420, background: "#080808", borderRadius: 20, border: "1px solid #151515", overflow: "hidden" },
  cardHeader: { display: "flex", gap: 12, padding: 12, alignItems: "center" },
  avatarContainer: { width: 32, height: 32, borderRadius: "50%", overflow: 'hidden', background: '#222', position: 'relative' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2 },
  avatarPlaceholder: { width: '100%', height: '100%', background: '#333' },
  username: { fontWeight: 700, fontSize: 13 },
  meta: { fontSize: 10, opacity: 0.5 },
  postImg: { width: "100%", height: "auto", display: "block" },
  caption: { padding: "12px", fontSize: 14 },
  actions: { padding: "0 12px 12px" },
  listenBtn: { width: "100%", background: "rgba(0,242,254,0.1)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 12, padding: "10px", fontWeight: "bold", fontSize: 11, cursor: "pointer" },
  loading: { height: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
};
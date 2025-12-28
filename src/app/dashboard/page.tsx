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

  // 🚀 RECUPERAÇÃO DE LOGS (POSTS + DESCRIÇÕES + PERFIS)
  async function fetchPosts(mounted = true) {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        image_url,
        created_at,
        user_email,
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
      console.error("ERRO AO RECUPERAR LOGS:", error);
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

  if (loading) return <div style={styles.loading}>Sincronizando frequências...</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h2 style={{color: '#00f2fe', letterSpacing: 4, margin: 0}}>OUVI</h2>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={styles.logoutBtn}>SAIR</button>
        </div>
      </header>

      <main style={styles.feed}>
        {/* Card de Criação */}
        <div style={styles.createCard}>
          <textarea 
            placeholder="Compartilhe sua vibração, Felipe..." 
            value={newPost} 
            onChange={(e) => setNewPost(e.target.value)} 
            style={styles.createInput} 
          />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Adicionar Foto</button>
            <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            <button onClick={handleCreatePost} style={styles.publishBtn} disabled={status !== "idle"}>
              {status === "uploading" ? "ENVIANDO..." : "PUBLICAR"}
            </button>
          </div>
        </div>

        {/* Listagem de Logs (Posts) */}
        {posts.map((post) => (
          <article key={post.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{...styles.avatarSmall, backgroundImage: `url(${post.profiles?.avatar_url || ''})`, backgroundColor: '#222'}} />
              <div>
                <div style={styles.username}>@{post.profiles?.username || post.user_email?.split('@')[0]}</div>
                <div style={styles.meta}>{formatTime(post.created_at)}</div>
              </div>
            </div>

            {post.image_url && <img src={post.image_url} style={styles.postImg} alt="Log visual" />}
            
            {/* 🛡️ ÁREA DE DESCRIÇÃO GARANTIDA */}
            <div style={styles.caption}>
              {post.content ? post.content : <span style={{opacity: 0.3, fontStyle: 'italic'}}>Sem descrição no log.</span>}
            </div>

            <div style={styles.actions}>
              <button 
                style={styles.listenBtn} 
                onClick={() => { 
                  console.log("Abrindo áudios para o post:", post.id); // Log para debug
                  setActivePostId(post.id); 
                  setOpenThread(true); 
                }}
              >
                🎙️ OUVIR RESSONÂNCIAS
              </button>
            </div>
          </article>
        ))}
      </main>

      {/* COMPONENTE DE ÁUDIO (Recupera áudios do banco via postId) */}
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
  header: { position: "sticky", top: 0, zIndex: 10, background: "rgba(0,0,0,0.95)", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 450, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px" },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontWeight: "bold", cursor: "pointer", fontSize: 11 },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 25, padding: "20px 0" },
  createCard: { width: "90%", maxWidth: 420, background: "#0a0a0a", borderRadius: 24, border: "1px solid #1a1a1a", padding: 20 },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", fontSize: 15, minHeight: 80, resize: 'none' },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 15, borderTop: '1px solid #1a1a1a', paddingTop: 15 },
  mediaBtn: { background: "#111", color: "#888", border: "1px solid #222", padding: "8px 16px", borderRadius: 12, fontSize: 12, cursor: 'pointer' },
  publishBtn: { background: "#fff", color: "#000", border: "none", padding: "8px 24px", borderRadius: 12, fontWeight: "bold", fontSize: 12, cursor: 'pointer' },
  card: { width: "90%", maxWidth: 420, background: "#0a0a0a", borderRadius: 28, border: "1px solid #111", overflow: "hidden" },
  cardHeader: { display: "flex", gap: 12, padding: 18, alignItems: "center" },
  avatarSmall: { width: 36, height: 36, borderRadius: '50%', backgroundSize: 'cover', backgroundPosition: 'center' },
  username: { fontWeight: "bold", fontSize: 14, color: '#efefef' },
  meta: { fontSize: 11, opacity: 0.4, marginTop: 2 },
  postImg: { width: "100%", height: "auto", display: "block", borderBottom: '1px solid #111' },
  caption: { padding: "18px", fontSize: 15, lineHeight: 1.6, color: '#ddd' },
  actions: { padding: "0 18px 18px" },
  listenBtn: { width: "100%", background: "rgba(0,242,254,0.08)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 18, padding: "14px", fontWeight: "bold", fontSize: 12, cursor: "pointer", transition: '0.2s' },
  loading: { height: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, letterSpacing: 2 }
};
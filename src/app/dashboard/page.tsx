"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import AudioThreadDrawer from "../../components/AudioThreadDrawer";

// Função para formatar a data do post
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

  async function fetchPosts(mounted = true) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && mounted) {
      setPosts(data || []);
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    // 🛡️ CAPTURA DIRETA DO USUÁRIO
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 💡 LOGICA DE ESTEPE: Se o ID vier zerado, usamos o seu ID real do banco
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

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);
        
        imageUrl = publicData.publicUrl;
      }

      // 🚀 INSERÇÃO COM ID GARANTIDO
      const { error: insertError } = await supabase
        .from("posts")
        .insert([
          {
            content: newPost,
            image_url: imageUrl,
            user_id: finalUserId, 
            user_email: currentUser?.email || "comoquefazmarketing@gmail.com",
          }
        ]);

      if (insertError) {
        console.error("Erro Supabase:", insertError);
        throw insertError;
      }

      setStatus("success");
      setTimeout(() => {
        setNewPost("");
        setSelectedImage(null);
        setStatus("idle");
        fetchPosts(); 
      }, 800);

    } catch (err: any) {
      console.error("ERRO CRÍTICO AO POSTAR:", err.message);
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
            <img src="/logo-dashboard.svg" alt="OUVI" style={styles.logoImg} />
            <div style={styles.searchBar}><span>🔍 Pesquisar...</span></div>
          </div>
          <div style={styles.headerRight}>
             <span style={styles.headerUserName}>{user?.user_metadata?.full_name?.split(' ')[0]}</span>
             <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} style={styles.logoutBtn}>SAIR</button>
          </div>
        </div>
      </header>

      <main style={styles.feed}>
        <div style={styles.createCard}>
           <div style={styles.createHeader}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} style={styles.avatarSmall} alt="" />
              ) : (
                <div style={{...styles.avatarSmall, background: '#333'}} />
              )}
              <span style={styles.username}>{user?.user_metadata?.full_name || "Seu Perfil"}</span>
           </div>
           <textarea 
            placeholder="No que você está pensando?" 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={styles.createInput}
            disabled={status !== "idle"}
          />
          {selectedImage && <div style={{fontSize: 10, color: '#00f2fe', marginBottom: 5, fontWeight: 'bold'}}>✓ Imagem preparada</div>}
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn} disabled={status !== "idle"}>🖼️ Foto</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
            
            <button 
              onClick={handleCreatePost}
              style={{...styles.publishBtn, opacity: status !== "idle" ? 0.6 : 1}}
              disabled={status !== "idle"}
            >
              {status === "uploading" ? "Sintonizando..." : status === "success" ? "Publicado ✓" : "Publicar"}
            </button>
          </div>
        </div>

        {posts.map((post) => {
          const username = post.user_email?.includes("@") ? post.user_email.split("@")[0] : `user_${post.id.slice(0, 5)}`;
          
          return (
            <article key={post.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarContainer}>
                  {(post.user_id === user?.id && user?.user_metadata?.avatar_url) ? (
                    <img src={user.user_metadata.avatar_url} style={styles.avatarImg} alt="" />
                  ) : null}
                  <div style={styles.avatarPlaceholder} />
                </div>
                <div>
                  <div style={styles.username}>@{username}</div>
                  <div style={styles.meta}>{formatTime(post.created_at)}</div>
                </div>
              </div>

              <div style={styles.media}>
                {post.image_url ? (
                  <img src={post.image_url} alt="" style={styles.postImg} />
                ) : (
                  <span style={styles.mediaHint}>Sintonizando frequência...</span>
                )}
              </div>

              <div style={styles.actions}>
                <button style={styles.iconBtn}>🤍</button>
                <button style={styles.listenBtn} onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>🎙️ OUVIR RESSONÂNCIAS</button>
                <button style={styles.iconBtn}>🚀</button>
              </div>

              <div style={styles.caption}>
                <strong>@{username}</strong> {post.content || "Vibração sem palavras."}
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
  header: { position: "sticky", top: 0, zIndex: 10, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  headerUserName: { fontSize: 10, opacity: 0.5, fontWeight: 'bold', textTransform: 'uppercase' },
  logoImg: { height: 20, objectFit: "contain" },
  searchBar: { background: "#111", padding: "6px 12px", borderRadius: 20, flex: 0.8, fontSize: 12, color: "#444", border: "1px solid #1a1a1a" },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontSize: 10, fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "20px 0" },
  createCard: { width: "100%", maxWidth: 420, background: "#080808", borderRadius: 24, border: "1px solid #151515", padding: 16 },
  createHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatarSmall: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", resize: "none", fontSize: 14, minHeight: 40 },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #151515" },
  mediaBtn: { background: "#111", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer" },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: "bold", cursor: "pointer" },
  card: { width: "100%", maxWidth: 420, background: "#080808", borderRadius: 24, border: "1px solid #151515", overflow: "hidden", marginBottom: 10 },
  cardHeader: { display: "flex", gap: 12, padding: 16, alignItems: "center" },
  avatarContainer: { width: 36, height: 36, borderRadius: "50%", overflow: 'hidden', background: '#111', border: '1px solid #222', position: 'relative' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2 },
  avatarPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(45deg,#222,#080808)' },
  username: { fontWeight: 700, fontSize: 13 },
  meta: { fontSize: 11, opacity: 0.5 },
  media: { minHeight: 260, background: "#0a0a0a", display: "grid", placeItems: "center" },
  postImg: { width: "100%", height: "auto", display: "block" },
  mediaHint: { fontSize: 11, opacity: 0.3 },
  actions: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" },
  iconBtn: { background: "#121212", border: "1px solid #1a1a1a", borderRadius: 14, padding: 12, cursor: "pointer", color: "#fff" },
  listenBtn: { flex: 1, background: "rgba(0,242,254,0.12)", border: "1px solid rgba(0,242,254,0.35)", color: "#00f2fe", borderRadius: 14, padding: "12px", fontWeight: 800, fontSize: 11, letterSpacing: 0.6, cursor: "pointer" },
  caption: { padding: "0 16px 16px", fontSize: 14, lineHeight: 1.4, opacity: 0.9 },
  loading: { height: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
};
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
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  
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

  // FUNÇÃO CURTIR
  const handleLike = (postId: string) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    // Aqui você pode adicionar a integração com a tabela 'likes' do Supabase depois
  };

  // FUNÇÃO COMPARTILHAR
  const handleShare = async (postId: string) => {
    const shareData = {
      title: 'OUVI App',
      text: 'Veja essa ressonância no OUVI!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copiado para a área de transferência!");
      }
    } catch (err) {
      console.log("Erro ao compartilhar");
    }
  };

  async function handleCreatePost() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const REAL_USER_ID = "0c8314cc-2731-4bf2-99a1-d8cd2725d77f";
    const finalUserId = (!currentUser || currentUser.id === '00000000-0000-0000-0000-000000000000') 
      ? REAL_USER_ID : currentUser.id;

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
        const { data: publicData } = supabase.storage.from("post-images").getPublicUrl(filePath);
        imageUrl = publicData.publicUrl;
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
            <img src="/logo-dashboard.svg" alt="OUVI" style={styles.logoImg} />
            <div style={styles.searchBar}><span>🔍 Pesquisar...</span></div>
          </div>
          <div style={styles.headerRight}>
             <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} style={styles.logoutBtn}>SAIR</button>
          </div>
        </div>
      </header>

      <main style={styles.feed}>
        {/* CARD DE CRIAÇÃO */}
        <div style={styles.createCard}>
           <div style={styles.createHeader}>
              <div style={{...styles.avatarSmall, background: 'linear-gradient(45deg, #00f2fe, #000)'}} />
              <span style={styles.username}>No que está pensando, Felipe?</span>
           </div>
           <textarea 
            placeholder="Compartilhe sua vibração em texto..." 
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
              {status === "uploading" ? "Enviando..." : status === "success" ? "Publicado ✓" : "Publicar"}
            </button>
          </div>
        </div>

        {/* FEED DE POSTS */}
        {posts.map((post) => {
          const username = post.user_email?.includes("@") ? post.user_email.split("@")[0] : `user_${post.id.slice(0, 5)}`;
          const isLiked = likedPosts[post.id];
          
          return (
            <article key={post.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarContainer}>
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
                  <div style={styles.textPostContainer}>{post.content}</div>
                )}
              </div>

              <div style={styles.actions}>
                <button 
                  style={{...styles.iconBtn, color: isLiked ? '#ff3040' : '#fff', borderColor: isLiked ? '#ff3040' : '#1a1a1a'}} 
                  onClick={() => handleLike(post.id)}
                >
                  {isLiked ? '❤️' : '🤍'}
                </button>
                <button style={styles.listenBtn} onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>🎙️ OUVIR / COMENTAR</button>
                <button style={styles.iconBtn} onClick={() => handleShare(post.id)}>🚀</button>
              </div>

              {post.image_url && (
                <div style={styles.caption}>
                  <strong>@{username}</strong> {post.content}
                </div>
              )}
            </article>
          );
        })}
      </main>

      {/* AQUI ESTÁ O DRAWER ONDE VOCÊ PODERÁ ESCREVER COMENTÁRIOS TAMBÉM */}
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
  header: { position: "sticky", top: 0, zIndex: 10, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid #151515", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  logoImg: { height: 22, objectFit: "contain" },
  searchBar: { background: "#0a0a0a", padding: "8px 16px", borderRadius: 20, flex: 0.8, fontSize: 13, color: "#444", border: "1px solid #151515" },
  logoutBtn: { background: "#111", border: "1px solid #222", color: "#ff3040", fontSize: 10, padding: "6px 12px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "16px 0", width: "100%" },
  createCard: { width: "95%", maxWidth: 420, background: "#080808", borderRadius: 24, border: "1px solid #151515", padding: 16 },
  createHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%' },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", resize: "none", fontSize: 15, minHeight: 60 },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #151515" },
  mediaBtn: { background: "#111", border: "1px solid #222", color: "#fff", padding: "8px 16px", borderRadius: 12, fontSize: 12, cursor: "pointer" },
  publishBtn: { background: "#fff", border: "none", color: "#000", padding: "8px 20px", borderRadius: 12, fontSize: 12, fontWeight: "bold", cursor: "pointer" },
  card: { width: "95%", maxWidth: 420, background: "#080808", borderRadius: 28, border: "1px solid #151515", overflow: "hidden", marginBottom: 8 },
  cardHeader: { display: "flex", gap: 12, padding: "16px 16px 12px", alignItems: "center" },
  avatarContainer: { width: 38, height: 38, borderRadius: "50%", overflow: 'hidden', background: '#111' },
  avatarPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(45deg,#111,#222)' },
  username: { fontWeight: 700, fontSize: 14 },
  meta: { fontSize: 12, opacity: 0.4 },
  media: { width: '100%', background: "#050505", display: "flex", flexDirection: "column" },
  textPostContainer: { padding: "20px 16px", fontSize: 18, fontWeight: 300, color: "#eee", textAlign: "center", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" },
  postImg: { width: "100%", height: "auto", display: "block" },
  actions: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" },
  iconBtn: { background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 16, padding: "10px 14px", cursor: "pointer", transition: '0.2s' },
  listenBtn: { flex: 1, background: "rgba(0,242,254,0.08)", border: "1px solid rgba(0,242,254,0.2)", color: "#00f2fe", borderRadius: 16, padding: "12px", fontWeight: 700, fontSize: 11, cursor: "pointer" },
  caption: { padding: "0 16px 16px", fontSize: 14, lineHeight: 1.5, color: "#ccc" },
  loading: { height: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, letterSpacing: 1 },
};
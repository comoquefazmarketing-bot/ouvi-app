"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import AudioThreadDrawer from "../../components/AudioThreadDrawer";

// Nome alterado para DashboardV7Page para forçar o Next.js a recompilar e ignorar o cache antigo
export default function DashboardV7Page() {
  // Estados de Controle de Perfil
  const [userProfile, setUserProfile] = useState<{username: string, avatar_url?: string} | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [tempNick, setTempNick] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Estados do Feed
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState(false);
  
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas Ref para a animação CYMATIC
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- ANIMAÇÃO CYMATIC (Padrões de Ressonância) ---
  const startCymaticAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const numParticles = 2000; 

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = Math.max(canvas.width, canvas.height);
      particles.push({
        x: canvas.width / 2 + Math.cos(angle) * spawnDist,
        y: canvas.height / 2 + Math.sin(angle) * spawnDist,
        originX: Math.random() * canvas.width,
        originY: Math.random() * canvas.height,
        size: Math.random() * 1.6,
        color: i % 2 === 0 ? "#00f2fe" : "#0055ff",
        speed: 0.02 + Math.random() * 0.04
      });
    }

    const draw = (t: number) => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = t * 0.0007;

      particles.forEach((p) => {
        const xDist = (p.originX - centerX) / 280;
        const yDist = (p.originY - centerY) / 280;
        const n = 5 + Math.sin(time) * 2;
        const m = 4 + Math.cos(time) * 2;
        const wave = Math.sin(n * xDist) * Math.sin(m * yDist) + Math.sin(m * xDist) * Math.sin(n * yDist);
        
        const targetX = p.originX + wave * 55 * Math.sin(time);
        const targetY = p.originY + wave * 55 * Math.cos(time);

        p.x += (targetX - p.x) * p.speed;
        p.y += (targetY - p.y) * p.speed;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.arc(p.x, canvas.height - (p.y * 0.42), p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };
    animationFrameId.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    loadUserAndFeed();
    startCymaticAnimation(); 
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [startCymaticAnimation]);

  async function loadUserAndFeed() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase.from("profiles").select("username, avatar_url").eq("id", session.user.id).maybeSingle();
      if (profile) setUserProfile(profile);
    }
    setCheckingProfile(false);
    fetchPosts();
  }

  async function fetchPosts() {
    const { data } = await supabase.from("posts").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoadingFeed(false);
  }

  async function handleSaveCompleteProfile() {
    const nickClean = tempNick.trim().toLowerCase();
    if (nickClean.length < 3) return alert("O nick deve ter pelo menos 3 caracteres.");
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      let publicUrl = null;
      if (avatarFile) {
        const fileName = `${session.user.id}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from("post-images").upload(`avatars/${fileName}`, avatarFile);
        if (uploadError) throw uploadError;
        publicUrl = supabase.storage.from("post-images").getPublicUrl(`avatars/${fileName}`).data.publicUrl;
      }
      const { error } = await supabase.from("profiles").insert([{ id: session.user.id, username: nickClean, avatar_url: publicUrl }]);
      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setIsSaving(false);
    }
  }

  if (checkingProfile) return <div style={styles.loading}>Sintonizando...</div>;

  return (
    <div style={styles.mainWrapper}>
      <canvas ref={canvasRef} style={styles.canvasBackground} />

      {!userProfile ? (
        <div style={styles.glassCard}>
          <h1 style={styles.logoTitle}>OUVI</h1>
          <p style={styles.tagline}>Sua voz em ressonância.</p>
          <div onClick={() => avatarInputRef.current?.click()} style={{...styles.avatarUpload, backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none'}}>
            {!avatarPreview && <span>📸</span>}
            <div style={styles.plusBadge}>+</div>
          </div>
          <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
          }} />
          <div style={styles.inputBox}>
            <span style={{color: '#00f2fe'}}>@</span>
            <input placeholder="seu_nick_exclusivo" style={styles.nickInput} value={tempNick} onChange={(e) => setTempNick(e.target.value)} />
          </div>
          <button onClick={handleSaveCompleteProfile} style={styles.startBtn} disabled={isSaving}>
            {isSaving ? "INICIANDO..." : "COMEÇAR A OUVIR"}
          </button>
        </div>
      ) : (
        <div style={styles.dashboardLayout}>
          <header style={styles.header}>
            <div style={styles.headerContent}>
              <h2 style={{color: '#00f2fe', letterSpacing: 6, margin: 0, fontSize: 18}}>OUVI</h2>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} style={styles.logoutBtn}>SAIR</button>
            </div>
          </header>

          <main style={styles.feedScroll}>
            <div style={styles.createCard}>
              <div style={styles.createHeader}>
                <div style={{...styles.avatarSmall, backgroundImage: userProfile.avatar_url ? `url(${userProfile.avatar_url})` : 'none'}} />
                <span style={styles.usernameText}>No que está pensando, {userProfile.username}?</span>
              </div>
              <textarea placeholder="Compartilhe sua vibração..." value={newPost} onChange={(e) => setNewPost(e.target.value)} style={styles.createInput} />
              <div style={styles.createActions}>
                <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
                <input type="file" ref={fileInputRef} hidden accept="image/*" />
                <button style={styles.publishBtn}>Publicar</button>
              </div>
            </div>

            {posts.map((post) => (
              <article key={post.id} style={styles.postCard}>
                <div style={styles.postHeader}>
                  <div style={{...styles.avatarSmall, backgroundImage: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url})` : 'none'}} />
                  <div>
                    <div style={styles.usernameText}>@{post.profiles?.username || 'user'}</div>
                    <div style={styles.metaText}>{new Date(post.created_at).toLocaleTimeString([], {hour: '2-刻', minute:'2-digit'})}</div>
                  </div>
                </div>
                {post.image_url ? <img src={post.image_url} style={styles.postImg} /> : <div style={styles.textPost}>{post.content}</div>}
                <div style={{padding: 15}}>
                  <button style={styles.listenBtn} onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>🎙️ OUVIR COMENTÁRIOS</button>
                </div>
              </article>
            ))}
          </main>
        </div>
      )}

      {activePostId && <AudioThreadDrawer postId={activePostId} open={openThread} onClose={() => setOpenThread(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  mainWrapper: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', color: '#fff' },
  canvasBackground: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
  glassCard: { 
    zIndex: 2, width: '90%', maxWidth: 350, textAlign: 'center', padding: 40, 
    background: 'rgba(0, 0, 0, 0.4)', borderRadius: 45, backdropFilter: 'blur(20px)', 
    border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' 
  },
  logoTitle: { fontSize: 32, letterSpacing: 10, fontWeight: 900, marginBottom: 5 },
  tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 30 },
  avatarUpload: { width: 105, height: 105, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid #00f2fe', margin: '0 auto 25px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', backgroundSize: 'cover', backgroundPosition: 'center' },
  plusBadge: { position: 'absolute', bottom: 5, right: 5, background: '#00f2fe', color: '#000', width: 26, height: 26, borderRadius: '50%', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' },
  inputBox: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: 15, marginBottom: 20 },
  nickInput: { background: 'none', border: 'none', color: '#fff', marginLeft: 10, outline: 'none', width: '100%', fontSize: 16 },
  startBtn: { width: '100%', padding: 16, borderRadius: 15, background: '#00f2fe', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: 14 },
  dashboardLayout: { zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' },
  header: { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' },
  headerContent: { width: '100%', maxWidth: 450, display: 'flex', justifyContent: 'space-between', padding: '15px 20px', alignItems: 'center' },
  logoutBtn: { background: 'none', border: 'none', color: '#ff3040', fontWeight: 'bold', fontSize: 11, cursor: 'pointer' },
  feedScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, padding: '20px 0' },
  createCard: { width: '90%', maxWidth: 420, background: 'rgba(255,255,255,0.03)', borderRadius: 25, border: '1px solid rgba(255,255,255,0.05)', padding: 15 },
  createHeader: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%', backgroundSize: 'cover', backgroundPosition: 'center', background: '#222', border: '1px solid rgba(0,242,254,0.3)' },
  usernameText: { fontWeight: 'bold', fontSize: 14 },
  createInput: { width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none', minHeight: 60, resize: 'none' },
  createActions: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  mediaBtn: { background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: 10, fontSize: 12 },
  publishBtn: { background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 10, fontWeight: 'bold', fontSize: 12 },
  postCard: { width: '90%', maxWidth: 420, background: 'rgba(0,0,0,0.6)', borderRadius: 30, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
  postHeader: { display: 'flex', gap: 10, padding: 15, alignItems: 'center' },
  metaText: { fontSize: 11, opacity: 0.4 },
  postImg: { width: '100%', display: 'block' },
  textPost: { padding: 40, textAlign: 'center', fontSize: 18, fontWeight: 300 },
  listenBtn: { width: '100%', padding: 14, borderRadius: 20, background: 'rgba(0,242,254,0.05)', border: '1px solid #00f2fe', color: '#00f2fe', fontWeight: 'bold', fontSize: 11, cursor: 'pointer' },
  loading: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }
};
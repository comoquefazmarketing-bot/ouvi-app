"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import AudioThreadDrawer from "../../components/AudioThreadDrawer";

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<{username: string, avatar_url?: string} | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [tempNick, setTempNick] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState(false);
  
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- ANIMAÇÃO CYMATIC (Fica rodando no fundo sempre) ---
  const startCymaticAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: any[] = [];
    for (let i = 0; i < 1800; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        originX: Math.random() * canvas.width,
        originY: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        color: i % 2 === 0 ? "#00f2fe" : "#0055ff",
        speed: 0.01 + Math.random() * 0.03
      });
    }
    const draw = (t: number) => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const time = t * 0.0005;
      particles.forEach((p) => {
        const xNorm = (p.originX - canvas.width / 2) / 300;
        const yNorm = (p.originY - canvas.height / 2) / 300;
        const wave = Math.sin(5 * xNorm) * Math.sin(4 * yNorm) + Math.sin(4 * xNorm) * Math.sin(5 * yNorm);
        const destX = p.originX + wave * 40 * Math.cos(time);
        const destY = p.originY + wave * 40 * Math.sin(time);
        p.x += (destX - p.x) * p.speed;
        p.y += (destY - p.y) * p.speed;
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
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
    if (nickClean.length < 3) return alert("Nick muito curto!");
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    try {
      let publicUrl = null;
      if (avatarFile) {
        const fileName = `${session.user.id}-${Date.now()}`;
        await supabase.storage.from("post-images").upload(`avatars/${fileName}`, avatarFile);
        publicUrl = supabase.storage.from("post-images").getPublicUrl(`avatars/${fileName}`).data.publicUrl;
      }
      await supabase.from("profiles").insert([{ id: session.user.id, username: nickClean, avatar_url: publicUrl }]);
      window.location.reload();
    } catch (err) { setIsSaving(false); }
  }

  if (checkingProfile) return <div style={styles.loading}>Sintonizando...</div>;

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {!userProfile ? (
        <div style={styles.glassCard}>
          <h1 style={styles.title}>OUVI</h1>
          <div onClick={() => avatarInputRef.current?.click()} style={{...styles.avatarUpload, backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none'}}>
            {!avatarPreview && <span>📸</span>}
            <div style={styles.plusBadge}>+</div>
          </div>
          <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
          }} />
          <div style={styles.inputArea}>
            <span style={{color: '#00f2fe'}}>@</span>
            <input placeholder="seu_nick" style={styles.nickInput} value={tempNick} onChange={(e) => setTempNick(e.target.value)} />
          </div>
          <button onClick={handleSaveCompleteProfile} style={styles.btn} disabled={isSaving}>ENTRAR NA REDE</button>
        </div>
      ) : (
        <div style={styles.dashboard}>
          <header style={styles.header}>
            <div style={styles.headerContent}>
              <h2 style={{color: '#00f2fe', letterSpacing: 5}}>OUVI</h2>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} style={styles.logout}>SAIR</button>
            </div>
          </header>

          <main style={styles.feed}>
            {/* O SEU FORMULÁRIO DE POST ORIGINAL */}
            <div style={styles.createCard}>
              <div style={styles.createHeader}>
                <div style={{...styles.avatarSmall, backgroundImage: userProfile.avatar_url ? `url(${userProfile.avatar_url})` : 'none'}} />
                <span style={styles.boldText}>No que está pensando, {userProfile.username}?</span>
              </div>
              <textarea placeholder="Compartilhe sua vibração..." value={newPost} onChange={(e) => setNewPost(e.target.value)} style={styles.textarea} />
              <div style={styles.createActions}>
                <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
                <input type="file" ref={fileInputRef} hidden accept="image/*" />
                <button style={styles.publishBtn}>Publicar</button>
              </div>
            </div>

            {/* O SEU LOOP DE POSTS ORIGINAL */}
            {posts.map((post) => (
              <article key={post.id} style={styles.postCard}>
                <div style={styles.postHeader}>
                  <div style={{...styles.avatarSmall, backgroundImage: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url})` : 'none'}} />
                  <span style={styles.boldText}>@{post.profiles?.username || 'user'}</span>
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
  container: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', color: '#fff' },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
  glassCard: { zIndex: 2, width: '90%', maxWidth: 340, textAlign: 'center', padding: 40, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 40, backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' },
  title: { fontSize: 32, letterSpacing: 10, fontWeight: 900, marginBottom: 30 },
  avatarUpload: { width: 100, height: 100, borderRadius: '50%', background: '#111', border: '2px solid #00f2fe', margin: '0 auto 25px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', backgroundSize: 'cover' },
  plusBadge: { position: 'absolute', bottom: 0, right: 0, background: '#00f2fe', width: 26, height: 26, borderRadius: '50%', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' },
  inputArea: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: 15, marginBottom: 20, border: '1px solid rgba(255,255,255,0.1)' },
  nickInput: { background: 'none', border: 'none', color: '#fff', marginLeft: 10, outline: 'none', width: '100%' },
  btn: { width: '100%', padding: 15, borderRadius: 15, background: '#00f2fe', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  dashboard: { zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' },
  header: { background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' },
  headerContent: { width: '100%', maxWidth: 450, display: 'flex', justifyContent: 'space-between', padding: '10px 20px', alignItems: 'center' },
  logout: { background: 'none', border: 'none', color: '#ff3040', fontWeight: 'bold', cursor: 'pointer' },
  feed: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, padding: '20px 0' },
  createCard: { width: '90%', maxWidth: 420, background: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 15, border: '1px solid rgba(255,255,255,0.05)' },
  createHeader: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%', backgroundSize: 'cover', background: '#222', border: '1px solid #00f2fe' },
  boldText: { fontWeight: 'bold', fontSize: 14 },
  textarea: { width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none', minHeight: 60, resize: 'none' },
  createActions: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  mediaBtn: { background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: 10 },
  publishBtn: { background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 10, fontWeight: 'bold' },
  postCard: { width: '90%', maxWidth: 420, background: 'rgba(0,0,0,0.6)', borderRadius: 25, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
  postHeader: { display: 'flex', gap: 10, padding: 15, alignItems: 'center' },
  postImg: { width: '100%', display: 'block' },
  textPost: { padding: 40, textAlign: 'center', fontSize: 18 },
  listenBtn: { width: '100%', padding: 12, borderRadius: 15, background: 'rgba(0,242,254,0.05)', border: '1px solid #00f2fe', color: '#00f2fe', fontWeight: 'bold', cursor: 'pointer' },
  loading: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }
};
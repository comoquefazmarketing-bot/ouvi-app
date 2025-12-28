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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- ANIMAÇÃO DE RESSONÂNCIA (PARTÍCULAS TIPO AREIA) ---
  const startCymaticAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const numParticles = 1200; // Efeito de grãos de areia

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        originX: Math.random() * canvas.width,
        originY: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        color: Math.random() > 0.5 ? "#00f2fe" : "#0077ff"
      });
    }

    const draw = (t: number) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)"; // Rastro leve
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const frequency = t * 0.001;

      particles.forEach((p, i) => {
        // Equação de Chladni (Simulação de areia em placa vibratória)
        const n = 4 + Math.sin(frequency) * 2; 
        const m = 3 + Math.cos(frequency) * 2;
        const L = 300; // Tamanho da placa virtual

        const xNorm = (p.originX - centerX) / L;
        const yNorm = (p.originY - centerY) / L;

        // Vibração senoidal complexa
        const vibration = Math.sin(n * Math.PI * xNorm) * Math.sin(m * Math.PI * yNorm) +
                          Math.sin(m * Math.PI * xNorm) * Math.sin(n * Math.PI * yNorm);

        const targetX = p.originX + vibration * 50 * Math.sin(frequency);
        const targetY = p.originY + vibration * 50 * Math.cos(frequency);

        p.x += (targetX - p.x) * 0.05;
        p.y += (targetY - p.y) * 0.05;

        // Desenho do grão
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // REFLEXO (ÁGUA)
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(p.x, canvas.height - (p.y * 0.5), p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };
    animationFrameId.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    loadUserAndFeed();
    if (!userProfile && !checkingProfile) {
      startCymaticAnimation();
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [userProfile, checkingProfile, startCymaticAnimation]);

  async function loadUserAndFeed() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) setUserProfile(profile);
    }
    fetchPosts();
    setCheckingProfile(false);
  }

  async function fetchPosts() {
    const { data } = await supabase.from("posts").select("*, profiles(username, avatar_url)").order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoadingFeed(false);
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  async function handleSaveProfile() {
    const nick = tempNick.trim().toLowerCase();
    if (nick.length < 3) return alert("Nick muito curto!");
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    let url = null;
    if (avatarFile) {
      const name = `${session?.user.id}-${Date.now()}`;
      await supabase.storage.from("post-images").upload(`avatars/${name}`, avatarFile);
      url = supabase.storage.from("post-images").getPublicUrl(`avatars/${name}`).data.publicUrl;
    }

    const { error } = await supabase.from("profiles").insert([{ id: session?.user.id, username: nick, avatar_url: url }]);
    if (error) {
      alert("Nick já existe!");
      setIsSaving(false);
    } else {
      setUserProfile({ username: nick, avatar_url: url || "" });
    }
  }

  if (checkingProfile) return <div style={styles.loading}>Sintonizando...</div>;

  if (!userProfile) {
    return (
      <div style={styles.onboarding}>
        <canvas ref={canvasRef} style={styles.canvas} />
        <div style={styles.onboardingContent}>
          <h1 style={styles.onboardingTitle}>OUVI</h1>
          <p style={styles.onboardingSub}>Sua voz é sua marca.</p>

          <div onClick={() => avatarInputRef.current?.click()} style={{...styles.avatarBox, backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none'}}>
            {!avatarPreview && <span>📸</span>}
            <div style={styles.plus}>+</div>
          </div>
          <input type="file" ref={avatarInputRef} hidden onChange={handleAvatarChange} />

          <div style={styles.inputArea}>
            <span style={{color: '#00f2fe'}}>@</span>
            <input placeholder="nick_unico" style={styles.input} onChange={(e) => setTempNick(e.target.value)} />
          </div>

          <button onClick={handleSaveProfile} style={styles.btn} disabled={isSaving}>
            {isSaving ? "CRIANDO..." : "ENTRAR NA REDE"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <img src="/logo-dashboard.svg" style={{height: 18}} />
          <button onClick={() => supabase.auth.signOut().then(() => location.reload())} style={styles.logout}>SAIR</button>
        </div>
      </header>

      <main style={styles.feed}>
        <div style={styles.createCard}>
          <div style={styles.createHeader}>
            <div style={{...styles.avatarSmall, backgroundImage: `url(${userProfile.avatar_url})`}} />
            <span>O que você tem a dizer, {userProfile.username}?</span>
          </div>
          <textarea placeholder="No que está pensando?" style={styles.textarea} />
          <button style={styles.pubBtn}>Publicar</button>
        </div>

        {posts.map(p => (
          <article key={p.id} style={styles.card}>
            <div style={styles.cardUser}>
              <div style={{...styles.avatarSmall, backgroundImage: `url(${p.profiles?.avatar_url})`}} />
              <strong>@{p.profiles?.username || 'user'}</strong>
            </div>
            <div style={{padding: '0 15px 15px'}}>{p.content}</div>
            <button style={styles.listen} onClick={() => { setActivePostId(p.id); setOpenThread(true); }}>🎙️ OUVIR COMENTÁRIOS</button>
          </article>
        ))}
      </main>

      {activePostId && <AudioThreadDrawer postId={activePostId} open={openThread} onClose={() => setOpenThread(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  onboarding: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
  onboardingContent: { zIndex: 2, width: '100%', maxWidth: 320, textAlign: 'center', background: 'rgba(0,0,0,0.7)', padding: 30, borderRadius: 30, backdropFilter: 'blur(10px)', border: '1px solid #111' },
  onboardingTitle: { fontSize: 32, letterSpacing: 8, fontWeight: 900, color: '#fff', marginBottom: 5 },
  onboardingSub: { color: '#666', fontSize: 12, marginBottom: 30 },
  avatarBox: { width: 90, height: 90, borderRadius: '50%', background: '#050505', border: '2px solid #00f2fe', margin: '0 auto 25px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', backgroundSize: 'cover' },
  plus: { position: 'absolute', bottom: 0, right: 0, background: '#00f2fe', color: '#000', width: 25, height: 25, borderRadius: '50%', fontWeight: 'bold' },
  inputArea: { display: 'flex', alignItems: 'center', background: '#0a0a0a', border: '1px solid #222', padding: '12px 15px', borderRadius: 12, marginBottom: 15 },
  input: { background: 'none', border: 'none', color: '#fff', marginLeft: 10, outline: 'none', width: '100%' },
  btn: { width: '100%', padding: 15, borderRadius: 12, background: '#00f2fe', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  page: { background: '#000', minHeight: '100vh', color: '#fff' },
  header: { position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'center', zIndex: 10 },
  headerContent: { width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'space-between', padding: 15 },
  logout: { background: 'none', border: 'none', color: '#ff3040', fontSize: 10, fontWeight: 'bold' },
  feed: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, padding: '20px 0' },
  createCard: { width: '90%', maxWidth: 420, background: '#080808', padding: 15, borderRadius: 20, border: '1px solid #111' },
  createHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, fontSize: 13, fontWeight: 'bold' },
  avatarSmall: { width: 30, height: 30, borderRadius: '50%', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#222' },
  textarea: { width: '100%', background: 'none', border: 'none', color: '#fff', resize: 'none', outline: 'none', height: 60 },
  pubBtn: { background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 10, fontWeight: 'bold', float: 'right' },
  card: { width: '90%', maxWidth: 420, background: '#080808', borderRadius: 20, border: '1px solid #111' },
  cardUser: { display: 'flex', alignItems: 'center', gap: 10, padding: 15 },
  listen: { width: '90%', margin: '0 5% 15px', background: 'rgba(0,242,254,0.1)', border: '1px solid #00f2fe', color: '#00f2fe', padding: 12, borderRadius: 15, fontWeight: 'bold', fontSize: 11 },
  loading: { height: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: "center" }
};
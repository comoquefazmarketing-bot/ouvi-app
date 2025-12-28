"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import AudioThreadDrawer from "../../components/AudioThreadDrawer";

// Nome alterado para DashboardV5Page para forçar o Next.js a recompilar do zero
export default function DashboardV5Page() {
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- ANIMAÇÃO DE CONVERGÊNCIA CYMATIC (IDENTIDADE OUVI) ---
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
      const time = t * 0.0006;

      particles.forEach((p) => {
        const xNorm = (p.originX - centerX) / 280;
        const yNorm = (p.originY - centerY) / 280;
        const n = 5 + Math.sin(time) * 2;
        const m = 4 + Math.cos(time) * 2;
        const vib = Math.sin(n * xNorm) * Math.sin(m * yNorm) + Math.sin(m * xNorm) * Math.sin(n * yNorm);
        
        const destX = p.originX + vib * 50 * Math.cos(time);
        const destY = p.originY + vib * 50 * Math.sin(time);

        p.x += (destX - p.x) * p.speed;
        p.y += (destY - p.y) * p.speed;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.arc(p.x, canvas.height - (p.y * 0.4), p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };
    animationFrameId.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    loadUserAndFeed();
    startCymaticAnimation(); // Ativa a animação para ambos os estados
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [startCymaticAnimation]);

  async function loadUserAndFeed() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) setUserProfile(profile);
    }
    setCheckingProfile(false);
  }

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
      window.location.reload(); 
    }
  }

  if (checkingProfile) return <div style={styles.loading}>Sintonizando...</div>;

  return (
    <div style={styles.containerMain}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {!userProfile ? (
        <div style={styles.onboardingContent}>
          <h1 style={styles.title}>OUVI</h1>
          <p style={styles.subtitle}>Sua voz em ressonância.</p>

          <div onClick={() => avatarInputRef.current?.click()} style={{...styles.avatarBox, backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none'}}>
            {!avatarPreview && <span>📸</span>}
            <div style={styles.plus}>+</div>
          </div>
          <input type="file" ref={avatarInputRef} hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
          }} />

          <div style={styles.inputArea}>
            <span style={{color: '#00f2fe'}}>@</span>
            <input placeholder="nick_exclusivo" style={styles.input} onChange={(e) => setTempNick(e.target.value)} />
          </div>

          <button onClick={handleSaveProfile} style={styles.btn} disabled={isSaving}>
            {isSaving ? "CONFIGURANDO..." : "ENTRAR NA REDE"}
          </button>
        </div>
      ) : (
        <div style={styles.pageUI}>
          <header style={styles.header}>
            <div style={styles.headerContent}>
              <h2 style={{color: '#00f2fe', letterSpacing: 4, margin: 0}}>OUVI</h2>
              <button onClick={() => supabase.auth.signOut().then(() => location.reload())} style={styles.logout}>SAIR</button>
            </div>
          </header>
          <main style={styles.mainFeed}>
            <h2 style={{fontSize: 28, fontWeight: 900}}>Olá, @{userProfile.username}!</h2>
            <p style={{color: 'rgba(255,255,255,0.5)'}}>A experiência visual foi concluída e o feed está pronto.</p>
          </main>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  containerMain: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', color: '#fff' },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
  onboardingContent: { 
    zIndex: 2, width: '90%', maxWidth: 350, textAlign: 'center', 
    background: 'rgba(0,0,0,0.4)', padding: '45px 30px', borderRadius: 45, 
    backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', 
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)' 
  },
  title: { fontSize: 40, letterSpacing: 10, fontWeight: 900, color: '#fff', marginBottom: 5 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 35, letterSpacing: 1 },
  avatarBox: { width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid #00f2fe', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', backgroundSize: 'cover', backgroundPosition: 'center' },
  plus: { position: 'absolute', bottom: 5, right: 5, background: '#00f2fe', color: '#000', width: 28, height: 28, borderRadius: '50%', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' },
  inputArea: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: 20, marginBottom: 25 },
  input: { background: 'none', border: 'none', color: '#fff', marginLeft: 10, outline: 'none', width: '100%', fontSize: 16 },
  btn: { width: '100%', padding: 18, borderRadius: 20, background: '#00f2fe', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: 15, letterSpacing: 1 },
  pageUI: { zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' },
  header: { background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' },
  headerContent: { width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'space-between', padding: '20px', alignItems: 'center' },
  logout: { background: 'none', border: 'none', color: '#ff3040', fontWeight: 'bold', cursor: 'pointer' },
  mainFeed: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' },
  loading: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }
};
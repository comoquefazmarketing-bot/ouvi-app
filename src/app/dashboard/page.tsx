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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- ANIMAÇÃO DE CONVERGÊNCIA CYMATIC (PARTÍCULAS DE AREIA) ---
  const startCymaticAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const numParticles = 2000; 

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(canvas.width, canvas.height); // Começam longe
      particles.push({
        x: canvas.width / 2 + Math.cos(angle) * dist,
        y: canvas.height / 2 + Math.sin(angle) * dist,
        targetX: Math.random() * canvas.width,
        targetY: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        color: i % 3 === 0 ? "#00f2fe" : "#0077ff",
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
        // Padrão de Chladni para a forma central
        const xNorm = (p.targetX - centerX) / 280;
        const yNorm = (p.targetY - centerY) / 280;
        const n = 5 + Math.sin(time) * 2;
        const m = 4 + Math.cos(time) * 2;
        const vib = Math.sin(n * xNorm) * Math.sin(m * yNorm) + Math.sin(m * xNorm) * Math.sin(n * yNorm);
        
        const destX = p.targetX + vib * 50 * Math.cos(time);
        const destY = p.targetY + vib * 50 * Math.sin(time);

        p.x += (destX - p.x) * p.speed;
        p.y += (destY - p.y) * p.speed;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Reflexo Aquático
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(p.x, canvas.height - (p.y * 0.4), p.size, 0, Math.PI * 2);
        ctx.fill();
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
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [userProfile, checkingProfile, startCymaticAnimation]);

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
      alert("Erro ao salvar perfil.");
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
        {/* Card central agora mais transparente e moderno */}
        <div style={styles.onboardingContent}>
          <h1 style={styles.title}>OUVI</h1>
          <p style={styles.subtitle}>Sua voz em ressonância.</p>

          <div onClick={() => avatarInputRef.current?.click()} style={{...styles.avatarBox, backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none'}}>
            {!avatarPreview && <span style={{fontSize: 24}}>📸</span>}
            <div style={styles.plus}>+</div>
          </div>
          <input type="file" ref={avatarInputRef} hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
          }} />

          <div style={styles.inputArea}>
            <span style={{color: '#00f2fe', fontWeight: 'bold'}}>@</span>
            <input placeholder="seu_nick" style={styles.input} onChange={(e) => setTempNick(e.target.value)} />
          </div>

          <button onClick={handleSaveProfile} style={styles.btn} disabled={isSaving}>
            {isSaving ? "CRIANDO PERFIL..." : "ENTRAR NA REDE"}
          </button>
        </div>
      </div>
    );
  }

  // Dashboard simplificado para teste após onboarding
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h2 style={{fontSize: 18, color: '#00f2fe'}}>OUVI</h2>
          <button onClick={() => supabase.auth.signOut().then(() => location.reload())} style={styles.logout}>SAIR</button>
        </div>
      </header>
      <main style={{textAlign: 'center', padding: 50}}>
        <h1>Olá, @{userProfile.username}</h1>
        <p>Você está conectado à rede.</p>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  onboarding: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
  onboardingContent: { 
    zIndex: 2, 
    width: '90%', 
    maxWidth: 360, 
    textAlign: 'center', 
    // MUDANÇA AQUI: Background mais transparente com blur (vidro)
    background: 'rgba(0, 0, 0, 0.4)', 
    padding: '40px 30px', 
    borderRadius: 40, 
    backdropFilter: 'blur(15px)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)' 
  },
  title: { fontSize: 40, letterSpacing: 12, fontWeight: 900, color: '#fff', marginBottom: 5 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 35, letterSpacing: 1 },
  avatarBox: { width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid #00f2fe', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', backgroundSize: 'cover', backgroundPosition: 'center' },
  plus: { position: 'absolute', bottom: 5, right: 5, background: '#00f2fe', color: '#000', width: 28, height: 28, borderRadius: '50%', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' },
  inputArea: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: 20, marginBottom: 25 },
  input: { background: 'none', border: 'none', color: '#fff', marginLeft: 10, outline: 'none', width: '100%', fontSize: 16 },
  btn: { width: '100%', padding: 18, borderRadius: 20, background: '#00f2fe', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: 15, letterSpacing: 1 },
  page: { background: '#000', minHeight: '100vh', color: '#fff' },
  header: { borderBottom: '1px solid #111', display: 'flex', justifyContent: 'center' },
  headerContent: { width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  logout: { background: 'none', border: 'none', color: '#ff3040', fontWeight: 'bold', cursor: 'pointer' },
  loading: { height: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};
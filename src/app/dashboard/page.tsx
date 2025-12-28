"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import AudioThreadDrawer from "../../components/AudioThreadDrawer";

export default function DashboardPage() {
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

  // Canvas Ref para a animação
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    loadUserAndFeed();
    // Inicia a animação se o onboarding estiver ativo
    if (!userProfile && !checkingProfile) {
      startCanvasAnimation();
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [userProfile, checkingProfile]); // Depende do userProfile e checkingProfile para iniciar/parar animação

  // --- Funções de Animação do Canvas ---
  const startCanvasAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DURATION = 3000; // Duração de um ciclo completo da onda
    const colors = ['#00f2fe', '#0077ff', '#000']; // Cores para o efeito

    canvas.width = window.innerWidth * 0.8;
    canvas.height = canvas.width * 1.2; // Para incluir o reflexo

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.4; // Ponto central para a onda (acima do reflexo)

      const time = (performance.now() % DURATION) / DURATION; // 0 a 1
      
      // Desenha a onda principal
      for (let i = 0; i < 3; i++) {
        const radius = (canvas.width * 0.2 + (time * canvas.width * 0.3) + i * 20) % (canvas.width * 0.5);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 3 - (radius / (canvas.width * 0.5)) * 2; // Linhas mais finas conforme se expande
        ctx.globalAlpha = 1 - (radius / (canvas.width * 0.5)); // Desaparece conforme se expande
        ctx.stroke();
      }

      // Desenha o reflexo (invertido e atenuado)
      ctx.save();
      ctx.scale(1, -1); // Inverte no eixo Y
      ctx.translate(0, -canvas.height * 0.8); // Move para a posição do reflexo
      ctx.globalAlpha = 0.3; // Reflexo mais fraco

      for (let i = 0; i < 3; i++) {
        const radius = (canvas.width * 0.2 + (time * canvas.width * 0.3) + i * 20) % (canvas.width * 0.5);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 3 - (radius / (canvas.width * 0.5)) * 2;
        ctx.globalAlpha = 0.3 - (radius / (canvas.width * 0.5)) * 0.3;
        ctx.stroke();
      }
      ctx.restore();

      animationFrameId.current = requestAnimationFrame(draw);
    };
    animationFrameId.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (!userProfile && !checkingProfile) {
      startCanvasAnimation();
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [userProfile, checkingProfile, startCanvasAnimation]);


  // --- Funções de Carregamento e Salvar ---
  async function loadUserAndFeed() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        setUserProfile(profile);
      }
    }
    setCheckingProfile(false);
    fetchPosts();
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoadingFeed(false);
  }

  // Lidar com a seleção da foto
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  async function handleSaveCompleteProfile() {
    const nickClean = tempNick.trim().toLowerCase();
    if (nickClean.length < 3) return alert("O nick deve ter pelo menos 3 caracteres.");
    if (nickClean.includes(" ")) return alert("O nick não pode conter espaços.");
    if (/[^a-z0-9._]/.test(nickClean)) return alert("Use apenas letras, números, pontos ou underlines.");

    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      let publicUrl = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("post-images").upload(filePath, avatarFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{ 
          id: session.user.id, 
          username: nickClean, 
          avatar_url: publicUrl,
          updated_at: new Date()
        }]);

      if (profileError) {
        if (profileError.code === '23505') throw new Error("Este @nick já está em uso.");
        throw profileError;
      }

      setUserProfile({ username: nickClean, avatar_url: publicUrl });
      alert("Perfil configurado com sucesso! Bem-vindo ao OUVI.");
      
    } catch (err: any) {
      alert(err.message);
      setIsSaving(false);
    }
  }

  // --- RENDERIZAÇÃO CONDICIONAL ---

  // 1. Enquanto verifica se tem perfil...
  if (checkingProfile) return <div style={styles.loading}>Sintonizando...</div>;

  // 2. TELA DE ESCOLHA DE NICK E FOTO (COM ANIMAÇÃO OUVI)
  if (!userProfile) {
    return (
      <div style={styles.onboarding}>
        <canvas ref={canvasRef} style={styles.onboardingCanvas}></canvas>
        <div style={styles.onboardingContent}>
          <h1 style={{fontSize: 24, fontWeight: 800, marginBottom: 5}}>Bem-vindo ao OUVI</h1>
          <p style={{color: '#aaa', fontSize: 13, marginBottom: 30}}>Onde sua voz vira conexão.</p>

          {/* Círculo de Foto */}
          <div 
            onClick={() => avatarInputRef.current?.click()} 
            style={{
              ...styles.avatarUpload, 
              backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none' 
            }}
          >
            {!avatarPreview && <span style={{fontSize: 30, color: '#00f2fe'}}>📸</span>}
            <div style={styles.plusBadge}>+</div>
          </div>
          <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarChange} />

          {/* Campo de Nick */}
          <div style={styles.inputWrapper}>
            <span style={styles.atSign}>@</span>
            <input 
              placeholder="seu_nick_exclusivo" 
              style={styles.nickInput}
              value={tempNick}
              onChange={(e) => setTempNick(e.target.value)}
              autoFocus
            />
          </div>

          <button onClick={handleSaveCompleteProfile} style={styles.onboardingBtn} disabled={isSaving}>
            {isSaving ? "Finalizando..." : "Começar a Ouvir"}
          </button>
        </div>
      </div>
    );
  }

  // 3. DASHBOARD (SÓ APARECE SE TIVER NICK E PERFIL)
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <img src="/logo-dashboard.svg" alt="OUVI" style={styles.logoImg} />
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} style={styles.logoutBtn}>SAIR</button>
        </div>
      </header>

      <main style={styles.feed}>
        {/* Card de Criação Personalizado com o Nick e Avatar Real */}
        <div style={styles.createCard}>
          <div style={styles.createHeader}>
            <div style={{...styles.avatarSmall, backgroundImage: userProfile.avatar_url ? `url(${userProfile.avatar_url})` : 'linear-gradient(45deg, #00f2fe, #000)'}} />
            <span style={styles.username}>No que está pensando, {userProfile.username}?</span>
          </div>
          <textarea 
            placeholder="Compartilhe sua vibração..." 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={styles.createInput}
          />
          <div style={styles.createActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn}>🖼️ Foto</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" />
            <button style={styles.publishBtn}>Publicar</button>
          </div>
        </div>

        {/* Feed de Posts (com avatares dinâmicos) */}
        {posts.map((post) => (
          <article key={post.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{...styles.avatarPlaceholder, backgroundImage: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url})` : 'linear-gradient(45deg,#111,#222)'}} />
              <div>
                <div style={styles.username}>@{post.profiles?.username || post.user_email?.split('@')[0]}</div>
                <div style={styles.meta}>{formatTime(post.created_at)}</div>
              </div>
            </div>
            {post.image_url ? (
              <img src={post.image_url} alt="" style={styles.postImg} />
            ) : (
              <div style={styles.textPostContainer}>{post.content}</div>
            )}
            <div style={styles.actions}>
              <button style={styles.listenBtn} onClick={() => { setActivePostId(post.id); setOpenThread(true); }}>
                🎙️ OUVIR COMENTÁRIOS
              </button>
            </div>
            {post.image_url && (
              <div style={styles.caption}>
                <strong>@{post.profiles?.username || post.user_email?.split('@')[0]}</strong> {post.content}
              </div>
            )}
          </article>
        ))}
      </main>

      {activePostId && (
        <AudioThreadDrawer postId={activePostId} open={openThread} onClose={() => setOpenThread(false)} />
      )}
    </div>
  );
}

// Função para formatar o tempo (mover para fora do componente se preferir)
const formatTime = (date: string) => {
  const diff = new Date().getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return new Date(date).toLocaleDateString();
};

const styles: Record<string, React.CSSProperties> = {
  // --- Novos Estilos para o Onboarding Animado ---
  onboarding: { 
    height: '100vh', 
    background: '#000', 
    color: '#fff', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden',
    position: 'relative'
  },
  onboardingCanvas: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 0,
    maxWidth: '100vw', // Garante que não ultrapasse a tela
    maxHeight: '100vh', // Garante que não ultrapasse a tela
    opacity: 0.2
  },
  onboardingContent: { 
    width: '100%', 
    maxWidth: 340, 
    textAlign: 'center', 
    padding: 20, 
    zIndex: 1, // Fica acima do canvas
    background: 'rgba(0,0,0,0.6)', // Fundo semitransparente para destacar o conteúdo
    borderRadius: 20,
    boxShadow: '0 0 30px rgba(0,242,254,0.2)'
  },
  // Estilos da foto
  avatarUpload: {
    width: 100, height: 100, borderRadius: '50%', background: '#111',
    border: '2px dashed #00f2fe', margin: '0 auto 25px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    position: 'relative', backgroundSize: 'cover', backgroundPosition: 'center',
    boxShadow: '0 0 15px rgba(0,242,254,0.4)' // Brilho neon na borda
  },
  plusBadge: {
    position: 'absolute', bottom: 0, right: 0, background: '#00f2fe',
    width: 28, height: 28, borderRadius: '50%', color: '#000', fontSize: 20,
    fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: '1', border: '2px solid #000'
  },
  // Estilos do Nick
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 20 },
  atSign: { position: 'absolute', left: 15, color: '#00f2fe', fontWeight: 'bold', fontSize: 18 },
  nickInput: { 
    width: '100%', padding: '15px 15px 15px 38px', borderRadius: 12, 
    border: '1px solid #00f2fe', background: '#0a0a0a', color: '#fff', 
    fontSize: 16, outline: 'none', boxShadow: '0 0 10px rgba(0,242,254,0.2)' 
  },
  onboardingBtn: { 
    width: '100%', padding: 15, borderRadius: 12, background: '#00f2fe', 
    color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', 
    fontSize: 16, transition: 'background 0.3s ease',
    '&:hover': { background: '#00d2eb' }
  },

  // --- Estilos do Dashboard Existentes ---
  page: { background: "#000", minHeight: "100vh", color: "#fff", fontFamily: 'sans-serif' },
  header: { position: "sticky", top: 0, zIndex: 10, background: "rgba(0,0,0,0.9)", borderBottom: "1px solid #111", display: "flex", justifyContent: "center" },
  headerContent: { width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px" },
  logoImg: { height: 20 },
  logoutBtn: { background: "none", border: "none", color: "#ff3040", fontSize: 11, fontWeight: "bold", cursor: "pointer" },
  feed: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "15px 0" },
  createCard: { width: "95%", maxWidth: 420, background: "#080808", borderRadius: 20, border: "1px solid #151515", padding: 15 },
  createHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarSmall: { width: 30, height: 30, borderRadius: '50%', backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #00f2fe' },
  username: { fontWeight: "bold", fontSize: 14 },
  createInput: { width: "100%", background: "none", border: "none", color: "#fff", outline: "none", fontSize: 15, minHeight: 60, resize: 'none' },
  createActions: { display: "flex", justifyContent: "space-between", marginTop: 10 },
  mediaBtn: { background: "#111", color: "#fff", border: "1px solid #222", padding: "8px 15px", borderRadius: 10, fontSize: 12, cursor: 'pointer' },
  publishBtn: { background: "#fff", color: "#000", border: "none", padding: "8px 20px", borderRadius: 10, fontWeight: "bold", fontSize: 12, cursor: 'pointer' },
  card: { width: "95%", maxWidth: 420, background: "#080808", borderRadius: 24, border: "1px solid #151515", overflow: "hidden" },
  cardHeader: { display: 'flex', gap: 10, padding: 15, alignItems: 'center' },
  avatarPlaceholder: { width: 30, height: 30, borderRadius: '50%', backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #222' },
  meta: { fontSize: 12, opacity: 0.4 },
  postImg: { width: "100%", height: "auto", display: "block" },
  textPostContainer: { padding: "20px 16px", fontSize: 18, fontWeight: 300, color: "#eee", textAlign: "center", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" },
  actions: { padding: '0 15px 15px' },
  listenBtn: { width: "100%", background: "rgba(0,242,254,0.1)", border: "1px solid #00f2fe", color: "#00f2fe", borderRadius: 15, fontWeight: "bold", fontSize: 11, padding: 12, cursor: "pointer" },
  caption: { padding: "0 16px 16px", fontSize: 14, lineHeight: 1.5, color: "#ccc" },
  loading: { height: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }
};
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

/**
 * -----------------------------------------------------------------------
 * PROJETO: OUVI
 * DESENVOLVEDOR: Felipe Makarios
 * VERSÃO: 3.0.0 - FULL SYSTEM (No Abbreviations)
 * DATA: 2025-12-29
 * -----------------------------------------------------------------------
 * DESCRIÇÃO: 
 * Sistema completo de rede social com suporte a multimídia (Foto/Vídeo),
 * interações por voz e comentários em tempo real.
 * -----------------------------------------------------------------------
 */

// --- TIPAGEM DOS COMPONENTES ---
type PainelAcoesProps = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

// --- COMPONENTE: PAINEL DE INTERAÇÃO (THREAD DE COMENTÁRIOS E VOZ) ---
function PainelAcoes({ postId, open, onClose }: PainelAcoesProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [textComment, setTextComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userSession, setUserSession] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_RECORDING_TIME = 30;

  // Busca dados iniciais e configura o Realtime
  useEffect(() => {
    if (open && postId) {
      const setup = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUserSession(session?.user || null);
        await fetchComments();
      };
      setup();

      // Escuta novos comentários em tempo real (Supabase Realtime)
      const channel = supabase.channel(`comments_room_${postId}`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'audio_comments', filter: `post_id=eq.${postId}` }, 
            () => fetchComments())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [open, postId]);

  // Gerenciador do cronômetro de gravação
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  async function fetchComments() {
    const { data, error } = await supabase
      .from("audio_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!error && data) setComments(data);
  }

  async function handleSendComment(audioUrl: string | null = null) {
    if (!textComment.trim() && !audioUrl) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Sessão expirada. Entre novamente.");

    setIsSending(true);
    const username = session.user.email?.split('@')[0] || "usuario_ouvi";

    const { error } = await supabase.from("audio_comments").insert([{
      post_id: postId,
      content: textComment.trim() || null,
      audio_url: audioUrl,
      user_id: session.user.id,
      username: username
    }]);

    if (!error) {
      setTextComment("");
      fetchComments();
    }
    setIsSending(false);
  }

  // LÓGICA DE GRAVAÇÃO DE VOZ
  async function startRecording(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          await uploadAudioComment(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Permissão de microfone negada.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  async function uploadAudioComment(blob: Blob) {
    const fileName = `voice_${Date.now()}.webm`;
    // Enviando para a pasta 'audios' conforme seu print do Supabase
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(`audios/${fileName}`, blob);

    if (uploadError) {
      console.error("Erro no Storage:", uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("post-images")
      .getPublicUrl(`audios/${fileName}`);

    await handleSendComment(publicUrl);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            style={styles.overlay} 
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            style={styles.sheet}
          >
            <div style={styles.dragHandle} />
            <div style={styles.sheetHeader}>
              <h3>Conversa</h3>
              <button onClick={onClose} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.commentsList}>
              {comments.map((comment) => (
                <div key={comment.id} style={styles.commentItem}>
                  <span style={styles.commentUser}>@{comment.username}</span>
                  {comment.content && <p style={styles.commentContent}>{comment.content}</p>}
                  {comment.audio_url && (
                    <audio 
                      src={comment.audio_url} 
                      controls 
                      style={styles.audioPlayer} 
                    />
                  )}
                </div>
              ))}
              {comments.length === 0 && <p style={styles.emptyText}>Ninguém falou nada ainda...</p>}
            </div>

            <div style={styles.inputBarArea}>
              <div style={styles.inputWrapper}>
                <input 
                  value={textComment} 
                  onChange={(e) => setTextComment(e.target.value)} 
                  placeholder="Escreva sua resposta..." 
                  style={styles.textInputField}
                />
                <button 
                  onClick={() => handleSendComment()} 
                  disabled={isSending} 
                  style={styles.sendTextBtn}
                >
                  {isSending ? "..." : "➤"}
                </button>
              </div>
              
              <div style={styles.voiceActionArea}>
                <div style={styles.timerDisplay}>
                  {isRecording ? `${recordingTime.toFixed(1)}s` : "Segure para falar"}
                </div>
                <motion.button 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    ...styles.mainMicBtn,
                    backgroundColor: isRecording ? "#ff4b2b" : "#1a1a1a"
                  }}
                >
                  🎙️
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- COMPONENTE PRINCIPAL: DASHBOARD ---
export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    
    // Atualização em tempo real do Feed
    const feedChannel = supabase.channel('public_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();

    return () => { supabase.removeChannel(feedChannel); };
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setPosts(data);
  }

  async function handleCreatePost() {
    if (!newPostContent.trim() && !selectedFile) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Você precisa estar logado!");

    setIsPublishing(true);
    let imageUrl = null;
    let videoUrl = null;

    if (selectedFile) {
      const isVideo = selectedFile.type.startsWith('video/');
      const folder = isVideo ? 'post-videos' : 'post-photos';
      const fileName = `${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(`${folder}/${fileName}`, selectedFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("post-images")
          .getPublicUrl(`${folder}/${fileName}`);
        
        if (isVideo) videoUrl = publicUrl;
        else imageUrl = publicUrl;
      } else {
        console.error("Erro no upload de mídia:", uploadError.message);
      }
    }

    const { error: insertError } = await supabase.from("posts").insert([{
      content: newPostContent,
      image_url: imageUrl,
      video_url: videoUrl,
      user_id: session.user.id,
      user_email: session.user.email
    }]);

    if (!insertError) {
      setNewPostContent("");
      setSelectedFile(null);
      fetchPosts();
    } else {
      alert("Erro ao publicar: " + insertError.message);
    }
    setIsPublishing(false);
  }

  return (
    <div style={styles.pageLayout}>
      {/* CABEÇALHO SUPERIOR */}
      <header style={styles.topHeader}>
        <div style={styles.logoBranding}>OUVI</div>
        <div style={styles.headerIcons}>
          <button onClick={() => supabase.auth.signOut()} style={styles.logoutAction}>SAIR</button>
        </div>
      </header>

      <main style={styles.contentContainer}>
        {/* COMPONENTE DE CRIAÇÃO DE POST */}
        <section style={styles.creationSection}>
          <textarea 
            style={styles.mainTextArea}
            placeholder="O que você está ouvindo e vendo agora?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          
          {selectedFile && (
            <div style={styles.fileSelectedBadge}>
              {selectedFile.type.startsWith('video/') ? "📹 Vídeo" : "🖼️ Foto"} selecionada: {selectedFile.name}
              <button onClick={() => setSelectedFile(null)} style={styles.removeFileBtn}>✕</button>
            </div>
          )}

          <div style={styles.creationBar}>
            <button 
              style={styles.mediaSelectBtn} 
              onClick={() => fileInputRef.current?.click()}
            >
              Mídia (Foto/Vídeo)
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept="image/*,video/*" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button 
              style={styles.mainSubmitBtn} 
              onClick={handleCreatePost}
              disabled={isPublishing}
            >
              {isPublishing ? "PUBLICANDO..." : "PUBLICAR"}
            </button>
          </div>
        </section>

        {/* LISTA DE POSTAGENS (FEED) */}
        <div style={styles.feedList}>
          {posts.map((post) => (
            <article key={post.id} style={styles.postCard}>
              <div style={styles.postUserHeader}>
                <div style={styles.userAvatarSmall} />
                <span style={styles.postAuthorName}>@{post.user_email?.split('@')[0]}</span>
              </div>

              {/* RENDERIZAÇÃO DE MÍDIA: VÍDEO OU IMAGEM */}
              <div style={styles.postMediaWrapper}>
                {post.video_url ? (
                  <video src={post.video_url} controls style={styles.postMedia} />
                ) : post.image_url && (
                  <img src={post.image_url} alt="Post media" style={styles.postMedia} />
                )}
              </div>

              <div style={styles.postContentBody}>
                <p>{post.content}</p>
              </div>

              <div style={styles.postInteractions}>
                <button 
                  style={styles.listenPostBtn} 
                  onClick={() => {
                    setActivePostId(post.id);
                    setIsModalOpen(true);
                  }}
                >
                  OUVIR CONVERSA
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <nav style={styles.bottomNavigationBar}>
        <button style={styles.navIcon}>🏠</button>
        <button style={styles.navIcon}>🔍</button>
        <button 
          style={styles.navIconPlus}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          +
        </button>
        <button style={styles.navIcon}>🔔</button>
        <button style={styles.navIcon}>👤</button>
      </nav>

      {/* PAINEL LATERAL/INFERIOR (THREADS) */}
      <PainelAcoes 
        postId={activePostId || ""} 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

// --- ESTILIZAÇÃO GIGANTE E COMPLETA (CSS-IN-JS) ---
const styles: Record<string, React.CSSProperties> = {
  pageLayout: {
    backgroundColor: "#000",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  topHeader: {
    position: "fixed",
    top: 0,
    width: "100%",
    height: "60px",
    backgroundColor: "rgba(0,0,0,0.9)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    zIndex: 1000,
    borderBottom: "1px solid #111"
  },
  logoBranding: {
    fontSize: "22px",
    fontWeight: "900",
    letterSpacing: "3px",
    color: "#00f2fe"
  },
  logoutAction: {
    background: "none",
    border: "none",
    color: "#444",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  contentContainer: {
    paddingTop: "80px",
    paddingBottom: "100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto"
  },
  creationSection: {
    width: "92%",
    backgroundColor: "#080808",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #151515",
    marginBottom: "30px"
  },
  mainTextArea: {
    width: "100%",
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    outline: "none",
    resize: "none",
    minHeight: "80px"
  },
  creationBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "15px",
    borderTop: "1px solid #1a1a1a",
    paddingTop: "15px"
  },
  mediaSelectBtn: {
    background: "#111",
    border: "none",
    color: "#aaa",
    padding: "10px 15px",
    borderRadius: "12px",
    fontSize: "14px",
    cursor: "pointer"
  },
  mainSubmitBtn: {
    background: "#00f2fe",
    color: "#000",
    border: "none",
    padding: "10px 25px",
    borderRadius: "25px",
    fontWeight: "900",
    cursor: "pointer"
  },
  fileSelectedBadge: {
    backgroundColor: "#111",
    padding: "10px",
    borderRadius: "10px",
    fontSize: "12px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    color: "#00f2fe"
  },
  removeFileBtn: {
    background: "none",
    border: "none",
    color: "#ff4b2b",
    cursor: "pointer"
  },
  feedList: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "40px"
  },
  postCard: {
    width: "100%",
    borderBottom: "1px solid #111",
    paddingBottom: "20px"
  },
  postUserHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 15px"
  },
  userAvatarSmall: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    backgroundColor: "#222"
  },
  postAuthorName: {
    fontWeight: "bold",
    color: "#00f2fe"
  },
  postMediaWrapper: {
    width: "100%",
    backgroundColor: "#050505"
  },
  postMedia: {
    width: "100%",
    maxHeight: "600px",
    objectFit: "cover",
    borderRadius: "15px"
  },
  postContentBody: {
    padding: "15px",
    fontSize: "16px",
    lineHeight: "1.5"
  },
  postInteractions: {
    padding: "0 15px"
  },
  listenPostBtn: {
    width: "100%",
    background: "none",
    border: "1px solid #00f2fe",
    color: "#00f2fe",
    padding: "15px",
    borderRadius: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s"
  },
  bottomNavigationBar: {
    position: "fixed",
    bottom: 0,
    width: "100%",
    height: "70px",
    backgroundColor: "#000",
    borderTop: "1px solid #111",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 1000
  },
  navIcon: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#fff",
    cursor: "pointer"
  },
  navIconPlus: {
    backgroundColor: "#fff",
    color: "#000",
    width: "45px",
    height: "45px",
    borderRadius: "14px",
    fontSize: "28px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  // ESTILOS DO PAINEL DE AÇÕES (BOTTOM SHEET)
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 2000
  },
  sheet: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "550px",
    height: "85vh",
    backgroundColor: "#050505",
    borderRadius: "30px 30px 0 0",
    zIndex: 2001,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -10px 40px rgba(0,0,0,0.5)"
  },
  dragHandle: {
    width: "40px",
    height: "5px",
    backgroundColor: "#333",
    borderRadius: "10px",
    margin: "15px auto"
  },
  sheetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 25px 15px",
    borderBottom: "1px solid #111"
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: "20px"
  },
  commentsList: {
    flex: 1,
    overflowY: "auto",
    padding: "20px"
  },
  commentItem: {
    marginBottom: "25px",
    borderLeft: "2px solid #111",
    paddingLeft: "15px"
  },
  commentUser: {
    fontSize: "12px",
    color: "#00f2fe",
    fontWeight: "bold"
  },
  commentContent: {
    margin: "5px 0",
    fontSize: "15px"
  },
  audioPlayer: {
    width: "100%",
    height: "35px",
    marginTop: "10px"
  },
  inputBarArea: {
    padding: "25px",
    backgroundColor: "#080808",
    borderTop: "1px solid #151515"
  },
  inputWrapper: {
    display: "flex",
    gap: "10px",
    backgroundColor: "#111",
    padding: "12px 20px",
    borderRadius: "30px",
    marginBottom: "20px"
  },
  textInputField: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#fff",
    outline: "none"
  },
  sendTextBtn: {
    background: "none",
    border: "none",
    color: "#00f2fe",
    fontSize: "20px",
    cursor: "pointer"
  },
  voiceActionArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px"
  },
  mainMicBtn: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    border: "none",
    fontSize: "30px",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(0,242,254,0.1)"
  },
  timerDisplay: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  emptyText: {
    textAlign: "center",
    color: "#333",
    marginTop: "50px"
  }
};
"use client";

import { useEffect, useRef, useState } from "react";

import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  audio_url: string | null;
  user_id: string | null;
  user_email: string | null;
};

type FileState = File | null;

type AudioState = Blob | null;

type UserState = {
  id: string;
  email: string | null;
  user_metadata?: { full_name?: string };
} | null;

export default function Dashboard() {
  const [user, setUser] = useState<UserState>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<FileState>(null);
  const [audioBlob, setAudioBlob] = useState<AudioState>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    supabaseConfigError
  );
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as UserState);
      }
    });
    fetchPosts();
    return () => {
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }
    };
  }, []);

  async function fetchPosts() {
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Não foi possível carregar os posts.");
      return;
    }

    if (data) setPosts(data as Post[]);
  }

  // FUNÇÃO DE GRAVAÇÃO REAL
  async function startRecording() {
    setErrorMessage(null);
    if (!supabase) {
      setErrorMessage(
        supabaseConfigError ?? "Supabase não configurado para gravação."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      const chunks: BlobPart[] = [];
      mediaRecorder.current.ondataavailable = (event) => chunks.push(event.data);
      mediaRecorder.current.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: "audio/webm;codecs=opus" }));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);

      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }
      recordingTimeout.current = setTimeout(() => {
        if (mediaRecorder.current?.state !== "inactive") {
          mediaRecorder.current?.stop();
        }
        setRecording(false);
      }, 60000);
    } catch (error) {
      setErrorMessage("Precisamos do microfone para ouvir você.");
    }
  }

  function stopRecording() {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.stop();
    setRecording(false);
  }

  async function uploadAudio(blob: Blob, postId: string) {
    if (!supabase) {
      throw new Error(
        supabaseConfigError ?? "Supabase não configurado para upload."
      );
    }

    if (!user) {
      throw new Error("Você precisa estar logado para enviar áudio.");
    }

    const fileName = `${crypto.randomUUID()}.webm`;
    const filePath = `${user.id}/${postId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("audios")
      .upload(filePath, blob, {
        contentType: "audio/webm;codecs=opus",
      });

    if (uploadError) {
      throw new Error("Falha ao enviar o áudio.");
    }

    const { data } = supabase.storage.from("audios").getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handlePost() {
    if (!content && !file && !audioBlob) return;
    if (!supabase) {
      setErrorMessage(
        supabaseConfigError ?? "Supabase não configurado para postagem."
      );
      return;
    }
    if (!user) {
      setErrorMessage("Você precisa estar logado para publicar.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    let imageUrl = null;
    let audioUrl = null;

    if (file) {
      const fileName = `${Date.now()}_img_${file.name}`;
      const { error: imageError } = await supabase.storage
        .from("posts")
        .upload(fileName, file);

      if (imageError) {
        setErrorMessage("Erro ao enviar imagem.");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    if (audioBlob) {
      try {
        audioUrl = await uploadAudio(audioBlob, "feed");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao enviar áudio."
        );
        setLoading(false);
        return;
      }
    }

    const { error: insertError } = await supabase.from("posts").insert([
      {
        content,
        image_url: imageUrl,
        audio_url: audioUrl,
        user_id: user.id,
        user_email: user.user_metadata?.full_name || user.email,
      },
    ]);

    if (insertError) {
      setErrorMessage("Erro ao salvar o post.");
      setLoading(false);
      return;
    }

    setContent("");
    setFile(null);
    setAudioBlob(null);
    fetchPosts();
    setLoading(false);
  }

  if (!user) return <div style={{ background: "#000", height: "100vh" }} />;

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        color: "#fff",
        paddingBottom: "100px",
      }}
    >
      <header
        style={{
          padding: "15px",
          borderBottom: "1px solid #111",
          textAlign: "center",
        }}
      >
        <h1 style={{ letterSpacing: "5px" }}>OUVI</h1>
      </header>

      <main style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* ÁREA DE POSTAGEM REAL */}
        <div
          style={{
            background: "#0A0A0A",
            padding: "20px",
            margin: "15px",
            borderRadius: "20px",
            border: "1px solid #151515",
          }}
        >
          <textarea
            placeholder="Legenda do seu momento..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "#fff",
              outline: "none",
              fontSize: "16px",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "15px",
              alignItems: "center",
            }}
          >
            <label style={{ cursor: "pointer", fontSize: "20px" }}>
              🖼️{" "}
              <input
                type="file"
                hidden
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              style={{
                background: recording ? "red" : "#222",
                border: "none",
                color: "#fff",
                padding: "8px 15px",
                borderRadius: "15px",
                fontSize: "12px",
              }}
            >
              {recording ? "GRAVANDO..." : "🎙️ SEGURE P/ GRAVAR"}
            </button>

            {file && (
              <span style={{ fontSize: "10px", color: "#0f0" }}>IMAGEM OK</span>
            )}
            {audioBlob && (
              <span style={{ fontSize: "10px", color: "#0f0" }}>ÁUDIO OK</span>
            )}
          </div>

          {errorMessage && (
            <p style={{ fontSize: "10px", color: "#f87171" }}>{errorMessage}</p>
          )}

          <button
            onClick={handlePost}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "15px",
              padding: "12px",
              borderRadius: "15px",
              background: "#fff",
              color: "#000",
              fontWeight: "bold",
            }}
          >
            {loading ? "ENVIANDO..." : "PUBLICAR NO FEED"}
          </button>
        </div>

        {/* FEED COM MÍDIA REAL */}
        {posts.map((post) => (
          <article
            key={post.id}
            style={{ borderBottom: "1px solid #111", marginBottom: "20px" }}
          >
            <div
              style={{
                padding: "10px 15px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {post.user_email}
            </div>

            {post.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image_url}
                style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
                alt="Conteúdo"
              />
            )}

            {post.audio_url && (
              <div style={{ padding: "15px" }}>
                <audio controls src={post.audio_url} style={{ width: "100%" }} />
              </div>
            )}

            <div style={{ padding: "15px" }}>
              <p style={{ margin: 0 }}>{post.content}</p>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}

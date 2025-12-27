"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Post } from "@/types/post";
import { PostHeader } from "@/components/PostHeader";
import { PostMedia } from "@/components/PostMedia";
import { supabase } from "@/lib/supabaseClient";

type PostCardProps =
  | {
      variant?: "display";
      post: Post;
      onPostCreated?: () => void;
    }
  | {
      variant: "composer";
      post?: Post;
      onPostCreated?: () => void;
    };

export function PostCard({ variant = "display", post, onPostCreated }: PostCardProps) {
  const isComposer = variant === "composer";
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      recorderRef.current = recorder;

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: "audio/webm;codecs=opus" }));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);

      recordingTimer.current = setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
        setRecording(false);
      }, 60000);
    } catch (err) {
      setError("Permita o acesso ao microfone para gravar.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadToBucket = async (bucket: string, path: string, file: Blob | File) => {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file instanceof File ? file.type : "audio/webm;codecs=opus",
        upsert: true
      });

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!isComposer || loading) return;
    if (!content && !imageFile && !audioBlob) {
      setError("Adicione uma legenda, imagem ou áudio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let imageUrl = null;
      let audioUrl = null;

      if (imageFile) {
        imageUrl = await uploadToBucket("posts", `${user.id}/${Date.now()}-${imageFile.name}`, imageFile);
      }
      if (audioBlob) {
        audioUrl = await uploadToBucket("audios", `${user.id}/${Date.now()}-audio.webm`, audioBlob);
      }

      const { error: insertError } = await supabase.from("posts").insert([
        {
          content: content || null,
          image_url: imageUrl,
          audio_url: audioUrl,
          user_id: user.id,
          author_name: user.user_metadata?.full_name || user.email,
        },
      ]);

      if (insertError) throw insertError;

      setContent("");
      setImageFile(null);
      setAudioBlob(null);
      onPostCreated?.();
    } catch (err: any) {
      setError(err.message || "Erro ao publicar.");
    } finally {
      setLoading(false);
    }
  };

  if (isComposer) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está acontecendo?"
            className="w-full bg-transparent text-white outline-none placeholder:text-white/30 resize-none"
          />
          <div className="flex items-center gap-4">
            <label className="cursor-pointer text-sm text-white/60 hover:text-white transition">
              📷 Foto
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className={`text-sm transition ${recording ? "text-red-500 animate-pulse" : "text-white/60 hover:text-white"}`}
            >
              🎙️ {recording ? "Gravando..." : "Segure para falar"}
            </button>
            {(imageFile || audioBlob) && <span className="ml-auto text-[10px] text-[#D4C5B0] uppercase tracking-widest">Pronto</span>}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#D4C5B0] transition disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Publicar"}
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <Link href={`/p/${post.id}`} className="block group rounded-3xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
      <div className="space-y-4">
        <PostHeader authorName={post.authorName} authorHandle={post.authorHandle} />
        <PostMedia mediaType={post.mediaType} />
        <div className="space-y-2">
          <p className="text-sm text-white/80">{post.caption}</p>
          <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-tighter">
            <span>{post.commentsCount} Ressonâncias</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
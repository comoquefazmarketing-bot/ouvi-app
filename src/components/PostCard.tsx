"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Post } from "@/types/post";
import { PostHeader } from "@/components/PostHeader";
import { PostMedia } from "@/components/PostMedia";
import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

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
  const [error, setError] = useState<string | null>(supabaseConfigError);
  const [loading, setLoading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);

    if (supabaseConfigError) {
      setError(supabaseConfigError);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    recorderRef.current = recorder;

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = () => {
      setAudioBlob(new Blob(chunks, { type: "audio/webm;codecs=opus" }));
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setRecording(true);

    recordingTimer.current = setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      setRecording(false);
    }, 60000);
  };

  const stopRecording = () => {
    if (!recorderRef.current) {
      return;
    }
    recorderRef.current.stop();
    setRecording(false);
  };

  const uploadToBucket = async (bucket: string, path: string, file: Blob | File) => {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file instanceof File ? file.type : "audio/webm;codecs=opus",
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!isComposer) {
      return;
    }

    if (!content && !imageFile && !audioBlob) {
      setError("Adicione uma legenda, imagem ou áudio para publicar.");
      return;
    }

    setError(null);
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setError("Você precisa estar logado para publicar.");
      setLoading(false);
      return;
    }

    let imageUrl: string | null = null;
    let audioUrl: string | null = null;

    try {
      if (imageFile) {
        const imagePath = `${user.id}/${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadToBucket("posts", imagePath, imageFile);
      }

      if (audioBlob) {
        const audioPath = `${user.id}/${Date.now()}-audio.webm`;
        try {
          audioUrl = await uploadToBucket(
            "audio-ressonancias",
            audioPath,
            audioBlob
          );
        } catch (audioError) {
          audioUrl = await uploadToBucket("audios", audioPath, audioBlob);
        }
      }

      const { error: insertError } = await supabase.from("posts").insert([
        {
          content: content || null,
          image_url: imageUrl,
          audio_url: audioUrl,
          user_id: user.id,
          user_email: user.user_metadata?.full_name || user.email,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      setContent("");
      setImageFile(null);
      setAudioBlob(null);
      onPostCreated?.();
    } catch (submitError) {
      setError("Não foi possível publicar agora.");
    } finally {
      setLoading(false);
    }
  };

  if (isComposer) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md">
        <div className="space-y-4">
          <PostHeader authorName="Você" authorHandle="@ouvi" />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Legenda do seu momento..."
            className="h-20 w-full resize-none rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-offwhite outline-none placeholder:text-white/40"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-white/40">
              📷 Imagem
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-white/40"
            >
              {recording ? "Gravando..." : "🎙️ Segure para gravar"}
            </button>
            {imageFile ? (
              <span className="text-xs text-accent">Imagem pronta</span>
            ) : null}
            {audioBlob ? (
              <span className="text-xs text-accent">Áudio pronto</span>
            ) : null}
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-full bg-offwhite px-4 py-2 text-xs font-semibold text-void transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <Link
      href={`/p/${post.id}`}
      className="group block rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md transition hover:border-white/20"
    >
      <div className="space-y-4">
        <PostHeader authorName={post.authorName} authorHandle={post.authorHandle} />
        <PostMedia mediaType={post.mediaType} />
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-offwhite">{post.caption}</p>
          <span className="text-xs text-white/40">
            {post.commentsCount} comentários
          </span>
        </div>
      </div>
    </Link>
  );
}

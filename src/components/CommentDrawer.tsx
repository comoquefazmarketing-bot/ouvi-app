"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Comment = {
  id: string;
  username: string;
  avatarUrl: string;
  audioUrl: string;
  durationSeconds: number;
};

type CommentDrawerProps = {
  postId: string;
  commentsCount: number;
};

export function CommentDrawer({ postId, commentsCount }: CommentDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Busca comentários reais do Supabase ao abrir a thread
  useEffect(() => {
    async function fetchComments() {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (data && !error) setComments(data);
    }
    fetchComments();
  }, [postId]);

  const handlePlay = (commentId: string, durationSeconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setCurrentPlayingId(commentId);
    setProgressById((prev) => ({ ...prev, [commentId]: 0 }));

    const totalMs = durationSeconds * 1000;
    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalMs, 1);

      setProgressById((prev) => ({ ...prev, [commentId]: progress }));

      if (progress >= 1) {
        clearInterval(timerRef.current!);
        
        // Lógica de Autoplay: Toca o próximo comentário automaticamente
        const currentIndex = comments.findIndex(c => c.id === commentId);
        if (currentIndex < comments.length - 1) {
          const next = comments[currentIndex + 1];
          setTimeout(() => handlePlay(next.id, next.durationSeconds), 180); // Gap de 180ms do mapa
        } else {
          setCurrentPlayingId(null);
        }
      }
    }, 120);
  };

  const isFocusMode = currentPlayingId !== null;

  return (
    <section className="mt-6 rounded-3xl border border-white/[0.08] bg-black p-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 border border-white/20 transition-all duration-700 ${currentPlayingId ? "rounded-[40%] border-[#D4C5B0]" : "rounded-full"}`} />
          <h3 className="text-sm font-semibold text-[#eaeaea]">Ressonâncias</h3>
        </div>
        <span className="text-xs text-white/45">{commentsCount} áudios</span>
      </header>

      <div className="mt-5 space-y-4">
        {comments.map((comment) => {
          const isPlaying = currentPlayingId === comment.id;
          const progress = progressById[comment.id] ?? 0;

          return (
            <div
              key={comment.id}
              className={`rounded-2xl border bg-white/[0.03] p-4 backdrop-blur-md transition-all duration-700 ${isPlaying ? "border-[#D4C5B0]/40" : "border-white/[0.08]"} ${isFocusMode && !isPlaying ? "opacity-50" : "opacity-100"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs text-white/70 ${isPlaying ? "animate-pulse" : ""}`}>
                    {comment.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-[#eaeaea]">{comment.username}</p>
                    <p className="text-xs text-white/45">{comment.durationSeconds}s</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePlay(comment.id, comment.durationSeconds)}
                  className="rounded-full border border-white/10 px-4 py-1 text-xs text-[#eaeaea] hover:border-white/40"
                >
                  {isPlaying ? "Tocando" : "Ouvir"}
                </button>
              </div>
              <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-[#D4C5B0] transition-all duration-300" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MOCK_COMMENTS = [
  {
    id: "comment-1",
    username: "@liarocha",
    avatarUrl: "",
    durationSeconds: 12,
  },
  {
    id: "comment-2",
    username: "@caiom",
    avatarUrl: "",
    durationSeconds: 9,
  },
  {
    id: "comment-3",
    username: "@nina",
    avatarUrl: "",
    durationSeconds: 14,
  },
];

type CommentDrawerProps = {
  commentsCount: number;
};

export function CommentDrawer({ commentsCount }: CommentDrawerProps) {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const comments = useMemo(() => MOCK_COMMENTS, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handlePlay = (commentId: string, durationSeconds: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setCurrentPlayingId(commentId);
    setProgressById((prev) => ({ ...prev, [commentId]: 0 }));

    const totalMs = durationSeconds * 1000;
    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalMs, 1);

      setProgressById((prev) => ({ ...prev, [commentId]: progress }));

      if (progress >= 1) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setCurrentPlayingId(null);
      }
    }, 120);
  };

  const isFocusMode = currentPlayingId !== null;

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-[#050505] p-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 border border-white/20 transition-all duration-700 ${
              currentPlayingId
                ? "rounded-[40%] border-white/50"
                : "rounded-full"
            }`}
          />
          <h3 className="text-sm font-semibold text-zinc-100">Comentários</h3>
        </div>
        <span className="text-xs text-zinc-400">{commentsCount} no total</span>
      </header>

      <div className="mt-5 space-y-4">
        {comments.map((comment) => {
          const isPlaying = currentPlayingId === comment.id;
          const progress = progressById[comment.id] ?? 0;

          return (
            <div
              key={comment.id}
              className={`rounded-2xl border bg-white/[0.02] p-4 transition-all duration-700 ${
                isPlaying
                  ? "border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.08)]"
                  : "border-white/10"
              } ${
                isFocusMode && !isPlaying ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs text-white/70 transition-all duration-700 ${
                      isPlaying ? "animate-pulse scale-[1.02]" : ""
                    }`}
                  >
                    {comment.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.avatarUrl}
                        alt={comment.username}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      comment.username.slice(1, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-100">{comment.username}</p>
                    <p className="text-xs text-zinc-500">
                      {comment.durationSeconds}s
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlay(comment.id, comment.durationSeconds)}
                  className="rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-100 transition hover:border-white/40"
                >
                  {isPlaying ? "Tocando" : "Ouvir"}
                </button>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/40">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

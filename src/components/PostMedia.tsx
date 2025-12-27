type PostMediaProps = {
  mediaType: "image" | "video";
};

export function PostMedia({ mediaType }: PostMediaProps) {
  return (
    <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
      <span className="rounded-full border border-zinc-700 bg-zinc-950/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-200">
        {mediaType === "image" ? "Imagem" : "Vídeo"}
      </span>
      {mediaType === "video" ? (
        <span className="absolute bottom-4 right-4 rounded-full bg-zinc-100/10 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
          Play
        </span>
      ) : null}
    </div>
  );
}

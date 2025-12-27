type PostHeaderProps = {
  authorName: string;
  authorHandle: string;
};

export function PostHeader({ authorName, authorHandle }: PostHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <div className="absolute -left-2 -top-2 h-7 w-7 rounded-full bg-accent/20 blur-2xl" />
          <span className="text-xs font-semibold tracking-[0.3em] text-offwhite">
            OUVI
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-offwhite">{authorName}</p>
          <p className="text-xs text-white/45">{authorHandle}</p>
        </div>
      </div>
      <span className="text-xs text-white/40">agora</span>
    </div>
  );
}

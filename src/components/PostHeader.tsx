type PostHeaderProps = {
  authorName: string;
  authorHandle: string;
};

export function PostHeader({ authorName, authorHandle }: PostHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          {/* Efeito de iluminação sutil atrás do nome do autor */}
          <div className="absolute -left-2 -top-2 h-7 w-7 rounded-full bg-[#D4C5B0]/10 blur-2xl" />
          <span className="text-[10px] font-bold tracking-[0.3em] text-[#D4C5B0] uppercase">
            OUVI
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#eaeaea] leading-none">{authorName}</p>
          <p className="text-[11px] text-white/40">{authorHandle}</p>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-tighter text-white/30">agora</span>
    </div>
  );
}
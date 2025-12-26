type PostHeaderProps = {
  authorName: string;
  authorHandle: string;
};

export function PostHeader({ authorName, authorHandle }: PostHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-zinc-100">{authorName}</p>
        <p className="text-xs text-zinc-400">{authorHandle}</p>
      </div>
      <span className="text-xs text-zinc-500">agora</span>
    </div>
  );
}

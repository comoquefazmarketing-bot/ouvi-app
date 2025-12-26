type CommentDrawerProps = {
  commentsCount: number;
};

export function CommentDrawer({ commentsCount }: CommentDrawerProps) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Comentários</h3>
        <span className="text-xs text-zinc-400">{commentsCount} no total</span>
      </header>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-500">
          Espaço reservado para os comentários. Aqui entram interações por áudio
          e texto em breve.
        </div>
        <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-500">
          Preparado para listas de comentários, respostas e destaques.
        </div>
      </div>
    </section>
  );
}

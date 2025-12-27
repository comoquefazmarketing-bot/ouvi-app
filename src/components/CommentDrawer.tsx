type Comment = {
  id: string;
  username: string;
  avatarUrl: string;
  audioUrl: string; // URL real do Supabase
  durationSeconds: number;
};

type CommentDrawerProps = {
  postId: string;
  commentsCount: number;
};

export function CommentDrawer({ postId, commentsCount }: CommentDrawerProps) {
  // A lógica de busca no Supabase e Autoplay entrará aqui
}

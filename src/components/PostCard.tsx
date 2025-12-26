import Link from "next/link";

import { Post } from "@/types/post";
import { PostHeader } from "@/components/PostHeader";
import { PostMedia } from "@/components/PostMedia";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/p/${post.id}`}
      className="group block rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700"
    >
      <div className="space-y-4">
        <PostHeader
          authorName={post.authorName}
          authorHandle={post.authorHandle}
        />
        <PostMedia mediaType={post.mediaType} />
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-zinc-200">{post.caption}</p>
          <span className="text-xs text-zinc-400">
            {post.commentsCount} comentários
          </span>
        </div>
      </div>
    </Link>
  );
}

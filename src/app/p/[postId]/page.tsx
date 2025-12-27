import { notFound } from "next/navigation";

import { CommentDrawer } from "@/components/CommentDrawer";
import { PostHeader } from "@/components/PostHeader";
import { PostMedia } from "@/components/PostMedia";
import { mockPosts } from "@/lib/mockPosts";

type PostPageProps = {
  params: { postId: string };
};

export default function PostPage({ params }: PostPageProps) {
  const post = mockPosts.find((item) => item.id === params.postId);

  if (!post) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5">
        <PostHeader
          authorName={post.authorName}
          authorHandle={post.authorHandle}
        />
        <PostMedia mediaType={post.mediaType} />
        <p className="text-sm leading-relaxed text-zinc-200">{post.caption}</p>
        <button className="w-full rounded-full border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500">
          Comentários
        </button>
      </div>
      <CommentDrawer commentsCount={post.commentsCount} />
    </section>
  );
}

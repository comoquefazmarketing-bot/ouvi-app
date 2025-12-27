import { Post } from "@/types/post";
import { PostCard } from "@/components/PostCard";

type FeedListProps = {
  posts: Post[];
};

export function FeedList({ posts }: FeedListProps) {
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

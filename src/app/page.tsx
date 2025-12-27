import { FeedList } from "@/components/FeedList";
import { PostCard } from "@/components/PostCard";
import { mockPosts } from "@/lib/mockPosts";

export default function Home() {
  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <div className="absolute -left-2 -top-3 h-10 w-10 rounded-full bg-accent/20 blur-3xl" />
            <span className="text-lg font-semibold tracking-[0.25em] text-offwhite">
              OUVI
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">
              Feed
            </p>
            <h1 className="text-2xl font-semibold text-offwhite">
              O que estão ouvindo hoje?
            </h1>
          </div>
        </div>
        <p className="text-sm text-white/50">
          Uma linha do tempo enxuta e feita para explorar momentos visuais com
          áudio.
        </p>
      </header>
      <PostCard variant="composer" />
      <FeedList posts={mockPosts} />
    </section>
  );
}

import { FeedList } from "@/components/FeedList";
import { mockPosts } from "@/lib/mockPosts";

export default function Home() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Feed
        </p>
        <h1 className="text-2xl font-semibold text-zinc-100">
          O que estão ouvindo hoje?
        </h1>
        <p className="text-sm text-zinc-400">
          Uma linha do tempo enxuta e feita para explorar momentos visuais com
          áudio.
        </p>
      </header>
      <FeedList posts={mockPosts} />
    </section>
  );
}

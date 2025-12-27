"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

type WaveProgressProps = {
  maxPosts?: number;
};

export function WaveProgress({ maxPosts = 10 }: WaveProgressProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        return;
      }

      const { count: totalCount } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setCount(totalCount ?? 0);
    };

    loadCount();
  }, []);

  const progress = Math.min((count % maxPosts) / maxPosts, 1);

  return (
    <div className="flex w-full items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
        Waves
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent via-accent-cool to-offwhite transition-all duration-700"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-white/40">{count}</span>
    </div>
  );
}

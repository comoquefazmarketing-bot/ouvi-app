"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import FeedList from "@/components/dashboard/Feed/FeedList";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  return (
    <div style={{ width: "100%" }}>
      {/* O FeedList já cuida de renderizar os FeedItems (PostCards) */}
      <FeedList />
    </div>
  );
}

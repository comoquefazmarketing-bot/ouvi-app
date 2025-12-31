"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/dashboard/Post/PostCard";
import FeedList from "@/components/dashboard/Feed/FeedList";

export default function DashboardPage() {
  return (
    <div style={{ pb: '100px' }}>
      <FeedList />
    </div>
  );
}

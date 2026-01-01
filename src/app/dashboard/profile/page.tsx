"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/dashboard/Post/PostCard";
import { Settings, Mic, Heart, Zap } from "lucide-react";

export default function ProfilePage() {
  const [userPosts, setUserPosts] = useState<any[]>([]);

  return (
    <div style={{ color: "white", padding: "20px", paddingBottom: "100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Meu Perfil</h2>
        <Settings size={24} style={{ opacity: 0.7 }} />
      </div>

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "40px", backgroundColor: "#333", margin: "0 auto 15px" }}></div>
        <p style={{ fontWeight: "600" }}>Felipe Makarios</p>
        <p style={{ color: "#888", fontSize: "14px" }}>@felipe</p>
      </div>

      <div className="posts-section">
        <p style={{ color: "#888", marginBottom: "15px", fontSize: "14px" }}>Minhas publica§µes</p>
        {userPosts.length === 0 ? (
          <p style={{ textAlign: "center", color: "#444", marginTop: "40px" }}>Nenhuma publica§£o ainda.</p>
        ) : (
          userPosts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={null} onRefresh={() => {}} />
          ))
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/dashboard/Post/PostCard";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);

  return (
    <div style={{ color: "white", padding: "20px", paddingBottom: "100px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>Busca</h2>
      
      <div style={{ position: "relative", marginBottom: "30px" }}>
        <input 
          type="text" 
          placeholder="O que você quer ouvir?" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "14px", 
            borderRadius: "15px", 
            backgroundColor: "rgba(255,255,255,0.08)", 
            border: "1px solid rgba(255,255,255,0.1)", 
            color: "white",
            outline: "none"
          }}
        />
      </div>

      <div className="trending-section">
        <p style={{ color: "#888", marginBottom: "15px", fontSize: "14px" }}>Sugestões para você</p>
        {/* Aqui os cards aparecerão corretamente agora */}
        {trendingPosts.map(post => (
          <PostCard key={post.id} post={post} currentUserId={null} onRefresh={() => {}} />
        ))}
      </div>
    </div>
  );
}

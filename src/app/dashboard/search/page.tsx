/**
 * PROJETO OUVI — Busca por Engajamento
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\search\page.tsx
 */

"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/dashboard/Feed/PostCard"; // Use o seu componente de card de post

export default function SearchPage() {
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTrending = async () => {
    setLoading(true);
    // 1. Buscamos os posts recentes
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      // 2. Lógica de Engajamento: Ordenamos manualmente pelo peso das reações
      const sorted = data.sort((a, b) => {
        const scoreA = (a.reactions?.loved_by?.length || 0) + (a.reactions?.energy || 0);
        const scoreB = (b.reactions?.loved_by?.length || 0) + (b.reactions?.energy || 0);
        return scoreB - scoreA; // Maior score primeiro
      });
      setTrendingPosts(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  // Filtro de busca simples por texto/username
  const filteredPosts = trendingPosts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.searchHeader}>
        <div style={styles.inputBar}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input 
            placeholder="Buscar vozes ou pessoas..." 
            style={styles.input}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.feed}>
        <h2 style={styles.sectionTitle}>
          {searchQuery ? "RESULTADOS" : "EM ALTA (TRENDING)"}
        </h2>

        {loading ? (
          <p style={styles.status}>SINTONIZANDO...</p>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} style={styles.postWrapper}>
              {/* Reaproveitamos o componente do feed para manter o padrão */}
              <PostCard post={post} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#000", minHeight: "100vh", paddingBottom: "100px" },
  searchHeader: { 
    padding: "60px 20px 20px", 
    background: "linear-gradient(to bottom, rgba(0, 242, 254, 0.1), transparent)",
    position: "sticky" as const,
    top: 0,
    zIndex: 10
  },
  inputBar: { 
    display: "flex", 
    alignItems: "center", 
    background: "#111", 
    padding: "12px 20px", 
    borderRadius: "100px", 
    gap: "10px",
    border: "1px solid rgba(255,255,255,0.05)"
  },
  input: { background: "none", border: "none", color: "#fff", flex: 1, outline: "none", fontSize: "14px" },
  feed: { padding: "20px" },
  sectionTitle: { fontSize: "10px", fontWeight: "900" as const, color: "#00f2fe", letterSpacing: "2px", marginBottom: "20px" },
  postWrapper: { marginBottom: "15px" },
  status: { color: "#444", textAlign: "center" as const, marginTop: "40px", fontSize: "12px", letterSpacing: "1px" }
};
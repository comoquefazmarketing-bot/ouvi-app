/**
 * PROJETO OUVI — Perfil do Utilizador
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\profile\page.tsx
 */

"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/dashboard/Feed/PostCard";
import { Settings, Mic, Heart, Zap } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ loves: 0, energy: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Buscar dados do Perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);

      // 2. Buscar Meus Posts
      const { data: posts } = await supabase
        .from("posts")
        .select("*, profiles(username, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (posts) {
        setMyPosts(posts);
        
        // 3. Calcular Estatísticas de Impacto
        const totalLoves = posts.reduce((acc, post) => acc + (post.reactions?.loved_by?.length || 0), 0);
        const totalEnergy = posts.reduce((acc, post) => acc + (post.reactions?.energy || 0), 0);
        setStats({ loves: totalLoves, energy: totalEnergy });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header com Botão de Definições */}
      <div style={styles.header}>
        <Settings size={20} color="#fff" />
      </div>

      {/* Info do Utilizador */}
      <div style={styles.userInfo}>
        <div style={styles.avatarPlaceholder}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} style={styles.avatarImg} alt="Avatar" />
          ) : (
            <span style={{fontSize: '24px'}}>👤</span>
          )}
        </div>
        <h1 style={styles.username}>@{profile?.username || "utilizador"}</h1>
        <p style={styles.bio}>{profile?.bio || "A partilhar a minha voz no OUVI."}</p>
      </div>

      {/* Stats Bar — O Impacto do Felipe */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <Heart size={14} color="#ff4444" fill="#ff4444" />
          <span style={styles.statNumber}>{stats.loves}</span>
          <span style={styles.statLabel}>AMOR</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <Zap size={14} color="#00f2fe" fill="#00f2fe" />
          <span style={styles.statNumber}>{stats.energy}</span>
          <span style={styles.statLabel}>ENERGIA</span>
        </div>
      </div>

      {/* Meus Áudios */}
      <div style={styles.feed}>
        <div style={styles.sectionHeader}>
          <Mic size={14} color="#00f2fe" />
          <h2 style={styles.sectionTitle}>MINHAS PUBLICAÇÕES</h2>
        </div>

        {loading ? (
          <p style={styles.status}>A CARREGAR MEMÓRIAS...</p>
        ) : myPosts.length > 0 ? (
          myPosts.map((post) => (
            <div key={post.id} style={{ marginBottom: '15px' }}>
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>Ainda não gravaste o teu primeiro áudio.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#000", minHeight: "100vh", paddingBottom: "100px" },
  header: { padding: "40px 20px 0", display: "flex", justifyContent: "flex-end" },
  userInfo: { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "20px" },
  avatarPlaceholder: { width: "80px", height: "80px", borderRadius: "40px", background: "#111", display: "flex", justifyContent: "center", alignItems: "center", border: "2px solid #00f2fe", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  username: { color: "#fff", marginTop: "15px", fontSize: "18px", fontWeight: "900" as const, letterSpacing: "1px" },
  bio: { color: "#666", fontSize: "12px", marginTop: "5px", textAlign: "center" as const },
  statsBar: { 
    display: "flex", 
    justifyContent: "space-around", 
    margin: "20px", 
    padding: "15px", 
    background: "#080808", 
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.03)"
  },
  statItem: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "5px" },
  statNumber: { color: "#fff", fontWeight: "900" as const, fontSize: "16px" },
  statLabel: { color: "#444", fontSize: "9px", letterSpacing: "1px" },
  statDivider: { width: "1px", background: "rgba(255,255,255,0.1)" },
  feed: { padding: "20px" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" },
  sectionTitle: { color: "#00f2fe", fontSize: "10px", fontWeight: "900" as const, letterSpacing: "2px" },
  status: { color: "#444", textAlign: "center" as const, fontSize: "11px", marginTop: "30px" },
  emptyText: { color: "#333", textAlign: "center" as const, fontSize: "12px", marginTop: "40px" }
};
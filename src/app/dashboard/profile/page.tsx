"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/dashboard/Post/PostCard";
import { Settings } from "lucide-react";

export default function ProfilePage() {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        
        // 1. Pega o usuário logado no sistema
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 2. Busca os dados do perfil real no banco
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setProfile(profileData);

          // 3. Busca apenas os posts que pertencem a este usuário
          const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (postsData) {
            // Prepara os posts com os dados do perfil para o componente PostCard
            const merged = postsData.map(post => ({
              ...post,
              profiles: profileData, // Vincula o perfil aos posts
              image_url: post.image_url || "", // Proteção contra o erro de null
              video_url: post.video_url || "",
              content_audio: post.content_audio || ""
            }));
            setUserPosts(merged);
          }
        }
      } catch (error) {
        console.error("Erro ao sintonizar perfil:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  if (loading) {
    return <p style={{ color: "#00f2fe", textAlign: "center", marginTop: "80px", fontWeight: "900", fontSize: "10px", letterSpacing: "2px" }}>SINTONIZANDO...</p>;
  }

  return (
    <div style={{ color: "white", padding: "20px", paddingBottom: "120px", maxWidth: "500px", margin: "0 auto" }}>
      
      {/* HEADER DO PERFIL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "3px" }}>MEU PERFIL</h2>
        <Settings size={22} style={{ opacity: 0.5, cursor: "pointer" }} />
      </div>

      {/* INFO DO USUÁRIO DINÂMICO */}
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <div style={{ 
          width: "100px", 
          height: "100px", 
          borderRadius: "50px", 
          backgroundColor: "#111", 
          margin: "0 auto 20px",
          border: "2px solid #00f2fe",
          backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : "none",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {!profile?.avatar_url && <span style={{ fontSize: "30px" }}>🎙️</span>}
        </div>
        
        <p style={{ fontWeight: "700", fontSize: "20px", margin: "0" }}>
          {profile?.full_name || "Membro Fundador"}
        </p>
        <p style={{ color: "#00f2fe", fontSize: "14px", marginTop: "6px", fontWeight: "600", letterSpacing: "0.5px" }}>
          @{profile?.username || "usuario"}
        </p>
      </div>

      {/* LISTA DE POSTS DO PRÓPRIO USUÁRIO */}
      <div className="posts-section">
        <p style={{ color: "#444", marginBottom: "20px", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" }}>
          MINHAS PUBLICAÇÕES
        </p>
        
        {userPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#0a0a0a", borderRadius: "20px", border: "1px dashed #222" }}>
            <p style={{ color: "#333", fontSize: "13px", fontWeight: "600" }}>Seu microfone ainda não registrou nada.</p>
          </div>
        ) : (
          userPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={profile?.id} 
              onDelete={(id: string) => setUserPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
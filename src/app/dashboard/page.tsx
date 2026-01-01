/**
 * PROJETO OUVI – Plataforma Social de Voz
 * Dashboard / Feed Principal
 */

"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null); // Estado para o usuário logado

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Identifica o usuário logado para liberar os (...)
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Busca simples dos posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (postsData && postsData.length > 0) {
        const userIds = postsData.map(p => p.user_id).filter(id => id !== null);

        // 3. Busca os perfis
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        // 4. Montagem manual injetando perfil e data
        const merged = postsData.map(post => {
          const userProfile = profilesData?.find(p => p.id === post.user_id) || null;
          return {
            ...post,
            profile: userProfile,
            profiles: userProfile, 
            created_at: post.created_at
          };
        });

        setPosts(merged);
      }
    } catch (err: any) {
      console.error("Erro ao carregar o feed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  return (
    <div style={{ 
      backgroundColor: '#000', 
      minHeight: '100vh', 
      paddingBottom: '180px', 
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '10px' }}>
        {loading && (
          <p style={{ color: '#fff', textAlign: 'center', marginTop: '40px', fontWeight: '900', fontSize: '12px' }}>
            CONECTANDO ÀS VOZES...
          </p>
        )}
        
        {!loading && posts.length === 0 && (
          <p style={{ color: '#444', textAlign: 'center', marginTop: '40px', fontWeight: '900' }}>
            NENHUMA VOZ ENCONTRADA.
          </p>
        )}

        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onOpenThread={setSelectedPost}
            // AGORA O POSTCARD SABE QUEM É VOCÊ:
            currentUserId={currentUser?.id} 
          />
        ))}
      </div>
      
      {selectedPost && (
        <ThreadDrawer 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  );
}
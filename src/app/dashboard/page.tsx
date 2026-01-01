/**
 * PROJETO OUVI – Dashboard / Feed Principal
 * Versão 2026 Sintonizada - CORREÇÃO DE CABEÇALHO
 */

"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // BUSCA PRECISA: Note o uso do profiles!
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id, 
            username, 
            avatar_url
          ),
          audio_comments (
            id,
            content,
            username,
            created_at,
            profiles:user_id (
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedPosts = data.map(post => {
          // Ajuste fino para garantir que profiles seja um objeto único e não uma lista
          const profileData = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          
          return {
            ...post,
            // Forçamos a estrutura que o PostCard espera
            profiles: profileData || { username: 'membro', avatar_url: '/default-avatar.png' },
            audio_comments: post.audio_comments?.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ) || []
          };
        });
        setPosts(formattedPosts);
      }

    } catch (err: any) {
      console.error("Erro na sintonização:", err.message);
      // Fallback para não ficar sem nada na tela
      const { data: fallback } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      setPosts(fallback || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingBottom: '140px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '10px' }}>
        
        {loading && (
          <div style={styles.statusContainer}>
             <p style={styles.loadingText}>SINTONIZANDO...</p>
          </div>
        )}
        
        {!loading && posts.length === 0 && (
          <div style={styles.statusContainer}>
             <p style={styles.emptyText}>O SILÊNCIO É PROFUNDO.</p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onOpenThread={() => setSelectedPost(post)}
            currentUserId={currentUser?.id} 
            onDelete={(id: string) => setPosts(prev => prev.filter(p => p.id !== id))}
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

const styles = {
  statusContainer: { marginTop: '80px', textAlign: 'center' as const },
  loadingText: { color: '#00f2fe', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '3px' },
  emptyText: { color: '#333', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px' }
};
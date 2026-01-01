/**
 * PROJETO OUVI – Dashboard / Feed Principal
 * Versão 2026 Sintonizada
 * Ajuste: Query Relacional para Prévias e Comentários
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Identifica o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. BUSCA ELITE: Post + Perfil + Comentários (Tudo em uma tacada só)
      // O audio_comments(profiles(...)) garante que a prévia tenha nome e foto
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id, 
            full_name, 
            username, 
            avatar_url
          ),
          audio_comments (
            id,
            content,
            username,
            created_at,
            audio_url,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Organiza os dados (O audio_comments vem como array, pegamos os mais recentes primeiro)
      const formattedPosts = (data || []).map(post => ({
        ...post,
        // Garantimos que o PostCard encontre a lista de comentários para a prévia
        audio_comments: post.audio_comments?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || []
      }));

      setPosts(formattedPosts);

    } catch (err: any) {
      console.error("Erro ao sintonizar o feed:", err.message);
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
      paddingBottom: '120px', // Ajustado para não vazar
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '10px' }}>
        
        {loading && (
          <div style={styles.statusContainer}>
             <p style={styles.loadingText}>SINTONIZANDO VOZES...</p>
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
            onOpenThread={setSelectedPost}
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

const styles = {
  statusContainer: { marginTop: '80px', textAlign: 'center' as const },
  loadingText: { color: '#00f2fe', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '3px' },
  emptyText: { color: '#333', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px' }
};
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
      
      // 1. Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Busca os posts puros (sem relações para não travar)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // 3. Busca todos os perfis de uma vez
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url');

      // 4. Busca os comentários para as prévias
      const { data: commentsData } = await supabase
        .from('audio_comments')
        .select('*');

      // 5. MONTAGEM MANUAL (A prova de falhas)
      const merged = (postsData || []).map(post => {
        // Encontra o perfil do dono do post
        const userProfile = profilesData?.find(p => p.id === post.user_id) || null;
        
        // Encontra os comentários deste post para a prévia
        const postComments = (commentsData || [])
          .filter(c => c.post_id === post.id)
          .map(c => {
            // Injeta o perfil de quem comentou dentro do comentário
            const commenterProfile = profilesData?.find(p => p.id === c.user_id);
            return { ...c, profiles: commenterProfile };
          });

        return {
          ...post,
          // Injeta o perfil no post (mantemos 'profiles' e 'profile' para compatibilidade)
          profiles: userProfile,
          profile: userProfile,
          audio_comments: postComments
        };
      });

      setPosts(merged);
    } catch (err: any) {
      console.error("Erro na sintonização:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingBottom: '140px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '10px' }}>
        
        {loading && <p style={styles.loadingText}>SINTONIZANDO...</p>}
        
        {!loading && posts.length === 0 && <p style={styles.emptyText}>SILÊNCIO ABSOLUTO.</p>}

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
        <ThreadDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

const styles = {
  loadingText: { color: '#00f2fe', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px' },
  emptyText: { color: '#333', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px' }
};cade o git
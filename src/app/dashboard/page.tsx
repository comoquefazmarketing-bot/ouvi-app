/**
 * PROJETO OUVI – Dashboard / Feed Principal
 * Versão 2026 Blindada
 * Ajuste: Query Resiliente para evitar que o Feed suma
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
      
      // 1. Identifica o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. BUSCA RESILIENTE: Tentamos buscar tudo, mas sem travar se faltar algo
      // Removi o filtro interno rígido para garantir que posts apareçam
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id, 
            username, 
            avatar_url
          ),
          audio_comments (
            id,
            content,
            username,
            created_at,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro na query relacional:", error.message);
        // Se a query complexa der erro (por causa das relações), buscamos o básico
        const { data: basicData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        setPosts(basicData || []);
        return;
      }

      // 3. Formatação segura dos dados
      if (data) {
        const formattedPosts = data.map(post => ({
          ...post,
          // Garante que o PostCard não quebre se o perfil for nulo
          profiles: post.profiles || { username: 'membro', avatar_url: '/default-avatar.png' },
          // Ordena as prévias de comentários (mais recentes primeiro)
          audio_comments: post.audio_comments?.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ) || []
        }));
        setPosts(formattedPosts);
      }

    } catch (err: any) {
      console.error("Erro ao sintonizar o feed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  return (
    <div style={{ 
      backgroundColor: '#000', 
      minHeight: '100vh', 
      paddingBottom: '140px', 
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
            onOpenThread={() => setSelectedPost(post)}
            currentUserId={currentUser?.id} 
            onDelete={(deletedId: string) => {
               setPosts(prev => prev.filter(p => p.id !== deletedId));
            }}
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
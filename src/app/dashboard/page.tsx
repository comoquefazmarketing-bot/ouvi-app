"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Identificação de Identidade (Híbrida) [cite: 2025-12-30]
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      const manualId = localStorage.getItem("ouvi_session_id");
      const manualName = localStorage.getItem("ouvi_user_name");
      
      if (!user && !manualId) {
        router.push("/login");
        return;
      }

      // Injeta a identidade local [cite: 2025-12-30]
      setCurrentUser(user || { id: manualId, display_name: manualName });

      // 2. Busca de Posts - RESOLVENDO AMBIGUIDADE [cite: 2025-12-30]
      // Usamos 'profiles:user_id' para forçar a relação correta e evitar o erro de 'multiple relationships'
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id, 
            username, 
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

    } catch (err: any) {
      console.error("Erro na sintonização do dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  return (
    <div className="dashboard-root" style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: '20px 0' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', gap: '20px' }}>
            <div style={{ width: '30px', height: '30px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#fff', textAlign: 'center', opacity: 0.3, fontSize: '10px', letterSpacing: '4px' }}>SINTONIZANDO...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onOpenThread={() => setSelectedPost(post)} 
                  onRefresh={fetchData} 
                />
              ))
            ) : (
              <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px', fontSize: '12px' }}>NENHUM SINAL ENCONTRADO NO FEED.</p>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {selectedPost && (
        <ThreadDrawer 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onRefresh={fetchData} 
        />
      )}
    </div>
  );
}
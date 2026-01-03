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
      // 1. ÂNCORA POR EMAIL
      const savedEmail = localStorage.getItem("ouvi_user_email");
      
      if (!savedEmail) {
        // Se não há e-mail, aguarda 2s antes de ir para o login [cite: 2025-12-30]
        setTimeout(() => {
          if (!localStorage.getItem("ouvi_user_email")) router.push("/login");
        }, 2000);
        return;
      }

      // 2. CONFRONTO DE IDENTIDADE
      const { data: perfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', savedEmail)
        .maybeSingle();

      if (perfil) {
        setCurrentUser(perfil);
        // Se o sinal diz que não completou o onboarding, enviamos para lá [cite: 2025-12-30]
        if (!perfil.onboarding_completed) {
          router.push("/onboarding");
          return;
        }
      }

      // 3. BUSCA DE POSTS (RESISTENTE) [cite: 2025-12-30]
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, author:user_id(id, username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (!postsError) {
        setPosts(postsData || []);
      }
    } catch (err: any) {
      console.error("Erro na sintonização:", err.message);
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
        {loading && posts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
            <div style={{ width: '30px', height: '30px', border: '2px solid #111', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onOpenThread={() => setSelectedPost(post)} 
                onRefresh={fetchData} 
              />
            ))}
            {posts.length === 0 && <p style={{ textAlign: 'center', opacity: 0.3 }}>SILÊNCIO NO FEED.</p>}
          </div>
        )}
      </div>

      {selectedPost && (
        <ThreadDrawer 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onRefresh={fetchData} 
        />
      )}
      
      <style jsx global>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  );
}
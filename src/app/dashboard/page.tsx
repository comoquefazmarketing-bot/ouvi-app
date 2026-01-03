"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Busca apenas os posts - Sem travas de convite [cite: 2025-12-30]
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, profiles(id, username, avatar_url)')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

    } catch (err: any) {
      console.error("Erro na sintonização do dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="dashboard-root" style={{ background: '#000', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/logo-dashboard.svg" style={{ width: '100px' }} alt="OUVI" />
        </header>

        {loading ? (
          <p style={{ color: '#00f2fe', textAlign: 'center', opacity: 0.5 }}>SINTONIZANDO...</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onOpenThread={() => setSelectedPost(post)} onRefresh={fetchData} />
          ))
        )}
      </div>
      {selectedPost && <ThreadDrawer post={selectedPost} onClose={() => setSelectedPost(null)} onRefresh={fetchData} />}
    </div>
  );
}
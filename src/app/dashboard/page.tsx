"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';
import { notifyArrival } from './telegramService';

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myInvites, setMyInvites] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // 2. BUSCA PERFIL PARA NOTIFICAÇÃO ÚNICA (USANDO NICK)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, welcome_sent')
          .eq('id', user.id)
          .single();

        // Só dispara o Telegram se o Nick existir e se for o PRIMEIRO ACESSO (welcome_sent: false)
        if (profileData && !profileData.welcome_sent) {
          const nick = profileData.username || "Novo Membro";
          
          // Disparo único com o Nick para o Telegram
          await notifyArrival(nick);

          // Trava a porta: marca no banco que o aviso de entrada já foi dado para evitar repetição
          await supabase
            .from('profiles')
            .update({ welcome_sent: true })
            .eq('id', user.id);
        }

        // 3. Busca os convites disponíveis no "Cofre" deste usuário
        const { data: invitesData } = await supabase
          .from('invites')
          .select('code, status')
          .eq('owner_id', user.id)
          .eq('status', 'disponivel');
        
        if (invitesData) setMyInvites(invitesData);
      }

      // 4. Busca os posts (Feed Cronológico)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // 5. Busca todos os perfis para o mapeamento visual
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url');

      // 6. Busca os comentários de áudio
      const { data: commentsData } = await supabase
        .from('audio_comments')
        .select('*');

      // 7. MONTAGEM SENSORIAL DO FEED (Merge de dados)
      const merged = (postsData || []).map(post => {
        const userProfile = allProfiles?.find(p => p.id === post.user_id) || null;
        const postComments = (commentsData || [])
          .filter(c => c.post_id === post.id)
          .map(c => ({
            ...c,
            profiles: allProfiles?.find(p => p.id === c.user_id)
          }));

        return {
          ...post,
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
        
        {/* SEÇÃO DE CONVITES (FOMO & EXCLUSIVIDADE) */}
        {myInvites.length > 0 && (
          <div style={styles.inviteContainer}>
            <p style={styles.inviteTitle}>🎫 VOCÊ TEM {myInvites.length} CONVITES EXCLUSIVOS</p>
            <div style={styles.inviteList}>
              {myInvites.map((inv) => (
                <span key={inv.code} style={styles.inviteCode}>{inv.code}</span>
              ))}
            </div>
            <p style={styles.inviteFooter}>Compartilhe o sinal. A frequência é limitada.</p>
          </div>
        )}
        
        {loading && <p style={styles.loadingText}>SINTONIZANDO...</p>}
        
        {!loading && posts.length === 0 && <p style={styles.emptyText}>SILÊNCIO ABSOLUTO.</p>}

        {/* LISTAGEM DE POSTS (FEED) */}
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
      
      {/* DRAWER DE COMENTÁRIOS / THREADS */}
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

const styles = {
  loadingText: { color: '#00f2fe', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px' },
  emptyText: { color: '#333', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px' },
  inviteContainer: { 
    backgroundColor: '#111', 
    border: '1px solid #00f2fe', 
    padding: '15px', 
    borderRadius: '8px', 
    marginBottom: '20px', 
    textAlign: 'center' as const 
  },
  inviteTitle: { color: '#00f2fe', fontSize: '10px', fontWeight: '900' as const, marginBottom: '10px' },
  inviteList: { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' as const },
  inviteCode: { backgroundColor: '#00f2fe', color: '#000', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' as const, borderRadius: '4px' },
  inviteFooter: { color: '#444', fontSize: '9px', marginTop: '10px', textTransform: 'uppercase' as const }
};
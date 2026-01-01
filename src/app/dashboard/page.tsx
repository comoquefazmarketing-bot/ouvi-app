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
  const [showTelegramBanner, setShowTelegramBanner] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Verifica se já entrou no grupo para exibir ou não o banner
        const hasJoined = localStorage.getItem('ouvi_joined_telegram');
        if (!hasJoined) setShowTelegramBanner(true);

        // 2. BUSCA PERFIL PARA NOTIFICAÇÃO ÚNICA
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, welcome_sent')
          .eq('id', user.id)
          .single();

        if (profileData && !profileData.welcome_sent) {
          const nick = profileData.username || "Novo Membro";
          await notifyArrival(nick);
          await supabase
            .from('profiles')
            .update({ welcome_sent: true })
            .eq('id', user.id);
        }

        // 3. Busca convites
        const { data: invitesData } = await supabase
          .from('invites')
          .select('code, status')
          .eq('owner_id', user.id)
          .eq('status', 'disponivel');
        
        if (invitesData) setMyInvites(invitesData);
      }

      // 4. Busca os posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url');

      const { data: commentsData } = await supabase
        .from('audio_comments')
        .select('*');

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

  const handleJoinTelegram = () => {
    localStorage.setItem('ouvi_joined_telegram', 'true');
    setShowTelegramBanner(false);
    // Substitua pelo seu link real do Telegram
    window.open('https://t.me/SEU_LINK_AQUI', '_blank');
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingBottom: '140px' }}>
      <style jsx global>{`
        @keyframes pulse-social {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '10px' }}>
        
        {/* BARRA SUPERIOR / BANNER DE CONVOCAÇÃO */}
        <div style={styles.header}>
          <h1 style={styles.brand}>OUVI</h1>
          {showTelegramBanner && (
            <button onClick={handleJoinTelegram} style={styles.socialButton}>
              <span style={styles.socialText}>ENTRAR NO CÍRCULO</span>
              <span>🎙️</span>
            </button>
          )}
        </div>

        {/* SEÇÃO DE CONVITES (FOMO & EXCLUSIVIDADE) */}
        {myInvites.length > 0 && (
          <div style={styles.inviteContainer}>
            <p style={styles.inviteTitle}>🎫 VOCÊ TEM {myInvites.length} CONVITES EXCLUSIVOS</p>
            <div style={styles.inviteList}>
              {myInvites.map((inv) => (
                <span key={inv.code} style={styles.inviteCode}>{inv.code}</span>
              ))}
            </div>
            <p style={styles.inviteFooter}>COMPARTILHE O ACESSO. A REDE ESTÁ VIRALIZANDO.</p>
          </div>
        )}
        
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 0' },
  brand: { color: '#fff', fontSize: '24px', fontWeight: '900' as const, letterSpacing: '5px', margin: 0 },
  socialButton: {
    background: 'linear-gradient(45deg, #00f2fe, #4facfe)',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    animation: 'pulse-social 2s infinite ease-in-out',
    boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)'
  },
  socialText: { color: '#000', fontSize: '9px', fontWeight: '900' as const, letterSpacing: '1px' },
  loadingText: { color: '#00f2fe', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px' },
  emptyText: { color: '#333', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px' },
  inviteContainer: { backgroundColor: '#111', border: '1px solid #00f2fe', padding: '20px', borderRadius: '16px', marginBottom: '25px', textAlign: 'center' as const },
  inviteTitle: { color: '#00f2fe', fontSize: '10px', fontWeight: '900' as const, marginBottom: '12px', letterSpacing: '2px' },
  inviteList: { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' as const },
  inviteCode: { backgroundColor: '#00f2fe', color: '#000', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' as const, borderRadius: '8px' },
  inviteFooter: { color: '#444', fontSize: '8px', marginTop: '12px', fontWeight: '700' as const, letterSpacing: '1px' }
};
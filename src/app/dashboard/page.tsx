"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';
import { notifyArrival } from './telegramService';

// ID do Perfil Oficial do App para os 3 posts diários (Ajuste com o ID real do seu banco)
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"; 

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myInvites, setMyInvites] = useState<any[]>([]);
  const [showTelegramBanner, setShowTelegramBanner] = useState(false);

  const TELEGRAM_LINK = "https://t.me/+vMOnG-2fI_E4ZTRh";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const hasJoined = localStorage.getItem('ouvi_joined_telegram');
        if (!hasJoined) setShowTelegramBanner(true);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, welcome_sent')
          .eq('id', user.id)
          .single();

        if (profileData && !profileData.welcome_sent) {
          const nick = profileData.username || "Novo Membro";
          await notifyArrival(nick);
          await supabase.from('profiles').update({ welcome_sent: true }).eq('id', user.id);
        }

        const { data: invitesData } = await supabase
          .from('invites')
          .select('code, status')
          .eq('owner_id', user.id)
          .eq('status', 'disponivel');
        
        if (invitesData) setMyInvites(invitesData);
      }

      // Busca posts tratando a possibilidade de campos nulos
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: allProfiles } = await supabase.from('profiles').select('id, username, avatar_url');
      const { data: commentsData } = await supabase.from('audio_comments').select('*');

      const merged = (postsData || []).map(post => {
        const userProfile = allProfiles?.find(p => p.id === post.user_id) || null;
        return {
          ...post,
          // Garante que URLs nulas virem string vazia para não quebrar o player
          image_url: post.image_url || "",
          video_url: post.video_url || "",
          content_audio: post.content_audio || "",
          profiles: userProfile,
          profile: userProfile,
          audio_comments: (commentsData || []).filter(c => c.post_id === post.id).map(c => ({
            ...c,
            profiles: allProfiles?.find(p => p.id === c.user_id)
          }))
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
    window.open(TELEGRAM_LINK, '_blank');
  };

  return (
    <div className="dashboard-root">
      <style jsx global>{`
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
          background-color: #000;
          margin: 0;
          padding: 0;
        }
        .dashboard-root {
          background-color: #000;
          min-height: 100vh;
          padding-bottom: 140px;
          width: 100%;
          overflow-x: hidden;
        }
        .content-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 10px;
          width: 100%;
          box-sizing: border-box;
        }
        @keyframes pulse-social {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .system-post-aura {
          border: 1px solid rgba(0, 242, 254, 0.3);
          border-radius: 16px;
          margin-bottom: 20px;
          background: linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
        }
      `}</style>

      <div className="content-container">
        <div style={styles.header}>
          <h1 style={styles.brand}>OUVI</h1>
          {showTelegramBanner && (
            <button onClick={handleJoinTelegram} style={styles.socialButton}>
              <span style={styles.socialText}>ENTRAR NO CÍRCULO</span>
              <span>🎙️</span>
            </button>
          )}
        </div>

        {myInvites.length > 0 && (
          <div style={styles.inviteContainer}>
            <p style={styles.inviteTitle}>🎫 VOCÊ TEM {myInvites.length} ACESSOS EXCLUSIVOS</p>
            <div style={styles.inviteList}>
              {myInvites.map((inv) => (
                <span key={inv.code} style={styles.inviteCode}>{inv.code}</span>
              ))}
            </div>
            <p style={styles.inviteFooter}>
              SINAL ESCASSO. NO PASSADO, CONVITES ASSIM VALIAM R$ 400. USE COM SABEDORIA.
            </p>
          </div>
        )}
        
        {loading && <p style={styles.loadingText}>SINTONIZANDO...</p>}
        {!loading && posts.length === 0 && <p style={styles.emptyText}>SILÊNCIO ABSOLUTO.</p>}

        {posts.map((post) => (
          <div key={post.id} className={post.user_id === SYSTEM_USER_ID ? "system-post-aura" : ""}>
            <PostCard 
              post={post} 
              onOpenThread={() => setSelectedPost(post)}
              currentUserId={currentUser?.id} 
              onDelete={(id: string) => setPosts(prev => prev.filter(p => p.id !== id))}
            />
          </div>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 5px' },
  brand: { color: '#fff', fontSize: '22px', fontWeight: '900' as const, letterSpacing: '4px', margin: 0 },
  socialButton: {
    background: 'linear-gradient(45deg, #00f2fe, #4facfe)',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    animation: 'pulse-social 2s infinite ease-in-out',
    boxShadow: '0 0 15px rgba(0, 242, 254, 0.2)'
  },
  socialText: { color: '#000', fontSize: '9px', fontWeight: '900' as const, letterSpacing: '1px' },
  loadingText: { color: '#00f2fe', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px' },
  emptyText: { color: '#333', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px' },
  inviteContainer: { backgroundColor: '#111', border: '1px solid #00f2fe', padding: '20px', borderRadius: '16px', marginBottom: '25px', textAlign: 'center' as const },
  inviteTitle: { color: '#00f2fe', fontSize: '10px', fontWeight: '900' as const, marginBottom: '12px', letterSpacing: '2px' },
  inviteList: { display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' as const },
  inviteCode: { backgroundColor: '#00f2fe', color: '#000', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold' as const, borderRadius: '6px' },
  inviteFooter: { color: '#444', fontSize: '8px', marginTop: '15px', fontWeight: '700' as const, letterSpacing: '0.5px', textTransform: 'uppercase' as const }
};
"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';
import { notifyArrival } from './telegramService';
import { motion } from 'framer-motion';

// ID do Perfil Oficial do App para posts de sistema
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"; 

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myInvites, setMyInvites] = useState<any[]>([]);
  const [showTelegramBanner, setShowTelegramBanner] = useState(false);

  // O Link da sua Sintonia Direta
  const TELEGRAM_LINK = "https://t.me/+vMOnG-2fI_E4ZTRh";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Verifica se o sintonizador já acessou o QG
        const hasJoined = localStorage.getItem('ouvi_joined_telegram');
        if (!hasJoined) setShowTelegramBanner(true);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, welcome_sent')
          .eq('id', user.id)
          .single();

        // Notifica o mestre no Telegram sobre a nova sintonização
        if (profileData && !profileData.welcome_sent) {
          const nick = profileData.username || "Novo Membro";
          await notifyArrival(nick);
          await supabase.from('profiles').update({ welcome_sent: true }).eq('id', user.id);
        }

        // Busca convites disponíveis para manter a escassez
        const { data: invitesData } = await supabase
          .from('invites')
          .select('code, status')
          .eq('owner_id', user.id)
          .eq('status', 'disponivel');
        
        if (invitesData) setMyInvites(invitesData);
      }

      // Busca o Feed (Silêncio ou Som)
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
        .system-post-aura {
          border: 1px solid rgba(0, 242, 254, 0.3);
          border-radius: 16px;
          margin-bottom: 20px;
          background: linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
        }
      `}</style>

      <div className="content-container">
        <header style={styles.header}>
          <h1 style={styles.brand}>OUVI</h1>
          
          {/* Botão QG Telegram Pulsante */}
          {showTelegramBanner && (
            <motion.button 
              onClick={handleJoinTelegram} 
              style={styles.socialButton}
              animate={{ boxShadow: ["0 0 10px #00f2fe22", "0 0 25px #00f2fe66", "0 0 10px #00f2fe22"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span style={styles.socialText}>QG SINTONIA</span>
              <span style={{fontSize: '12px'}}>🎙️</span>
            </motion.button>
          )}
        </header>

        {/* Módulo de Convites Exclusivos */}
        {myInvites.length > 0 && (
          <div style={styles.inviteContainer}>
            <p style={styles.inviteTitle}>🎫 {myInvites.length} ACESSOS EXCLUSIVOS DISPONÍVEIS</p>
            <div style={styles.inviteList}>
              {myInvites.map((inv) => (
                <span key={inv.code} style={styles.inviteCode}>{inv.code}</span>
              ))}
            </div>
            <p style={styles.inviteFooter}>
              USE COM SABEDORIA. O SINAL É ESCASSO.
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '15px 5px' },
  brand: { color: '#fff', fontSize: '24px', fontWeight: '900' as const, letterSpacing: '6px', margin: 0 },
  socialButton: {
    background: 'rgba(0, 242, 254, 0.1)',
    border: '1px solid #00f2fe',
    borderRadius: '100px',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  socialText: { color: '#00f2fe', fontSize: '9px', fontWeight: '900' as const, letterSpacing: '2px' },
  loadingText: { color: '#00f2fe', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px', opacity: 0.5 },
  emptyText: { color: '#222', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px' },
  inviteContainer: { backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(0, 242, 254, 0.1)', padding: '25px', borderRadius: '20px', marginBottom: '30px', textAlign: 'center' as const },
  inviteTitle: { color: '#00f2fe', fontSize: '9px', fontWeight: '900' as const, marginBottom: '15px', letterSpacing: '2px', opacity: 0.8 },
  inviteList: { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' as const },
  inviteCode: { border: '1px solid #00f2fe', color: '#00f2fe', padding: '6px 12px', fontSize: '12px', fontWeight: '900' as const, borderRadius: '8px', background: 'rgba(0, 242, 254, 0.05)' },
  inviteFooter: { color: '#333', fontSize: '8px', marginTop: '15px', fontWeight: '900' as const, letterSpacing: '1px' }
};
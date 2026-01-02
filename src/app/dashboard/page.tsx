"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';
import { notifyArrival } from './telegramService';
import { motion } from 'framer-motion';

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"; 

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myInvites, setMyInvites] = useState<any[]>([]);
  const [showTelegramBanner, setShowTelegramBanner] = useState(false);

  const TELEGRAM_LINK = "https://t.me/+vMOnG-2fI_E4ZTRh";
  const SUPPORT_BOT_LINK = "https://t.me/ouvi_maestro_bot";

  const availableInvites = useMemo(() => myInvites.slice(0, 2), [myInvites]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Se logado, roda processos de membro
      if (user) {
        const hasJoined = localStorage.getItem('ouvi_joined_telegram');
        if (!hasJoined) setShowTelegramBanner(true);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, welcome_sent')
          .eq('id', user.id)
          .single();

        if (profileData && !profileData.welcome_sent) {
          await notifyArrival(profileData.username || "Novo Membro");
          await supabase.from('profiles').update({ welcome_sent: true }).eq('id', user.id);
        }

        const { data: invitesData } = await supabase
          .from('invites')
          .select('code, status')
          .eq('owner_id', user.id)
          .eq('status', 'disponivel');
        
        if (invitesData) setMyInvites(invitesData);
      }

      // CARREGAMENTO PÚBLICO: Posts e Perfis acessíveis a todos
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Pegamos user_type para renderizar os selos de autoridade
      const { data: allProfiles } = await supabase.from('profiles').select('id, username, avatar_url, user_type');
      const { data: commentsData } = await supabase.from('audio_comments').select('*');

      const merged = (postsData || []).map(post => {
        const userProfile = allProfiles?.find(p => p.id === post.user_id) || null;
        return {
          ...post,
          profiles: userProfile,
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

  // ... (handleCopyInvite e handleJoinTelegram seguem iguais)

  return (
    <div className="dashboard-root">
      <style jsx global>{`
        html, body { max-width: 100vw; overflow-x: hidden; background-color: #000; margin: 0; padding: 0; }
        .dashboard-root { background-color: #000; min-height: 100vh; padding-bottom: 140px; width: 100%; }
        .content-container { max-width: 500px; margin: 0 auto; padding: 10px; width: 100%; box-sizing: border-box; }
        .system-post-aura { 
          border: 1px solid rgba(0, 242, 254, 0.3); 
          border-radius: 28px; 
          margin-bottom: 25px; 
          background: linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, rgba(0, 0, 0, 0) 100%); 
        }
      `}</style>

      <div className="content-container">
        <header style={styles.header}>
          <div style={{ flex: 1 }}></div>
          {showTelegramBanner && (
            <motion.button onClick={() => window.open(TELEGRAM_LINK, '_blank')} style={styles.socialButton} animate={{ boxShadow: ["0 0 10px #00f2fe22", "0 0 25px #00f2fe66", "0 0 10px #00f2fe22"] }} transition={{ duration: 2, repeat: Infinity }}>
              <span style={styles.socialText}>QG SINTONIA</span>
            </motion.button>
          )}
        </header>

        {/* Convites aparecem apenas se houver usuário logado */}
        {currentUser && availableInvites.length > 0 && (
          <div style={styles.inviteContainer}>
            <p style={styles.inviteTitle}>● {myInvites.length} ACESSOS DISPONÍVEIS</p>
            <div style={styles.inviteList}>
              {availableInvites.map((inv) => (
                <button key={inv.code} onClick={() => navigator.clipboard.writeText(inv.code)} style={styles.inviteCode}>{inv.code}</button>
              ))}
            </div>
          </div>
        )}
        
        {loading ? (
          <p style={styles.loadingText}>SINTONIZANDO...</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className={post.user_id === SYSTEM_USER_ID ? "system-post-aura" : ""}>
              <PostCard post={post} onOpenThread={() => setSelectedPost(post)} onRefresh={fetchData} />
            </div>
          ))
        )}
      </div>

      {selectedPost && <ThreadDrawer post={selectedPost} onClose={() => setSelectedPost(null)} onRefresh={fetchData} />}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '40px', padding: '20px 5px' },
  socialButton: { background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '100px', padding: '8px 16px', cursor: 'pointer' },
  socialText: { color: '#00f2fe', fontSize: '8px', fontWeight: '900' as const, letterSpacing: '2px' },
  loadingText: { color: '#00f2fe', textAlign: 'center' as const, marginTop: '80px', fontWeight: '900' as const, fontSize: '10px', letterSpacing: '2px', opacity: 0.5 },
  inviteContainer: { backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(0, 242, 254, 0.1)', padding: '30px', borderRadius: '28px', marginBottom: '35px', textAlign: 'center' as const },
  inviteTitle: { color: '#00f2fe', fontSize: '9px', fontWeight: '900' as const, marginBottom: '20px', letterSpacing: '2px', opacity: 0.7 },
  inviteList: { display: 'flex', justifyContent: 'center', gap: '12px' },
  inviteCode: { border: '1px solid rgba(0, 242, 254, 0.4)', color: '#fff', padding: '10px 18px', fontSize: '11px', fontWeight: '900' as const, borderRadius: '12px', background: 'rgba(0, 0, 0, 0.6)', cursor: 'pointer' }
};
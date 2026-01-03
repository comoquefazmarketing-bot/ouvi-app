'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, Mic, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Utilitários e Componentes
import { notifyArrival } from '@/app/dashboard/telegramService';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';
import InstallStories from '@/components/dashboard/InstallStories';

export default function DashboardPage() {
  const [tab, setTab] = useState(0); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      setCurrentUser(user);

      // 1. Perfil e Notificações (Telegram Core)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, welcome_sent')
        .eq('id', user.id)
        .single();

      if (profileData) {
        if (!profileData.welcome_sent) {
          await notifyArrival(profileData.username || "Novo Membro");
          await supabase.from('profiles').update({ welcome_sent: true }).eq('id', user.id);
        }
        
        // Regra do PWA (Sensorial) [cite: 2026-01-01]
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        const hasSeen = localStorage.getItem('ouvi_tutorial_seen');
        if (!isPWA && !hasSeen) {
          setShowTutorial(true);
        }
      }

      // 2. Feed de Áudio (Acesso Direto ao Banco Limpo)
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url');
      const { data: comments } = await supabase.from('audio_comments').select('*');

      const merged = (postsData || []).map(post => ({
        ...post,
        profile: profiles?.find(p => p.id === post.user_id),
        audio_comments: comments?.filter(c => c.post_id === post.id).map(c => ({
          ...c,
          profiles: profiles?.find(p => p.id === c.user_id)
        }))
      }));

      setPosts(merged);
    } catch (err) {
      console.error("Erro na sintonização:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleTutorialComplete = () => {
    localStorage.setItem('ouvi_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  return (
    <>
      <AnimatePresence>
        {showTutorial && <InstallStories onComplete={handleTutorialComplete} />}
      </AnimatePresence>

      <div className="fixed inset-0 bg-black overflow-hidden flex flex-col font-sans select-none">
        
        {/* Header Fixo Minimalista */}
        <div className="flex justify-center gap-8 py-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md z-50">
          <button onClick={() => setTab(0)} className={`text-[10px] font-black tracking-[3px] transition-all ${tab === 0 ? 'text-white' : 'text-zinc-600'}`}>
            PARA VOCÊ
          </button>
          <button onClick={() => setTab(1)} className={`text-[10px] font-black tracking-[3px] transition-all ${tab === 1 ? 'text-white' : 'text-zinc-600'}`}>
            MEU PERFIL
          </button>
        </div>

        {/* Motor de Swipe Sensorial */}
        <motion.div 
          className="flex h-full w-[200vw]"
          animate={{ x: tab === 0 ? '0%' : '-50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        >
          {/* LADO A: FEED */}
          <div className="w-[100vw] h-full overflow-y-auto pb-40 px-4 scrollbar-hide">
            {loading ? (
              <div className="flex flex-col items-center mt-32 gap-4">
                 <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                 <p className="text-zinc-700 text-[9px] font-black tracking-[4px] uppercase italic">Sintonizando</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard 
                  key={post.id} post={post} 
                  onOpenThread={() => setSelectedPost(post)} 
                  currentUserId={currentUser?.id}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                />
              ))
            )}
          </div>

          {/* LADO B: PERFIL (Focado em Posts do Membro) */}
          <div className="w-[100vw] h-full overflow-y-auto pb-40 bg-zinc-950 px-1">
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {posts.filter(p => p.user_id === currentUser?.id).map(post => (
                <div key={post.id} className="aspect-square bg-zinc-900 flex items-center justify-center border border-black/50">
                   <Mic size={18} className="text-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Navigation Bar (Microfone Untouchable) [cite: 2025-12-30] */}
        <nav className="fixed bottom-0 w-full bg-black/95 border-t border-zinc-900 pb-10 pt-4 px-10 flex justify-between items-center z-[100] backdrop-blur-2xl">
          <button onClick={() => setTab(0)} className={tab === 0 ? 'text-white' : 'text-zinc-800'}>
            <Home size={24} fill={tab === 0 ? "white" : "none"} />
          </button>
          
          <button className="text-zinc-800"><Search size={24} /></button>
          
          <button className="bg-white text-black p-4 rounded-full -mt-16 shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-90 transition-all border-4 border-black">
            <Mic size={28} />
          </button>

          <button className="text-zinc-800"><Search size={24} /></button>
          
          <button onClick={() => setTab(1)} className={tab === 1 ? 'text-white' : 'text-zinc-800'}>
            <User size={24} fill={tab === 1 ? "white" : "none"} />
          </button>
        </nav>

        {selectedPost && (
          <ThreadDrawer post={selectedPost} onClose={() => setSelectedPost(null)} onRefresh={fetchData} />
        )}
      </div>
    </>
  );
}
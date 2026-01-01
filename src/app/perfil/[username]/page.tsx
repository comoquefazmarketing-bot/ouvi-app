'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, Mic, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { notifyArrival } from '@/app/dashboard/telegramService';
import PostCard from '@/components/dashboard/Post/PostCard';
import ThreadDrawer from '@/components/dashboard/Threads/ThreadDrawer';
import InstallStories from '@/components/dashboard/InstallStories';

export default function DashboardPage() {
  const [tab, setTab] = useState(0); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myInvites, setMyInvites] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Função para enviar o sinal (convite)
  const handleEnviarConvite = async () => {
    if (myInvites.length === 0) return;

    const codigoParaUsar = myInvites[0].code;
    const emailAmigo = window.prompt(`Você tem ${myInvites.length} chaves. Enviar sinal para qual e-mail?`);
    
    if (!emailAmigo || !emailAmigo.includes('@')) {
      if (emailAmigo) alert("E-mail inválido.");
      return;
    }

    try {
      // Dispara a Edge Function de e-mail (Resend)
      const { error } = await supabase.functions.invoke('resend', {
        body: { 
          to: emailAmigo,
          subject: "🎙️ Seu sinal de acesso ao OUVI",
          html: `<strong>${currentUser?.username || 'Um amigo'}</strong> te enviou uma chave de acesso exclusiva: <h1>${codigoParaUsar}</h1><br>Acesse agora: https://ouvi-app.vercel.app`
        }
      });

      if (error) throw error;

      // Atualiza o status no banco de dados
      await supabase.from('invites').update({ status: 'enviado' }).eq('code', codigoParaUsar);
      
      alert("Sinal enviado com sucesso.");
      
      // Atualiza o estado local imediatamente
      setMyInvites(prev => prev.filter(inv => inv.code !== codigoParaUsar));
      
    } catch (err) {
      console.error("Erro ao enviar convite:", err);
      alert("Erro na sintonização do e-mail.");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      setCurrentUser(user);

      // 1. Perfil e Notificações
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
        
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        const hasSeen = localStorage.getItem('ouvi_tutorial_seen');
        if (!isPWA && !hasSeen) {
          setShowTutorial(true);
        }
      }

      // 2. Busca de Convites Ativos
      const { data: invites } = await supabase
        .from('invites')
        .select('code')
        .eq('owner_id', user.id)
        .eq('status', 'disponivel');
      if (invites) setMyInvites(invites);

      // 3. Feed de Áudio Completo
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
        
        {/* Header Fixo */}
        <div className="flex justify-center gap-8 py-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md z-50">
          <button onClick={() => setTab(0)} className={`text-[10px] font-black tracking-[3px] transition-all ${tab === 0 ? 'text-white' : 'text-zinc-600'}`}>
            PARA VOCÊ
          </button>
          <button onClick={() => setTab(1)} className={`text-[10px] font-black tracking-[3px] transition-all ${tab === 1 ? 'text-white' : 'text-zinc-600'}`}>
            MEU PERFIL
          </button>
        </div>

        {/* Motor de Swipe */}
        <motion.div 
          className="flex h-full w-[200vw]"
          animate={{ x: tab === 0 ? '0%' : '-50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        >
          {/* LADO A: FEED GERAL */}
          <div className="w-[100vw] h-full overflow-y-auto pb-40 px-4 scrollbar-hide">
            
            {/* Botão de Convites Dinâmico */}
            {myInvites.length > 0 && (
              <div className="mt-8 mb-4 flex justify-center">
                <motion.button 
                  onClick={handleEnviarConvite}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0px rgba(255,255,255,0)", 
                      "0 0 15px rgba(255,255,255,0.15)", 
                      "0 0 0px rgba(255,255,255,0)"
                    ]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    repeatDelay: 8,
                    ease: "easeInOut" 
                  }}
                  className="bg-white text-black px-10 py-3 rounded-full text-[11px] font-black tracking-[2px] shadow-2xl active:scale-95 transition-all"
                >
                  {myInvites.length} {myInvites.length === 1 ? 'CONVITE DISPONÍVEL' : 'CONVITES DISPONÍVEIS'}
                </motion.button>
              </div>
            )}

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

          {/* LADO B: GRADE PERFIL */}
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

        {/* Barra de Navegação App-Like */}
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
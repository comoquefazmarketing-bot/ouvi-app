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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Função de sintonização com múltiplas tentativas [cite: 2025-12-30]
  const fetchData = useCallback(async (tentativa = 1) => {
    try {
      setLoading(true);
      
      // Captura as fontes de identidade local
      const manualId = localStorage.getItem("ouvi_session_id");
      const manualEmail = localStorage.getItem("ouvi_user_email");

      // Lógica de Revalidação Estoica: se não achou, tenta até 5 vezes antes de desistir
      if (!manualId && !manualEmail && tentativa <= 5) {
        console.log(`Buscando sinal de identidade... Tentativa ${tentativa}/5`);
        setTimeout(() => fetchData(tentativa + 1), 800);
        return;
      }

      // Se após o loop não houver nada, aí sim redireciona [cite: 2025-12-30]
      if (!manualId && !manualEmail) {
        router.push("/login");
        return;
      }

      // 1. VALIDAÇÃO PELA LISTA DE EMAILS
      // Tenta recuperar o perfil completo do banco usando o e-mail ou ID salvo
      const { data: perfil } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${manualEmail},id.eq.${manualId}`)
        .maybeSingle();

      if (perfil) {
        setCurrentUser(perfil);
        setIsCheckingAuth(false);
      } else if (manualId && manualId !== "temp_id") {
        // Fallback: usa o ID manual se o banco estiver instável
        setCurrentUser({ id: manualId, display_name: localStorage.getItem("ouvi_user_name") });
        setIsCheckingAuth(false);
      }

      // 2. BUSCA DE POSTS (RESOLVENDO AMBIGUIDADE) [cite: 2025-12-30]
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_id (
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
      console.error("Erro na sintonização:", err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Mantém a tela preta enquanto sintoniza a identidade inicial
  if (isCheckingAuth && loading && posts.length === 0) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid #333', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="dashboard-root" style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: '20px 0' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {loading && posts.length === 0 ? (
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
                  onRefresh={() => fetchData(1)} 
                />
              ))
            ) : (
              <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px', fontSize: '12px', letterSpacing: '2px' }}>NENHUM SINAL ENCONTRADO.</p>
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
          onRefresh={() => fetchData(1)} 
        />
      )}
    </div>
  );
}
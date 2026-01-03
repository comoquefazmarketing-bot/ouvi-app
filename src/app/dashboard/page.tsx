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

  const fetchData = useCallback(async (tentativa = 1) => {
    try {
      setLoading(true);
      
      // 1. CAPTURA DO SINAL DE E-MAIL (ÂNCORA) [cite: 2025-12-30]
      const savedEmail = localStorage.getItem("ouvi_user_email");
      const manualId = localStorage.getItem("ouvi_session_id");

      // Lógica de Revalidação: tenta 5 vezes sintonizar o e-mail antes de desistir
      if (!savedEmail && tentativa <= 5) {
        console.log(`Buscando e-mail no sinal... Tentativa ${tentativa}/5`);
        setTimeout(() => fetchData(tentativa + 1), 800);
        return;
      }

      if (!savedEmail) {
        router.push("/login");
        return;
      }

      // 2. CONFRONTO DE INFORMAÇÕES (PERFIL OFICIAL) [cite: 2025-12-30]
      // Buscamos o perfil completo para garantir nome e avatar corretos
      const { data: perfil, error: perfilError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', savedEmail)
        .maybeSingle();

      if (perfil) {
        setCurrentUser(perfil);
        // Sincroniza o LocalStorage com a verdade do banco
        localStorage.setItem("ouvi_session_id", perfil.id);
        localStorage.setItem("ouvi_user_name", perfil.display_name || "");
        localStorage.setItem("ouvi_user_avatar", perfil.avatar_url || "");
        setIsCheckingAuth(false);
      } else {
        // Se o e-mail existe na lista mas não tem perfil, criamos um estado temporário
        console.warn("Perfil não localizado para o e-mail:", savedEmail);
        setCurrentUser({ email: savedEmail, display_name: "Usuário em Sintonização" });
        setIsCheckingAuth(false);
      }

      // 3. BUSCA DE POSTS E HISTÓRICO [cite: 2025-12-30]
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
      console.error("Erro na sintonização de histórico:", err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Enquanto estiver checando a identidade, mantém o ambiente em silêncio (preto)
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
              <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px', fontSize: '12px', letterSpacing: '2px' }}>NENHUM SINAL ENCONTRADO NO HISTÓRICO.</p>
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
/**
 * PROJETO OUVI – ThreadDrawer ELITE (Sintonizado)
 * Ajuste: Histórico completo e estrutura de gatilho sensorial
 */

"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ReplyInput from './ReplyInput'; // Onde está o Mic de Pressão
import CommentItem from './CommentItem';

export default function ThreadDrawer({ post, onClose }: { post: any, onClose: () => void }) {
  const [replies, setReplies] = useState<any[]>([]);

  // Função mestre para carregar a conversa sintonizada
  const fetchReplies = async () => {
    if (!post?.id) return;
    
    // Buscamos da tabela de replies (ajuste o nome se for audio_comments no seu banco)
    const { data } = await supabase
      .from('audio_comments') 
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    setReplies(data || []);
  };

  useEffect(() => {
    fetchReplies();
  }, [post?.id]);

  if (!post) return null;

  return (
    <AnimatePresence mode="wait">
      {/* OVERLAY SENSORIAL */}
      <motion.div 
        key="drawer-overlay"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose} 
        style={styles.overlay} 
      />
      
      {/* CONTEÚDO DA GAVETA (DRAWER) */}
      <motion.div 
        key={`drawer-content-${post.id}`}
        initial={{ y: "100%", x: "-50%" }} 
        animate={{ y: 0, x: "-50%" }} 
        exit={{ y: "100%", x: "-50%" }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        style={styles.drawer}
      >
        
        {/* HANDLE DE FECHAMENTO */}
        <div style={styles.handleWrapper} onClick={onClose}>
          <div style={styles.handleBar} />
        </div>

        <div style={styles.scrollContent}>
          {/* POST ORIGINAL (HEADER DA THREAD) */}
          <div style={styles.headerPost}>
             <h4 style={styles.authorTitle}>
               {(post.profiles?.username || post.profiles?.full_name || "MEMBRO OUVI")}
             </h4>
             <p style={styles.postText}>{post.content}</p>
          </div>

          {/* LISTA DE RESPOSTAS (TEXTO + ÁUDIO) */}
          <div style={styles.repliesContainer}>
             {replies.length > 0 ? (
               replies.map((r, index) => (
                 <CommentItem 
                   key={r.id || `reply-${index}`} 
                   comment={r} 
                   allComments={replies} // Para recursividade se houver
                 />
               ))
             ) : (
               <p style={styles.emptyText}>Silêncio sintonizado...</p>
             )}
          </div>
        </div>

        {/* INPUT DE RESPOSTA (O CORE DO MIC) */}
        <div style={styles.inputWrapper}>
          <ReplyInput 
            postId={post.id} 
            onRefresh={fetchReplies} // Faz a lista atualizar após o "soltar" do mic
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  overlay: { 
    position: 'fixed' as const, inset: 0, 
    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, 
    backdropFilter: 'blur(15px)' 
  },
  drawer: { 
    position: 'fixed' as const, bottom: 0, left: '50%',
    width: '100%', maxWidth: '500px', height: '88vh', 
    backgroundColor: '#050505', zIndex: 1000, 
    borderTopLeftRadius: '35px', borderTopRightRadius: '35px', 
    display: 'flex', flexDirection: 'column' as const, 
    overflow: 'hidden', border: '1px solid #111',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
  },
  handleWrapper: { padding: '20px 0', cursor: 'pointer' },
  handleBar: { width: '45px', height: '5px', backgroundColor: '#222', borderRadius: '10px', margin: '0 auto' },
  scrollContent: { flex: 1, overflowY: 'auto' as const, padding: '0 25px 140px 25px' },
  headerPost: { paddingBottom: '25px', borderBottom: '1px solid #111' },
  authorTitle: { color: '#00f2fe', fontSize: '11px', fontWeight: '900' as const, textTransform: 'uppercase' as const, letterSpacing: '1px' },
  postText: { color: '#fff', fontSize: '16px', marginTop: '10px', lineHeight: '1.4' },
  repliesContainer: { marginTop: '30px', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  emptyText: { color: '#333', fontSize: '10px', textAlign: 'center' as const, marginTop: '40px', fontWeight: '900' as const, letterSpacing: '2px' },
  inputWrapper: { 
    position: 'absolute' as const, bottom: 0, width: '100%', 
    backgroundColor: '#050505', paddingBottom: 'env(safe-area-inset-bottom)',
    borderTop: '1px solid #111'
  }
};
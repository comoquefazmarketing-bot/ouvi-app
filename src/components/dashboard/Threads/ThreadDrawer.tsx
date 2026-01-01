/**
 * PROJETO OUVI – ThreadDrawer ELITE (Showcase 2026)
 * Ajuste: Suporte para Thread da Thread (Escada) e Gerenciamento Sensorial
 */

"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ReplyInput from './ReplyInput'; 
import CommentItem from './CommentItem';

export default function ThreadDrawer({ post, onClose }: { post: any, onClose: () => void }) {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ESTADO SENSORIAL: Gerencia a quem estamos respondendo na escada
  const [replyingTo, setReplyingTo] = useState<{id: string, username: string} | null>(null);

  const fetchReplies = useCallback(async () => {
    if (!post?.id) return;
    setLoading(true);
    
    try {
      // 1. BUSCA SIMPLES (Evita o Erro 400)
      const { data: comments, error: commError } = await supabase
        .from('audio_comments') 
        .select('*') 
        .eq('post_id', post.id)
        .order('created_at', { ascending: true }); // Ascendente para a lógica da escada
      
      if (commError) throw commError;

      // 2. BUSCA PERFIS
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url');

      // 3. ENRIQUECIMENTO MANUAL
      const enrichedData = (comments || []).map(comm => {
        const foundProfile = profiles?.find(p => p.id === comm.user_id);
        return {
          ...comm,
          profiles: foundProfile,
          display_name: foundProfile?.username || comm.username || "MEMBRO OUVI",
          avatar_url: foundProfile?.avatar_url || "/default-avatar.png"
        };
      });

      setReplies(enrichedData);
    } catch (err) {
      console.error("Falha na sintonização das vozes:", err);
    } finally {
      setLoading(false);
    }
  }, [post?.id]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  // Função disparada quando clicar no 🎙️ da ReactionBar de um comentário
  const handleReplyToComment = (comment: any) => {
    setReplyingTo({
      id: comment.id,
      username: comment.profiles?.username || comment.username || "membro"
    });
  };

  if (!post) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="drawer-overlay"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose} 
        style={styles.overlay} 
      />
      
      <motion.div 
        key={`drawer-content-${post.id}`}
        initial={{ y: "100%", x: "-50%" }} 
        animate={{ y: 0, x: "-50%" }} 
        exit={{ y: "100%", x: "-50%" }}
        transition={{ type: "spring", damping: 30, stiffness: 250 }}
        style={styles.drawer}
      >
        <div style={styles.handleWrapper} onClick={onClose}>
          <div style={styles.handleBar} />
        </div>

        <div style={styles.scrollContent}>
          {/* POST ORIGINAL */}
          <div style={styles.headerPost}>
             <h4 style={styles.authorTitle}>
                {post.profiles?.username || post.username || "AUTOR"}
             </h4>
             <p style={styles.postText}>
                {post.content || post.text || "Sintonizando descrição..."}
             </p>
          </div>

          {/* LISTA DE RESPOSTAS (ESTILO ESCADA) */}
          <div style={styles.repliesContainer}>
             {replies.length > 0 ? (
               replies.map((r) => (
                 <div 
                   key={r.id} 
                   style={{
                     marginLeft: r.parent_id ? "35px" : "0px",
                     borderLeft: r.parent_id ? "1px solid rgba(0, 242, 254, 0.15)" : "none",
                     paddingLeft: r.parent_id ? "15px" : "0px"
                   }}
                 >
                    <CommentItem 
                      comment={r} 
                      allComments={replies}
                      // Passamos o gatilho sensorial para o ReactionBar dentro do CommentItem
                      onReplyClick={() => handleReplyToComment(r)}
                    />
                 </div>
               ))
             ) : (
               <div style={styles.emptyContainer}>
                 <p style={styles.emptyText}>
                   {loading ? "SINTONIZANDO..." : "SILÊNCIO SINTONIZADO..."}
                 </p>
               </div>
             )}
          </div>
        </div>

        {/* REATOR DE RESPOSTA (DINÂMICO) */}
        <div style={styles.inputWrapper}>
          <ReplyInput 
            postId={post.id} 
            parentId={replyingTo?.id} // Passa o ID se for resposta
            parentUsername={replyingTo?.username} // Passa o nome para o UI
            onCancelReply={() => setReplyingTo(null)} // Botão X no input
            onRefresh={() => {
              fetchReplies();
              setReplyingTo(null); // Limpa após enviar
            }} 
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 999, backdropFilter: 'blur(10px)' },
  drawer: { position: 'fixed' as const, bottom: 0, left: '50%', width: '100%', maxWidth: '500px', height: '85vh', backgroundColor: '#050505', zIndex: 1000, borderTopLeftRadius: '35px', borderTopRightRadius: '35px', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', border: '1px solid #1a1a1a', boxSizing: 'border-box' as const },
  handleWrapper: { padding: '15px 0', cursor: 'pointer', flexShrink: 0 },
  handleBar: { width: '40px', height: '4px', backgroundColor: '#333', borderRadius: '10px', margin: '0 auto' },
  scrollContent: { flex: 1, overflowY: 'auto' as const, padding: '0 20px 140px 20px', WebkitOverflowScrolling: 'touch' as const },
  headerPost: { padding: '10px 0 20px 0', borderBottom: '1px solid #111' },
  authorTitle: { color: '#00f2fe', fontSize: '10px', fontWeight: '900' as const, letterSpacing: '2px', textTransform: 'uppercase' as const },
  postText: { color: '#fff', fontSize: '16px', marginTop: '10px', lineHeight: '1.4', fontWeight: '400' },
  repliesContainer: { marginTop: '25px', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  emptyContainer: { marginTop: '60px', textAlign: 'center' as const },
  emptyText: { color: '#222', fontSize: '9px', fontWeight: '900' as const, letterSpacing: '3px' },
  inputWrapper: { position: 'absolute' as const, bottom: 0, width: '100%', backgroundColor: '#050505', borderTop: '1px solid #111', paddingBottom: 'env(safe-area-inset-bottom)', boxSizing: 'border-box' as const, zIndex: 10 }
};
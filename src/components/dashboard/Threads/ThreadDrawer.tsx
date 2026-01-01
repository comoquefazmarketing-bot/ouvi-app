/**
 * PROJETO OUVI – ThreadDrawer ELITE (Showcase Família)
 * Ajuste: Bypass de perfil para garantir que comentários apareçam sempre.
 */

"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ReplyInput from './ReplyInput'; 
import CommentItem from './CommentItem';

export default function ThreadDrawer({ post, onClose }: { post: any, onClose: () => void }) {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReplies = async () => {
    if (!post?.id) return;
    setLoading(true);
    
    try {
      // Mudança de Segurança: Buscamos da tabela mas tratamos o perfil como opcional
      const { data, error } = await supabase
        .from('audio_comments') 
        .select('*, profiles(username, avatar_url)') // Busca o perfil se existir
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Se r.profiles for nulo, usamos o r.username gravado direto na tabela
      const enrichedData = (data || []).map(r => ({
        ...r,
        display_name: r.profiles?.username || r.username || "MEMBRO OUVI"
      }));

      setReplies(enrichedData);
    } catch (err) {
      console.error("Erro ao sintonizar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [post?.id]);

  if (!post) return null;

  return (
    <AnimatePresence mode="wait">
      {/* OVERLAY SENSORIAL - MAIS ESCURO PARA FOCO TOTAL */}
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
                {(post.profiles?.username || post.username || "MEMBRO OUVI")}
             </h4>
             <p style={styles.postText}>{post.content}</p>
          </div>

          {/* LISTA DE RESPOSTAS */}
          <div style={styles.repliesContainer}>
             {replies.length > 0 ? (
               replies.map((r) => (
                 <CommentItem 
                   key={r.id} 
                   comment={r} 
                   allComments={replies}
                 />
               ))
             ) : (
               <p style={styles.emptyText}>
                 {loading ? "Sintonizando..." : "Silêncio sintonizado..."}
               </p>
             )}
          </div>
        </div>

        {/* REATOR SENSORIAL - FIXADO NO RODAPÉ SEM VAZAR */}
        <div style={styles.inputWrapper}>
          <ReplyInput 
            postId={post.id} 
            onRefresh={fetchReplies} 
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  overlay: { 
    position: 'fixed' as const, inset: 0, 
    backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 999, 
    backdropFilter: 'blur(10px)' 
  },
  drawer: { 
    position: 'fixed' as const, bottom: 0, left: '50%',
    width: '100%', maxWidth: '500px', height: '85vh', 
    backgroundColor: '#050505', zIndex: 1000, 
    borderTopLeftRadius: '35px', borderTopRightRadius: '35px', 
    display: 'flex', flexDirection: 'column' as const, 
    overflow: 'hidden', border: '1px solid #1a1a1a'
  },
  handleWrapper: { padding: '15px 0', cursor: 'pointer', flexShrink: 0 },
  handleBar: { width: '40px', height: '4px', backgroundColor: '#333', borderRadius: '10px', margin: '0 auto' },
  scrollContent: { 
    flex: 1, 
    overflowY: 'auto' as const, 
    padding: '0 20px 120px 20px', // Padding inferior alto para não cobrir comentários
    WebkitOverflowScrolling: 'touch' as const
  },
  headerPost: { paddingBottom: '20px', borderBottom: '1px solid #111' },
  authorTitle: { color: '#00f2fe', fontSize: '10px', fontWeight: '900' as const, letterSpacing: '2px' },
  postText: { color: '#fff', fontSize: '15px', marginTop: '8px', lineHeight: '1.4', opacity: 0.9 },
  repliesContainer: { marginTop: '25px', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  emptyText: { color: '#222', fontSize: '9px', textAlign: 'center' as const, marginTop: '60px', fontWeight: '900' as const, letterSpacing: '3px' },
  inputWrapper: { 
    position: 'absolute' as const, bottom: 0, width: '100%', 
    backgroundColor: '#050505', borderTop: '1px solid #111',
    paddingBottom: 'env(safe-area-inset-bottom)'
  }
};
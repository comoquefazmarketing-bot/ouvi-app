"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

export default function PostActions({ post, onOpenThread }: { post: any, onOpenThread: (post: any) => void }) {
  
  // Configuração sensorial para os ícones
  const iconVariants = {
    tap: { scale: 0.8 },
    hover: { scale: 1.1, opacity: 1 }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '10px 20px', 
      backgroundColor: '#050505', 
      borderRadius: '100px', 
      marginTop: '10px', 
      border: '1px solid #151515' 
    }}>
      
      {/* GRUPO SENSORIAL: EMOJIS + NÚMEROS REAIS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        
        {/* LIKES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.span 
            variants={iconVariants} whileTap="tap" whileHover="hover"
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            🤍
          </motion.span>
          <span style={{ color: '#444', fontSize: '12px', fontWeight: '800' }}>
            {post.likes_count || 0}
          </span>
        </div>

        {/* COMENTÁRIOS / THREADS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.span 
            variants={iconVariants} whileTap="tap" whileHover="hover"
            onClick={() => onOpenThread(post)}
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            💬
          </motion.span>
          <span style={{ color: '#444', fontSize: '12px', fontWeight: '800' }}>
            {post.comments_count || 0}
          </span>
        </div>

        {/* PORTAL DO MICROFONE (DISCRETO E PULSANDO) */}
        <motion.div 
          onClick={() => onOpenThread(post)}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Mic size={20} color="white" />
        </motion.div>

        {/* FLASH / ZAPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.span 
            variants={iconVariants} whileTap="tap" whileHover="hover"
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            ⚡
          </motion.span>
          <span style={{ color: '#444', fontSize: '12px', fontWeight: '800' }}>
            {post.zaps_count || 0}
          </span>
        </div>
      </div>

      {/* BOTÃO DE AÇÃO DIREITA */}
      <motion.button
        onClick={() => onOpenThread(post)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          backgroundColor: '#00f2fe',
          color: '#000',
          border: 'none',
          borderRadius: '25px',
          padding: '10px 18px',
          fontSize: '10px',
          fontWeight: '900',
          cursor: 'pointer',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}
      >
        O QUE ESTÃO FALANDO...
      </motion.button>
    </div>
  );
}
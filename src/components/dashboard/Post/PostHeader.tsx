"use client";
import React, { useState, useEffect } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

interface PostHeaderProps {
  postUserId: string;
  postId: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export default function PostHeader({ postUserId, postId, username, avatarUrl, createdAt }: PostHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Busca o ID do utilizador logado de forma direta
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    getUser();
  }, []);

  async function handleDelete() {
    const confirmDelete = confirm("Deseja apagar essa memória?");
    if (confirmDelete) {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (!error) {
        window.location.reload();
      } else {
        alert("Erro ao excluir.");
      }
    }
  }

  const dateLabel = createdAt 
    ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : "";

  // Verifica se é o dono
  const isOwner = userId === postUserId;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* AVATAR */}
        <div style={{ 
          width: '38px', height: '38px', borderRadius: '50%', 
          overflow: 'hidden', border: '1px solid #222',
          background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User" />
          ) : (
            <span style={{ color: '#000', fontWeight: '900', fontSize: '14px' }}>
              {username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* INFO */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#fff', fontWeight: '900', fontSize: '14px' }}>{username}</span>
          <span style={{ color: '#444', fontSize: '10px', fontWeight: '700' }}>{dateLabel}</span>
        </div>
      </div>

      {/* BOTÃO (...) */}
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowMenu(!showMenu)} // Agora ele abre sempre para testarmos
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}
        >
          <MoreHorizontal size={22} color={isOwner ? "#fff" : "#333"} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', right: 0, top: '40px', backgroundColor: '#111',
                borderRadius: '15px', padding: '10px', zIndex: 999, border: '1px solid #222',
                minWidth: '140px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              {isOwner ? (
                <button 
                  onClick={handleDelete}
                  style={{ 
                    background: '#1a0000', border: '1px solid #330000', color: '#ff4444', 
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', 
                    fontSize: '11px', fontWeight: '900', width: '100%', padding: '10px', borderRadius: '8px' 
                  }}
                >
                  <Trash2 size={14} /> EXCLUIR POST
                </button>
              ) : (
                <span style={{ color: '#444', fontSize: '10px', padding: '10px', display: 'block' }}>
                  Sem opções para este post
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
/**
 * PROJETO OUVI — Dashboard Consolidado com Core de Voz Injetado
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\page.tsx
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle } from 'lucide-react';

// CAMINHOS DE NAVEGAÇÃO
import ThreadDrawer from "@/components/dashboard/Threads/ThreadDrawer";
import TabBar from "@/components/dashboard/Navigation/TabBar"; 
import ActionDrawer from "@/components/dashboard/Navigation/ActionDrawer"; 

const PostCard = ({ post, currentUserId, onRefresh }: { post: any, currentUserId: string | null, onRefresh: () => void }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  // REFERÊNCIAS DO HARDWARE (EXTRAÍDAS DO REACTIONBAR)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const profile = post.profiles || { username: "pioneiro_ouvi", avatar_url: null };

  // --- LÓGICA DE GRAVAÇÃO (CORE NATIVO) ---
  const startRecording = async (e: any) => {
    e.stopPropagation();
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fileName = `${Date.now()}-${currentUserId}.webm`;
        const path = `feed/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from("audio-comments").upload(path, blob);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("audio-comments").getPublicUrl(path);
          
          await supabase.from("audio_comments").insert({
            post_id: post.id,
            audio_url: publicUrl,
            user_id: currentUserId,
            username: "membro",
            content: "🎙️ Voz do Feed",
            reactions: { loved_by: [], energy: 0 }
          });
          
          if (onRefresh) onRefresh();
        }
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setRecording(true);
    } catch (err) { console.warn("Acesso ao microfone negado."); }
  };

  const stopRecording = (e: any) => {
    e.stopPropagation();
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;
    setHasLiked(true);
    setLikes((prev: number) => prev + 1);
    await supabase.from("posts").update({ likes: (post.likes || 0) + 1 }).eq("id", post.id);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={styles.card}>
        <div style={styles.userRow}>
          <div style={{...styles.avatar, backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : 'none'}} />
          <div style={styles.userInfo}>
            <span style={styles.username}>@{profile.username}</span>
            <span style={styles.time}>OUVINDO AGORA</span>
          </div>
        </div>

        <div style={styles.mediaFrame}>
          {post.video_url ? (
            <video src={post.video_url} style={styles.media} autoPlay muted loop playsInline />
          ) : post.image_url ? (
            <img src={post.image_url} style={styles.media} alt="Post" />
          ) : (
            <div style={styles.audioPlaceholder}>
               <span style={{color: "#00f2fe", fontSize: "10px", fontWeight: "bold", letterSpacing: "2px"}}>SOM ATIVO</span>
            </div>
          )}
        </div>

        <div style={styles.interactionBar}>
          <div style={styles.iconGroup}>
            <button onClick={handleLike} style={styles.iconBtn}>
              <Heart size={22} color={hasLiked ? "#ff4444" : "#666"} fill={hasLiked ? "#ff4444" : "none"} />
            </button>
            <button onClick={() => setIsThreadOpen(true)} style={styles.iconBtn}>
              <MessageCircle size={22} color="#666" />
            </button>
            
            <div style={styles.micWrapper}>
               <AnimatePresence>
                 {recording && (
                   <motion.div 
                     initial={{ scale: 1, opacity: 0.6 }} 
                     animate={{ scale: 2.5, opacity: 0 }} 
                     transition={{ repeat: Infinity, duration: 1 }} 
                     style={styles.wave} 
                   />
                 )}
               </AnimatePresence>
               <button 
                 onPointerDown={startRecording} 
                 onPointerUp={stopRecording}
                 style={{
                   ...styles.micBtn, 
                   color: recording ? "#ff4444" : "#666",
                   transform: recording ? "scale(1.3)" : "scale(1)"
                 }}
               >
                 <span style={{ fontSize: "20px" }}>🎙️</span>
               </button>
            </div>
          </div>
          <button onClick={() => setIsThreadOpen(true)} style={styles.talkBtn}>O QUE ESTÃO FALANDO...</button>
        </div>
      </motion.div>
      {isThreadOpen && <ThreadDrawer post={post} onClose={() => setIsThreadOpen(false)} />}
    </>
  );
};

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    const { data } = await supabase
      .from("posts")
      .select(`*, profiles!left (username, avatar_url)`)
      .order("created_at", { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => {
    fetchFeed();
    const channel = supabase.channel('feed-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchFeed())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    // Removido 'fixed' e 'overflow-hidden' para permitir o scroll natural do feed
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header Fixo no topo com desfoque */}
      <div className="sticky top-0 w-full flex justify-center py-6 border-b border-white/5 bg-black/80 backdrop-blur-md z-50">
        <span className="text-white font-black tracking-[0.5em] text-[12px] italic">OUVI</span>
      </div>

      {/* Área do Feed com preenchimento para não sumir atrás da TabBar */}
      <div className="flex-1 px-4 pt-4 pb-40">
        <div className="max-w-[500px] mx-auto space-y-8">
          {posts.map(p => (
            <PostCard 
              key={p.id} 
              post={p} 
              currentUserId={currentUserId} 
              onRefresh={fetchFeed} 
            />
          ))}
        </div>
      </div>

      {/* TabBar fixa no rodapé com camada superior */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[100] pointer-events-none">
        <div className="pointer-events-auto px-6 w-full flex justify-center">
          <TabBar onPlusClick={() => setIsDrawerOpen(true)} />
        </div>
      </div>

      <ActionDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}

const styles = {
  card: { background: "#080808", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.03)" },
  userRow: { padding: "12px 15px", display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", backgroundSize: "cover", border: "1px solid #00f2fe" },
  userInfo: { display: "flex", flexDirection: "column" as const },
  username: { color: "#fff", fontSize: "12px", fontWeight: "900" as const },
  time: { color: "#00f2fe", fontSize: "8px", fontWeight: "bold" as const },
  mediaFrame: { width: "100%", aspectRatio: "1/1", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" },
  media: { width: "100%", height: "100%", objectFit: "cover" as const },
  interactionBar: { padding: "12px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  iconGroup: { display: "flex", gap: "18px", alignItems: "center" },
  iconBtn: { background: "none", border: "none", cursor: "pointer" },
  micWrapper: { position: "relative" as const, display: "flex", alignItems: "center", justifyContent: "center" },
  micBtn: { background: "none", border: "none", cursor: "pointer", transition: "0.2s" },
  wave: { position: "absolute" as const, width: "30px", height: "30px", borderRadius: "50%", border: "2px solid rgba(255, 0, 0, 0.4)", pointerEvents: "none" as const },
  talkBtn: { background: "rgba(0,242,254,0.05)", padding: "8px 16px", borderRadius: "20px", color: "#00f2fe", fontSize: "9px", fontWeight: "900" as const, border: "1px solid rgba(0,242,254,0.15)" },
  audioPlaceholder: { display: "flex", alignItems: "center", justifyContent: "center" }
};
/**
 * PROJETO OUVI — Dashboard Consolidado
 * Local: E:\OUVI\ouvi-app\src\app\dashboard\page.tsx
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from 'lucide-react';

// CAMINHOS CORRIGIDOS BASEADOS NA SUA ESTRUTURA DE PASTAS
import ThreadDrawer from "@/components/dashboard/Threads/ThreadDrawer";
import TabBar from "@/components/dashboard/Navigation/TabBar"; 
import ActionDrawer from "@/components/dashboard/Navigation/ActionDrawer"; 
import AudioRecorder from "@/components/Audio/AudioRecorder"; 

const PostCard = ({ post, currentUserId, onRefresh }: { post: any, currentUserId: string | null, onRefresh: () => void }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  const profile = post.profiles || { username: "pioneiro_ouvi", avatar_url: null };

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
            
            {/* MICROFONE CORE INTEGRADO */}
            <div style={styles.micWrapper}>
               <AudioRecorder postId={post.id} onUploadComplete={onRefresh} />
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
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <div className="flex justify-center py-6 border-b border-white/5 bg-black/50 backdrop-blur-md z-50">
        <span className="text-white font-black tracking-[0.5em] text-[12px] italic">OUVI</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40">
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

      <div className="fixed bottom-6 w-full flex justify-center px-6 z-[100]">
        <TabBar onPlusClick={() => setIsDrawerOpen(true)} />
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
  username: { color: "#fff", fontSize: "12px", fontWeight: "900" },
  time: { color: "#00f2fe", fontSize: "8px", fontWeight: "bold" },
  mediaFrame: { width: "100%", aspectRatio: "1/1", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" },
  media: { width: "100%", height: "100%", objectFit: "cover" as const },
  interactionBar: { padding: "12px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  iconGroup: { display: "flex", gap: "18px", alignItems: "center" },
  iconBtn: { background: "none", border: "none", cursor: "pointer" },
  micWrapper: { transform: "scale(0.75)", marginTop: "-2px" },
  talkBtn: { background: "rgba(0,242,254,0.05)", padding: "8px 16px", borderRadius: "20px", color: "#00f2fe", fontSize: "9px", fontWeight: "900", border: "1px solid rgba(0,242,254,0.15)" },
  audioPlaceholder: { display: "flex", alignItems: "center", justifyContent: "center" }
};
/**
 * PROJETO OUVI — ThreadDrawer Consolidado
 * Autor: Felipe Makarios
 * Ajuste: Integração de Respostas Hierárquicas e Ergonomia
 */

"use client";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";

export default function ThreadDrawer({ post, onClose }: { post: any; onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [recording, setRecording] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{username: string} | null>(null);
  const [replyingTo, setReplyingTo] = useState<{id: string, username: string} | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (profile) setUserProfile(profile);
      }
    };
    loadUserData();
    fetchComments();
  }, [post.id]);

  useEffect(() => {
    if (comments.length > 0) scrollToBottom();
  }, [comments]);

  const fetchComments = async () => {
    if (!post?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("audio_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    
    if (!error && data) {
      // Organiza: Pai seguido de seus respectivos Filhos
      const mainComments = data.filter(c => !c.parent_id);
      const replies = data.filter(c => c.parent_id);
      const structured: any[] = [];
      mainComments.forEach(main => {
        structured.push(main);
        const children = replies.filter(r => r.parent_id === main.id);
        structured.push(...children);
      });
      setComments(structured);
    }
    setLoading(false);
  };

  const startRecording = async () => {
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
        const path = `threads/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from("audio-comments").upload(path, blob);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("audio-comments").getPublicUrl(path);
          await supabase.from("audio_comments").insert({
            post_id: post.id,
            parent_id: replyingTo?.id || null,
            audio_url: publicUrl,
            user_id: currentUserId,
            username: userProfile?.username || "membro",
            content: replyingTo ? `🎙️ Resposta para @${replyingTo.username}` : "🎙️ Voz na Thread",
            reactions: { loved_by: [], energy: 0 }
          });
          setReplyingTo(null);
          fetchComments();
        }
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setRecording(true);
    } catch (err) { console.warn("Mic off"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim() || !currentUserId) return;
    const { error } = await supabase.from("audio_comments").insert({
      post_id: post.id, 
      username: userProfile?.username || "membro_ouvi", 
      content: inputText.trim(), 
      user_id: currentUserId,
      parent_id: replyingTo?.id || null,
      reactions: { loved_by: [], energy: 0 }
    });

    if (!error) {
      setInputText("");
      setReplyingTo(null);
      fetchComments();
    }
  };

  return (
    <div style={styles.masterWrapper}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={styles.backdrop} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} style={styles.drawer}>
        
        <div style={styles.header}>
          <div style={styles.dragHandle} />
          <h2 style={styles.title}>Conversas em <span style={styles.username}>@{post.profiles?.username || 'post'}</span></h2>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.status}>SINTONIZANDO...</div>
          ) : (
            <div style={styles.commentList}>
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  style={{
                    ...styles.commentRow,
                    marginLeft: comment.parent_id ? "24px" : "0px",
                    borderLeft: comment.parent_id ? "2px solid rgba(0, 242, 254, 0.2)" : "none",
                    paddingLeft: comment.parent_id ? "16px" : "0px"
                  }}
                >
                  <span style={styles.commentUser}>@{comment.username}</span>
                  <div style={styles.audioArea}>
                    {comment.audio_url ? (
                      <audio controls src={comment.audio_url} style={styles.nativeAudio} />
                    ) : (
                      <p style={styles.commentText}>{comment.content}</p>
                    )}
                  </div>
                  
                  {/* ReactionBar com acionador de resposta embutido */}
                  <ReactionBar 
                    postId={post.id} 
                    commentId={comment.id} 
                    initialReactions={comment.reactions}
                    onOpenThread={() => setReplyingTo({ id: comment.id, username: comment.username })}
                  />
                  {!comment.parent_id && <div style={styles.separator} />}
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        {/* INPUT FIXO NO RODAPÉ - ESTILO BLACK PIANO */}
        <div style={styles.footerBlackPiano}>
          <AnimatePresence>
            {replyingTo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={styles.replyBadge}>
                <span style={styles.replyText}>Respondendo a <b style={{color: '#fff'}}>@{replyingTo.username}</b></span>
                <div onClick={() => setReplyingTo(null)} style={styles.cancelIconWrapper}>✕</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={styles.inputBar}>
            <button 
              onPointerDown={startRecording} 
              onPointerUp={stopRecording}
              style={{...styles.micBtn, color: recording ? "#ff4444" : "#00FFFF"}}
            >
              {recording ? "🔴" : "🎙️"}
            </button>
            <input 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder={replyingTo ? `Responder @${replyingTo.username}...` : "Diga algo..."} 
              style={styles.textInput} 
            />
            <button onClick={handleSendText} style={styles.sendBtn}>➤</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  masterWrapper: { position: "fixed" as const, inset: 0, zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "flex-end", pointerEvents: "none" as const },
  backdrop: { position: "absolute" as const, inset: 0, background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(12px)", pointerEvents: "auto" as const },
  drawer: { position: "relative" as const, width: "100%", maxWidth: "480px", height: "88vh", background: "#080808", borderRadius: "32px 32px 0 0", display: "flex", flexDirection: "column" as const, pointerEvents: "auto" as const, borderTop: "1px solid rgba(255,255,255,0.05)" },
  header: { padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)" },
  dragHandle: { width: "36px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", margin: "0 auto 12px" },
  title: { color: "rgba(255,255,255,0.5)", fontSize: "12px", textAlign: "center" as const, fontWeight: "600" },
  username: { color: "#00FFFF" },
  content: { flex: 1, overflowY: "auto" as const, padding: "20px", scrollbarWidth: "none" as const },
  commentList: { display: "flex", flexDirection: "column" as const, gap: "8px" },
  commentRow: { marginBottom: "12px" },
  commentUser: { color: "#00FFFF", fontSize: "11px", fontWeight: "900" as const, letterSpacing: "0.5px" },
  commentText: { color: "#ccc", fontSize: "14px", marginTop: "4px", lineHeight: "1.4" },
  audioArea: { margin: "8px 0" },
  nativeAudio: { width: "100%", height: "32px", filter: "invert(1) hue-rotate(180deg)" },
  separator: { height: "1px", background: "rgba(255,255,255,0.03)", marginTop: "16px" },
  footerBlackPiano: { background: "#000", padding: "16px 20px 34px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" },
  replyBadge: { background: "rgba(0, 242, 254, 0.1)", borderRadius: "12px", padding: "8px 12px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(0, 242, 254, 0.2)" },
  replyText: { color: "#00FFFF", fontSize: "11px", fontWeight: "600" },
  cancelIconWrapper: { cursor: "pointer", color: "#00FFFF", fontSize: "12px", fontWeight: "900" },
  inputBar: { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "100px", padding: "4px 12px", gap: "8px" },
  micBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "8px" },
  textInput: { flex: 1, background: "transparent", border: "none", color: "#fff", padding: "10px", outline: "none", fontSize: "14px" },
  sendBtn: { background: "none", border: "none", color: "#00FFFF", fontSize: "20px", cursor: "pointer", padding: "8px" },
  status: { color: "#444", textAlign: "center" as const, marginTop: "50px", fontSize: "12px", fontWeight: "900", letterSpacing: "2px" }
};
"use client";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import ReactionBar from "./ReactionBar";

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
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
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
      // Organiza os comentários: Pais primeiro, depois as respostas logo abaixo deles
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

  const handleSendText = async () => {
    if (!inputText.trim() || !currentUserId) return;
    const textToSubmit = inputText.trim();
    const finalContent = replyingTo ? `@${replyingTo.username} ${textToSubmit}` : textToSubmit;
    const parentId = replyingTo?.id || null;

    setInputText("");
    setReplyingTo(null);

    const { error } = await supabase.from("audio_comments").insert({
      post_id: post.id, 
      username: userProfile?.username || "membro_ouvi", 
      content: finalContent, 
      user_id: currentUserId,
      parent_id: parentId
    });

    if (error) {
      alert(`Erro: ${error.message}`);
      setInputText(textToSubmit);
    } else {
      fetchComments();
    }
  };

  // Funções de áudio (simplificadas para o bloco)
  const startRecording = async () => { /* sua lógica existente */ };
  const stopRecording = () => { /* sua lógica existente */ };

  return (
    <div style={styles.masterWrapper}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={styles.backdrop} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={styles.drawer}>
        
        <div style={styles.header}>
          <div style={styles.dragHandle} />
          <h2 style={styles.title}>Conversas em <span style={styles.username}>@{post.profiles?.username}</span></h2>
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
                    marginLeft: comment.parent_id ? "30px" : "0px", // RECUO DA RESPOSTA
                    borderLeft: comment.parent_id ? "2px solid #00FFFF33" : "none", // LINHA LATERAL NA RESPOSTA
                    paddingLeft: comment.parent_id ? "15px" : "0px"
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
                  <ReactionBar 
                    postId={post.id} 
                    commentId={comment.id} 
                    onOpenThread={() => setReplyingTo({ id: comment.id, username: comment.username })}
                  />
                  {!comment.parent_id && <div style={styles.separator} />}
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        <div style={styles.footerBlackPiano}>
          <div style={styles.inputContainer}>
            <AnimatePresence>
              {replyingTo && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={styles.replyBadge}>
                  <span style={styles.replyText}>Respondendo a <b style={{color: '#fff'}}>@{replyingTo.username}</b></span>
                  <div onClick={() => setReplyingTo(null)} style={styles.cancelIconWrapper}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={styles.inputBar}>
              <input 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                placeholder={replyingTo ? "Sua resposta..." : "Comente algo..."} 
                style={styles.textInput} 
              />
              <button onClick={handleSendText} style={styles.sendBtn}>➤</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  masterWrapper: { position: "fixed" as "fixed", inset: 0, zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "flex-end", pointerEvents: "none" as "none" },
  backdrop: { position: "absolute" as "absolute", inset: 0, background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(15px)", pointerEvents: "auto" as "auto" },
  drawer: { position: "relative" as "relative", width: "100%", maxWidth: "500px", height: "85vh", background: "#050505", borderRadius: "32px 32px 0 0", display: "flex", flexDirection: "column" as "column", pointerEvents: "auto" as "auto", borderTop: "1px solid #1a1a1a" },
  header: { padding: "15px 20px" },
  dragHandle: { width: "40px", height: "4px", background: "#222", borderRadius: "10px", margin: "0 auto 10px auto" },
  title: { color: "#fff", fontSize: "14px", textAlign: "center" as "center" },
  username: { color: "#00FFFF" },
  content: { flex: 1, overflowY: "auto" as "auto", padding: "20px" },
  commentList: { display: "flex", flexDirection: "column" as "column", gap: "15px" },
  commentRow: { paddingBottom: "10px", transition: "all 0.3s ease" },
  commentUser: { color: "#00FFFF", fontSize: "11px", fontWeight: "bold" as "bold" },
  commentText: { color: "#fff", fontSize: "14px", marginTop: "4px" },
  audioArea: { margin: "5px 0" },
  nativeAudio: { width: "100%", height: "30px", filter: "invert(1)" },
  separator: { height: "1px", background: "#111", marginTop: "15px" },
  footerBlackPiano: { background: "#000", padding: "20px 20px 40px 20px" },
  inputContainer: { display: "flex", flexDirection: "column" as "column" },
  replyBadge: { background: "rgba(0, 255, 255, 0.1)", border: "1px solid rgba(0, 255, 255, 0.2)", borderRadius: "12px", padding: "8px 12px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  replyText: { color: "#00FFFF", fontSize: "11px" },
  cancelIconWrapper: { cursor: "pointer", color: "#00FFFF", padding: "2px" },
  inputBar: { display: "flex", alignItems: "center", background: "#111", borderRadius: "100px", padding: "5px 10px" },
  textInput: { flex: 1, background: "transparent", border: "none", color: "#fff", padding: "10px", outline: "none", fontSize: "14px" },
  sendBtn: { background: "none", border: "none", color: "#00FFFF", fontSize: "18px", cursor: "pointer" },
  status: { color: "#444", textAlign: "center" as "center", marginTop: "50px" }
};
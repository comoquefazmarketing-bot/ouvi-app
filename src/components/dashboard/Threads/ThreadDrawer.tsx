/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 1.2 (Ambiente Auditivo Visual - ThreadDrawer)
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import AudioRecorder from "./AudioRecorder";
import ReactionBar from "./ReactionBar";
import CommentItem from "./CommentItem"; // Vamos usar o CommentItem aqui para o loop

interface ThreadDrawerProps {
  postId: string | null;
  parentId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  level?: number;
}

export default function ThreadDrawer({ postId, parentId = null, isOpen, onClose, level = 0 }: ThreadDrawerProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [activeSubThread, setActiveSubThread] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [visualizerIntensity, setVisualizerIntensity] = useState(0); // Para a intensidade visual do fundo

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
      const channel = supabase.channel(`thread_${postId}_${parentId || 'root'}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_comments' }, loadComments)
        .subscribe();
      
      // Inicia o visualizador de áudio ambiente
      setupAudioVisualizer();

      return () => { 
        supabase.removeChannel(channel); 
        cleanupAudioVisualizer();
      };
    } else {
      cleanupAudioVisualizer();
    }
  }, [isOpen, postId, parentId]);

  const setupAudioVisualizer = async () => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      }

      // Conecta o microfone para pegar o som ambiente
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      // analyserRef.current.connect(audioContextRef.current.destination); // Opcional: para ouvir o feedback

      const animate = () => {
        analyserRef.current?.getByteFrequencyData(dataArrayRef.current!);
        let sum = 0;
        if (dataArrayRef.current) {
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
        }
        const average = sum / (dataArrayRef.current?.length || 1);
        setVisualizerIntensity(average / 255); // Normaliza para 0-1

        animationFrameIdRef.current = requestAnimationFrame(animate);
      };
      animationFrameIdRef.current = requestAnimationFrame(animate);

    } catch (error) {
      console.warn("Nenhum microfone encontrado para visualização de áudio, ou permissão negada.");
      setVisualizerIntensity(0); // Garante que a visualização seja 0 se não houver microfone
    }
  };

  const cleanupAudioVisualizer = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVisualizerIntensity(0);
  };

  async function loadComments() {
    const query = supabase.from("audio_comments").select("*").eq("post_id", postId);
    if (parentId) query.eq("parent_id", parentId);
    else query.is("parent_id", null);
    
    const { data } = await query.order("created_at", { ascending: true });
    if (data) setComments(data);
  }

  const sendNewComment = async (audioUrl: string | null = null) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("audio_comments").insert([{
      post_id: postId,
      parent_id: parentId,
      content: textInput,
      audio_url: audioUrl,
      user_id: session?.user.id,
      username: session?.user.email?.split('@')[0],
      reactions: {}
    }]);
    if (!error) setTextInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {level === 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={styles.overlay} />}
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            style={{ 
              ...styles.sheet, 
              left: level * 10, 
              borderLeft: level > 0 ? "1px solid #00f2fe" : "none",
              // Efeito de fundo que pulsa com o som ambiente
              boxShadow: `inset 0 0 ${visualizerIntensity * 10}px rgba(0,242,254, ${visualizerIntensity * 0.5})`
            }}
          >
            <div style={styles.header}>
              <span style={styles.title}>{parentId ? "RESPOSTA" : "O QUE ESTÃO FALANDO"}</span>
              <button onClick={onClose} style={styles.closeBtn}>X</button>
            </div>

            <div style={styles.scrollArea}>
              {comments.map((c) => (
                <div key={c.id} style={styles.commentContainer}>
                  <CommentItem comment={c} onReply={() => setActiveSubThread(c.id)} />

                  {/* RECURSIVIDADE PARA CRIAR O "BURACO NEGRO" */}
                  {activeSubThread === c.id && (
                    <ThreadDrawer 
                      postId={postId} 
                      parentId={c.id} 
                      isOpen={true} 
                      onClose={() => setActiveSubThread(null)} 
                      level={level + 1}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={styles.footer}>
              <input 
                placeholder="Escreva algo..." 
                value={textInput} 
                onChange={e => setTextInput(e.target.value)} 
                style={styles.input}
              />
              <AudioRecorder onUploadComplete={(url) => sendNewComment(url)} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const styles = {
  overlay: { position: "fixed" as "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 2000 },
  sheet: { 
    position: "fixed" as "fixed", bottom: 0, right: 0, height: "90vh", width: "100%", 
    background: "#050505", borderRadius: "25px 25px 0 0", zIndex: 2001, 
    display: "flex", flexDirection: "column" as "column", 
    transition: "box-shadow 0.1s ease-out", // Transição suave para o box-shadow
    overflow: "hidden" // Garante que o visualizer não transborde
  },
  header: { padding: "15px 20px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "10px", fontWeight: "900", color: "#00f2fe", letterSpacing: "2px" },
  closeBtn: { background: "none", border: "none", color: "#444", cursor: "pointer" },
  scrollArea: { flex: 1, overflowY: "auto" as "auto", padding: "20px" },
  commentContainer: { marginBottom: "20px" },
  bubble: { padding: "15px", background: "#0c0c0c", borderRadius: "18px", border: "1px solid #151515" }, // Manter se necessário
  user: { fontSize: "10px", color: "#00f2fe", fontWeight: "bold" as "bold" }, // Manter se necessário
  text: { fontSize: "14px", margin: "8px 0", color: "#eee" }, // Manter se necessário
  audio: { width: "100%", height: "30px", marginTop: "10px" }, // Manter se necessário
  actions: { display: "flex", justifyContent: "space-between", marginTop: "15px", alignItems: "center" }, // Manter se necessário
  replyBtn: { background: "none", border: "none", color: "#444", fontSize: "10px", fontWeight: "bold" as "bold", cursor: "pointer" }, // Manter se necessário
  footer: { padding: "20px", borderTop: "1px solid #111", background: "#000", display: "flex", gap: "10px", alignItems: "center" },
  input: { flex: 1, background: "#0c0c0c", border: "none", borderRadius: "12px", padding: "12px", color: "#fff", outline: "none" }
};
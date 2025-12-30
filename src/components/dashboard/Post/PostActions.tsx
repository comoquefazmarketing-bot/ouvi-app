/**
 * PROJETO OUVI — Plataforma Social de Voz
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 * Versão: 1.0 (O Portão da Thread)
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface PostActionsProps {
  postId: string;
  onOpenThread: (postId: string) => void;
}

export default function PostActions({ postId, onOpenThread }: PostActionsProps) {
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    fetchCommentCount();

    // Realtime para atualizar o contador conforme as pessoas falam
    const channel = supabase.channel(`count_${postId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'audio_comments', filter: `post_id=eq.${postId}` }, 
        () => fetchCommentCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  async function fetchCommentCount() {
    const { count, error } = await supabase
      .from("audio_comments")
      .select("*", { count: 'exact', head: true })
      .eq("post_id", postId);
    
    if (!error && count !== null) setCommentCount(count);
  }

  return (
    <div style={styles.container}>
      <button onClick={() => onOpenThread(postId)} style={styles.threadBtn}>
        <div style={styles.iconGroup}>
          <span style={styles.micIcon}>🎙️</span>
          <span style={styles.countText}>{commentCount} {commentCount === 1 ? 'PESSOA FALANDO' : 'PESSOAS FALANDO'}</span>
        </div>
        <span style={styles.arrow}>ENTRAR →</span>
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "10px 15px",
    borderTop: "1px solid #111",
    marginTop: "5px"
  },
  threadBtn: {
    width: "100%",
    background: "#0c0c0c",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "12px 15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  iconGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  micIcon: {
    fontSize: "16px"
  },
  countText: {
    color: "#00f2fe",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px"
  },
  arrow: {
    color: "#444",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "1px"
  }
};
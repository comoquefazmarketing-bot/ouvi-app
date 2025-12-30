"use client";

import React from "react";

interface PostPreviewProps {
  comments: any[];
  onClick: () => void;
}

export default function PostPreview({ comments, onClick }: PostPreviewProps) {
  const recentPreviews = comments.slice(-3); // Pega os 3 últimos

  return (
    <div onClick={onClick} style={styles.previewBox}>
      <div style={styles.header}>
        CONVERSA ATIVA • {comments.length} INTERAÇÕES
      </div>
      
      {recentPreviews.length > 0 ? (
        <div style={styles.list}>
          {recentPreviews.map((c, idx) => (
            <div key={idx} style={{ ...styles.line, opacity: 0.4 + (idx * 0.3) }}>
              <div style={styles.dot} />
              <div style={styles.text}>
                {c.content ? c.content : "🎤 Mensagem de áudio..."}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>Silêncio. Seja o primeiro a falar.</div>
      )}
    </div>
  );
}

const styles = {
  previewBox: { 
    margin: "0 15px 15px", 
    padding: "12px", 
    background: "#080808", 
    borderRadius: "15px", 
    border: "1px solid #111", 
    cursor: "pointer" 
  },
  header: { 
    color: "#444", 
    fontSize: "10px", 
    fontWeight: 'bold' as 'bold', 
    marginBottom: "8px", 
    textTransform: 'uppercase' as 'uppercase' 
  },
  list: { display: 'flex', flexDirection: 'column' as 'column', gap: '5px' },
  line: { display: 'flex', alignItems: 'center', gap: '8px' },
  dot: { width: 3, height: 3, borderRadius: '50%', background: '#00f2fe' },
  text: { 
    fontSize: '11px', 
    color: '#aaa', 
    whiteSpace: 'nowrap' as 'nowrap', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis' 
  },
  empty: { fontSize: '11px', color: '#333' }
};
/**
 * PROJETO OUVI — Feed de Impacto Sensorial
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PostCard from "../Post/PostCard";

interface FeedListProps {
  posts: any[];
  onOpenThread: (postId: string) => void;
}

export default function FeedList({ posts, onOpenThread }: FeedListProps) {
  
  // Post Simulado de Boas-Vindas para "quebrar o gelo"
  const welcomePost = {
    id: "welcome-ouvi",
    created_at: new Date().toISOString(),
    likes: 0,
    profiles: {
      username: "ouvi_oficial",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=ouvi"
    },
    content: "Bem-vindo ao OUVI. Este é o seu espaço. Toque no card para entrar na thread ou use o botão central para começar a sua história.",
    audio_url: null,
  };

  return (
    <div style={styles.container}>
      <AnimatePresence>
        {posts.length === 0 ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            style={styles.emptyWrapper}
          >
            {/* Mensagem de Impacto que definimos */}
            <div style={styles.impactText}>
              <h2 style={styles.title}>O SILÊNCIO É PROFUNDO POR AQUI.</h2>
              <p style={styles.subtitle}>SEJA O PRIMEIRO A QUEBRÁ-LO.</p>
            </div>

            {/* O Post de Onboarding para o usuário já interagir */}
            <div style={styles.previewCard}>
              <PostCard 
                post={welcomePost} 
                onOpenThread={onOpenThread} 
                comments={[]} 
              />
            </div>
          </motion.div>
        ) : (
          <div style={styles.list}>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ width: "100%" }}
              >
                <PostCard 
                  post={post} 
                  onOpenThread={onOpenThread} 
                  comments={[]} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "480px",
    margin: "0 auto",
  },
  list: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "16px",
    width: "100%",
  },
  emptyWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    paddingTop: "60px",
  },
  impactText: {
    textAlign: "center" as "center",
    marginBottom: "40px",
  },
  title: {
    color: "#00f2fe",
    fontSize: "14px",
    fontWeight: "900",
    letterSpacing: "4px",
    textShadow: "0 0 15px rgba(0, 242, 254, 0.4)",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#444",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "2px",
  },
  previewCard: {
    width: "100%",
    opacity: 0.8, // Sutilmente mais discreto por ser um exemplo
  }
};

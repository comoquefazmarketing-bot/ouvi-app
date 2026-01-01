"use client";
import React, { useMemo } from "react";
import ReactionBar from "@/components/dashboard/Threads/ReactionBar";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function PostCard({ post, onOpenThread, onRefresh }: any) {
  const zapCount = useMemo(() => (post.reactions || []).filter((r: any) => r.type === 'zap').length, [post.reactions]);
  const intensity = Math.min(zapCount / 50, 1);

  // Efeito de Inclinação (Tilt) Premium
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouse(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  return (
    <motion.div 
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{
        ...cardStyles.card,
        rotateX,
        rotateY,
        perspective: 1000,
        border: `1px solid rgba(0, 242, 254, ${0.1 + intensity * 0.4})`,
        boxShadow: zapCount > 0 
          ? `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 ${20 + intensity * 30}px rgba(0, 242, 254, ${intensity * 0.2})` 
          : "0 10px 30px rgba(0,0,0,0.5)"
      }}
      whileHover={{ y: -5, transition: { duration: 0.4, ease: "easeOut" } }}
    >
      {/* Overlay de Brilho Dinâmico (Sinal) */}
      <motion.div 
        style={cardStyles.signalOverlay}
        animate={{ 
          opacity: [0.05, 0.15, 0.05],
          background: intensity === 1 
            ? "radial-gradient(circle at 50% -20%, rgba(255, 215, 0, 0.15), transparent)" 
            : "radial-gradient(circle at 50% -20%, rgba(0, 242, 254, 0.1), transparent)"
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div style={cardStyles.header}>
        <div style={cardStyles.userInfo}>
          <motion.img 
            whileHover={{ scale: 1.1, rotate: 5 }}
            src={post.profiles?.avatar_url || "/default-avatar.png"} 
            style={cardStyles.avatar} 
            alt="User" 
          />
          <span style={cardStyles.username}>@{post.profiles?.username}</span>
        </div>
      </div>

      <div style={cardStyles.content} onClick={() => onOpenThread(post)}>
        {post.image_url && (
          <div style={cardStyles.imageWrapper}>
             <motion.img 
               initial={{ scale: 1.1, filter: "blur(10px)" }}
               animate={{ scale: 1, filter: "blur(0px)" }}
               transition={{ duration: 0.8 }}
               src={post.image_url} 
               style={cardStyles.postImage} 
             />
          </div>
        )}
        <div style={cardStyles.bodyTextContainer}>
           <p style={cardStyles.text}>{post.content}</p>
        </div>
      </div>

      <div style={cardStyles.footer}>
        <div style={cardStyles.footerContent}>
          
          <div style={cardStyles.reactionSide}>
            <ReactionBar 
              postId={post.id} 
              initialReactions={post.reactions} 
              onReply={() => onOpenThread(post)} 
              onRefresh={onRefresh} 
            />
          </div>
          
          <motion.button 
            onClick={() => onOpenThread(post)} 
            style={{
              ...cardStyles.coreBtn,
              color: intensity > 0.5 ? "#FFD700" : "#00f2fe",
              borderColor: intensity > 0.5 ? "#FFD700" : "rgba(0, 242, 254, 0.3)"
            }}
            whileHover={{ 
              scale: 1.02, 
              backgroundColor: "rgba(0, 242, 254, 0.1)",
              boxShadow: "0 0 20px rgba(0, 242, 254, 0.2)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              O QUE ESTÃO FALANDO...
            </motion.span>
          </motion.button>

        </div>
      </div>
    </motion.div>
  );
}

const cardStyles = {
  card: { 
    background: "linear-gradient(145deg, #0a0a0a 0%, #050505 100%)", 
    borderRadius: "32px", 
    marginBottom: "30px", 
    overflow: "hidden", 
    position: "relative" as const,
    cursor: "default"
  },
  signalOverlay: {
    position: "absolute" as const,
    inset: 0,
    pointerEvents: "none" as const,
    zIndex: 1
  },
  header: { padding: "20px 24px", position: "relative" as const, zIndex: 2 },
  userInfo: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "36px", height: "36px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", objectFit: "cover" as const },
  username: { color: "#fff", fontWeight: "900" as const, fontSize: "12px", letterSpacing: "1.5px", textTransform: "uppercase" as const },
  content: { cursor: "pointer", position: "relative" as const, zIndex: 2 },
  imageWrapper: { overflow: "hidden", margin: "0 12px", borderRadius: "20px" },
  postImage: { width: "100%", opacity: 0.9, display: "block" },
  bodyTextContainer: { padding: "24px" },
  text: { color: "rgba(255,255,255,0.7)", fontSize: "16px", fontWeight: "300" as const, lineHeight: "1.6" },
  footer: { 
    padding: "20px 24px", 
    background: "rgba(255,255,255,0.02)", 
    borderTop: "1px solid rgba(255,255,255,0.05)",
    position: "relative" as const,
    zIndex: 2
  },
  footerContent: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" },
  reactionSide: { display: "flex", alignItems: "center" },
  coreBtn: { 
    background: "rgba(0,0,0,0.4)", 
    backdropFilter: "blur(10px)",
    border: "1px solid", 
    fontSize: "9px", 
    fontWeight: "900" as const, 
    padding: "12px 22px", 
    borderRadius: "16px", 
    cursor: "pointer",
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    transition: "all 0.3s ease"
  }
};
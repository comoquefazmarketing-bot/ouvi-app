/**
 * PROJETO OUVI – Plataforma Social de Voz
 * Versão Final Blindada - Felipe Makarios
 * Componente: Maestro de Redirecionamento (Home)
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // Busca a sessão de forma direta no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      // Delay sensorial de 1.5s para a logo respirar e criar expectativa
      const timer = setTimeout(() => {
        if (session) {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      }, 1500);

      return () => clearTimeout(timer);
    };
    checkUser();
  }, [router]);

  return (
    <div style={{ 
      background: "#000", 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      gap: "24px",
      overflow: "hidden"
    }}>
      {/* LOGO SENSORIAL: Efeito de pulsação suave (Respiração) */}
      <motion.img 
        src="/logo-dashboard.svg" 
        alt="OUVI" 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0.3, 1, 0.3], 
          scale: [0.97, 1, 0.97] 
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={{ width: "90px", filter: "drop-shadow(0 0 15px rgba(0,242,254,0.1))" }} 
      />
      
      {/* LINHA DE CARREGAMENTO: Minimalista e ciano */}
      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "40px", opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, #00f2fe, transparent)",
          borderRadius: "10px"
        }} 
      />

      {/* Texto oculto apenas para SEO/Acessibilidade */}
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        OUVI - Experiência Sensorial de Voz
      </h1>
    </div>
  );
}

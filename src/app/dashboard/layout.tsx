/**
 * PROJETO OUVI — Layout Mestre Sensorial
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 */

"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/dashboard/Header/DashboardHeader";
import TabBar from "@/components/dashboard/Navigation/TabBar";
import SensoryBackground from "@/components/dashboard/Visuals/SensorySphere";
import ActionDrawer from "@/components/dashboard/Navigation/ActionDrawer"; // Importe a gaveta

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Estado para a gaveta
  const pathname = usePathname();
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const isThreadPage = pathname.includes("/post") || pathname.includes("/thread");

  const handleScroll = () => {
    if (isThreadPage || isDrawerOpen) return; // Não esconde se a gaveta estiver aberta

    setIsVisible(false);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      setIsVisible(true);
    }, 2500); 
  };

  return (
    <div style={styles.appWrapper}>
      <SensoryBackground />

      {/* Header Sensorial */}
      <AnimatePresence>
        {isVisible && !isThreadPage && (
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={styles.headerFixed}
          >
            <div style={styles.container}>
              <Header />
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Área de Conteúdo com Scroll Suave */}
      <main 
        onScroll={handleScroll} 
        style={{
          ...styles.contentScroll,
          paddingTop: isThreadPage ? "20px" : "80px",
          paddingBottom: isThreadPage ? "20px" : "120px",
        }}
      >
        <div style={styles.container}>
          {children}
        </div>
      </main>

      {/* TabBar com gatilho para a Gaveta */}
      <AnimatePresence>
        {isVisible && !isThreadPage && (
          <motion.footer 
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={styles.footerFixed}
          >
            <div style={styles.container}>
              <div style={styles.tabBarWrapper}>
                {/* Passamos a função onPlusClick para a TabBar */}
                <TabBar onPlusClick={() => setIsDrawerOpen(true)} />
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Gaveta de Criação (Aparece sobre tudo) */}
      <ActionDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}

const styles = {
  appWrapper: {
    display: "flex",
    flexDirection: "column" as "column",
    height: "100vh",
    backgroundColor: "#000",
    overflow: "hidden" as "hidden",
    position: "relative" as "relative",
  },
  container: {
    maxWidth: "480px",
    margin: "0 auto",
    width: "100%",
    padding: "0 15px",
  },
  headerFixed: {
    position: "fixed" as "fixed",
    top: 0,
    width: "100%",
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(25px) saturate(180%)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  contentScroll: {
    flex: 1,
    overflowY: "auto" as "auto",
    scrollbarWidth: "none" as "none",
    width: "100%",
    scrollBehavior: "smooth" as "smooth",
  },
  footerFixed: {
    position: "fixed" as "fixed",
    bottom: "25px",
    width: "100%",
    zIndex: 100,
  },
  tabBarWrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center" as "center",
  }
};
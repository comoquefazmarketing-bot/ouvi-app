/**
 * PROJETO OUVI €” TabBar de Alta Precis£o
 * Autor: Felipe Makarios
 * Assinatura Digital: F-M-A-K-A-R-I-O-S
 */

"use client";
import React from "react";
import { motion } from "framer-motion";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface TabBarProps {
  onPlusClick?: () => void; // Propriedade para abrir a gaveta
}

const TabBar = ({ onPlusClick }: TabBarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { icon: <Home size={22} />, path: "/dashboard", label: "In­cio" },
    { icon: <Search size={22} />, path: "/dashboard/search", label: "Explorar" },
    { icon: null, path: null, isPlus: true }, // O bot£o central
    { icon: <Bell size={22} />, path: "/dashboard/notifications", label: "Alertas" },
    { icon: <User size={22} />, path: "/dashboard/profile", label: "Perfil" },
  ];

  return (
    <nav style={styles.nav}>
      {tabs.map((tab, index) => {
        if (tab.isPlus) {
          return (
            <motion.button
              key="plus-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onPlusClick}
              style={styles.plusBtn}
            >
              <Plus size={28} color="#000" strokeWidth={3} />
            </motion.button>
          );
        }

        const isActive = pathname === tab.path;

        return (
          <button
            key={index}
            onClick={() => tab.path && router.push(tab.path)}
            style={{
              ...styles.tabBtn,
              color: isActive ? "#00f2fe" : "rgba(255,255,255,0.4)",
            }}
          >
            {tab.icon}
            {isActive && <motion.div layoutId="activeDot" style={styles.activeDot} />}
          </button>
        );
      })}
    </nav>
  );
};

const styles = {
  nav: {
    background: "rgba(15, 15, 15, 0.8)",
    backdropFilter: "blur(20px)",
    padding: "10px 20px",
    borderRadius: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
  },
  tabBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    position: "relative" as "relative",
    padding: "10px",
    transition: "color 0.3s ease",
  },
  plusBtn: {
    background: "#00f2fe",
    border: "none",
    borderRadius: "50%",
    width: "54px",
    height: "54px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(0, 242, 254, 0.4)",
    marginTop: "-25px", // Faz o bot£o saltar para fora da barra
  },
  activeDot: {
    position: "absolute" as "absolute",
    bottom: "-4px",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#00f2fe",
    boxShadow: "0 0 8px #00f2fe",
  }
};

export default TabBar;

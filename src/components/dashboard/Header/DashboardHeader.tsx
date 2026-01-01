/**
 * PROJETO OUVI €” Header Minimalista
 * Local: E:\OUVI\ouvi-app\src\components\dashboard\Header\Header.tsx
 * Autor: Felipe Makarios
 */

"use client";

import React from "react";

export default function Header() {
  return (
    <header style={styles.headerWrapper}>
      <div style={styles.brandGroup}>
        {/* Logo Icon - Mantendo a propor§£o */}
        <img 
          src="/logo-dashboard.svg" 
          alt="OUVI" 
          style={styles.logoIcon} 
          onError={(e) => (e.currentTarget.style.display = 'none')} // Esconde se a imagem falhar
        />
        <span style={styles.brandName}>OUVI</span>
      </div>
    </header>
  );
}

const styles = {
  headerWrapper: {
    width: '100%', 
    height: '65px', 
    background: 'rgba(0, 0, 0, 0.8)', // Um pouco mais escuro para destacar o conteºdo
    backdropFilter: 'blur(20px)', 
    WebkitBackdropFilter: 'blur(20px)', // Suporte para Safari (iOS)
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'sticky' as const, 
    top: 0, 
    zIndex: 1000,
  },
  brandGroup: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  logoIcon: { 
    height: '20px', 
    width: 'auto',
    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' // Leve brilho na logo
  },
  brandName: { 
    color: '#fff', 
    fontSize: '16px', // Ajustado para ser elegante, n£o gritante
    fontWeight: '900' as const, 
    letterSpacing: '6px', // Espa§amento mais largo para luxo
    marginLeft: '4px'
  }
};

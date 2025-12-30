/**
 * PROJETO OUVI
 * Local: src/components/dashboard/Header/Header.tsx
 */
"use client";

export default function Header() {
  return (
    <header style={styles.headerWrapper}>
      <div style={styles.brandGroup}>
        <img src="/logo-dashboard.svg" alt="OUVI" style={styles.logoIcon} />
        <span style={styles.brandName}>OUVI</span>
      </div>
    </header>
  );
}

const styles = {
  headerWrapper: {
    width: '100%', height: '65px', background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    position: 'sticky' as 'sticky', top: 0, zIndex: 1000,
  },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { height: '22px', width: 'auto' },
  brandName: { color: '#fff', fontSize: '18px', fontWeight: '900', letterSpacing: '4px' }
};
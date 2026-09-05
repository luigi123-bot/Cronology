import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WebHeader() {
  const router = useRouter();
  const pathname = usePathname();

  if (Platform.OS !== 'web') return null;

  const handleNavigate = (path: string) => {
    try {
      router.replace(path as any);
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = path;
      }
    }
  };

  const navItems = [
    { label: 'Explorar', path: '/', icon: 'sparkles' },
    { label: 'Mis Series', path: '/series', icon: 'tv' },
    { label: 'Buscar', path: '/search', icon: 'search' },
  ];

  return (
    <header style={styles.webHeaderContainer as any}>
      <div style={styles.innerContainer as any}>
        {/* Brand Logo */}
        <div
          style={styles.brandGroup as any}
          onClick={() => handleNavigate('/')}
        >
          <div style={styles.logoIcon as any}>
            <Ionicons name="play" size={16} color="#ffffff" />
          </div>
          <div>
            <div style={styles.brandTitle as any}>CRONOLOGY</div>
            <div style={styles.brandSubtitle as any}>UNIVERSO & EPISODIOS</div>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={styles.navGroup as any}>
          {navItems.map((item) => {
            const isActive =
              item.path === '/' ? pathname === '/' || pathname === '' : pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                style={{
                  ...styles.navButton,
                  ...(isActive ? styles.navButtonActive : {}),
                } as any}
                onClick={() => handleNavigate(item.path)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={15}
                  color={isActive ? '#c084fc' : '#94a3b8'}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Badges */}
        <div style={styles.rightGroup as any}>
          <div style={styles.cloudBadge as any}>
            <span style={styles.statusDot as any}></span>
            <span style={styles.cloudText as any}>Neon PostgreSQL · TMDB</span>
          </div>

          <button
            style={styles.quickSearchBtn as any}
            onClick={() => handleNavigate('/search')}
          >
            <Ionicons name="search" size={14} color="#e2e8f0" />
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>Buscar...</span>
            <kbd style={styles.kbd as any}>⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  webHeaderContainer: {
    position: 'sticky',
    top: 0,
    zIndex: 999,
    width: '100%',
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  innerContainer: {
    maxWidth: 1240,
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(124, 58, 237, 0.5)',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: '1px',
    lineHeight: '18px',
  },
  brandSubtitle: {
    color: '#a855f7',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1.2px',
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '4px 6px',
    borderRadius: 14,
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  navButtonActive: {
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(168, 85, 247, 0.2)',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  cloudBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 8px #22c55e',
  },
  cloudText: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: 600,
  },
  quickSearchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 12,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
  },
  kbd: {
    fontSize: 10,
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 5px',
    borderRadius: 4,
    color: '#94a3b8',
  },
};

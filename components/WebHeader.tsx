import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import LoginModal from '@/components/LoginModal';
import { getStoredUser } from '@/services/auth';

export default function WebHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Restore user from storage if valid
  useEffect(() => {
    if (!user) {
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
      }
    }
  }, [user, setUser]);

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
    <>
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

          {/* Right Status & User Profile Badges */}
          <div style={styles.rightGroup as any}>
            <button
              style={styles.quickSearchBtn as any}
              onClick={() => handleNavigate('/search')}
            >
              <Ionicons name="search" size={14} color="#e2e8f0" />
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>Buscar...</span>
              <kbd style={styles.kbd as any}>⌘K</kbd>
            </button>

            {/* User Profile / Login Button */}
            {user ? (
              <button
                style={styles.userProfileBtn as any}
                onClick={() => setShowLoginModal(true)}
                title="Editar perfil de usuario"
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{user.avatarUrl || '👤'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                  {user.displayName}
                </span>
                {user.username && (
                  <span style={{ fontSize: 11, color: '#c084fc', fontWeight: 600 }}>
                    @{user.username}
                  </span>
                )}
              </button>
            ) : (
              <button
                style={styles.loginActionBtn as any}
                onClick={() => setShowLoginModal(true)}
              >
                <Ionicons name="person-circle-outline" size={17} color="#c084fc" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login / Profile Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

const styles = {
  webHeaderContainer: {
    position: 'sticky',
    top: 0,
    zIndex: 999,
    width: '100%',
    backgroundColor: 'rgba(10, 10, 15, 0.88)',
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
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 1.5,
    color: '#ffffff',
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#a855f7',
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 12,
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#ffffff',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
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
  userProfileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 14,
    background: 'rgba(168, 85, 247, 0.14)',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loginActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 12,
    background: '#7c3aed',
    border: 'none',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
  },
};

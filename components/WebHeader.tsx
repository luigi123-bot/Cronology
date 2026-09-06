import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isSmallMobile = width < 480;

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
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .cronology-header-outer {
              position: sticky;
              top: 0;
              z-index: 999;
              width: 100% !important;
              max-width: 100vw !important;
              background-color: rgba(10, 10, 15, 0.92);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
              box-sizing: border-box !important;
            }
            .cronology-header-inner {
              max-width: 1240px;
              margin: 0 auto;
              padding: 10px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              box-sizing: border-box !important;
              width: 100% !important;
            }
            @media (max-width: 768px) {
              .cronology-header-inner {
                padding: 8px 12px !important;
                gap: 8px !important;
              }
              .cronology-brand-subtitle {
                display: none !important;
              }
              .cronology-search-full {
                display: none !important;
              }
            }
          `,
        }}
      />
      <header className="cronology-header-outer">
        <div className="cronology-header-inner">
          {/* Brand Logo */}
          <div
            style={styles.brandGroup as any}
            onClick={() => handleNavigate('/')}
          >
            <div style={styles.logoIcon as any}>
              <Ionicons name="play" size={15} color="#ffffff" />
            </div>
            <div>
              <div style={styles.brandTitle as any}>CRONOLOGY</div>
              {!isSmallMobile && (
                <div className="cronology-brand-subtitle" style={styles.brandSubtitle as any}>
                  UNIVERSO & EPISODIOS
                </div>
              )}
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
                    ...(isMobile ? styles.navButtonMobile : {}),
                  } as any}
                  onClick={() => handleNavigate(item.path)}
                  title={item.label}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={15}
                    color={isActive ? '#c084fc' : '#94a3b8'}
                  />
                  {!isMobile && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Right Status & User Profile Badges */}
          <div style={styles.rightGroup as any}>
            {/* Desktop Search Button */}
            {!isMobile && (
              <button
                className="cronology-search-full"
                style={styles.quickSearchBtn as any}
                onClick={() => handleNavigate('/search')}
              >
                <Ionicons name="search" size={14} color="#e2e8f0" />
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>Buscar...</span>
                <kbd style={styles.kbd as any}>⌘K</kbd>
              </button>
            )}

            {/* Mobile Search Icon Button */}
            {isMobile && (
              <button
                style={styles.quickSearchBtnMobile as any}
                onClick={() => handleNavigate('/search')}
                title="Buscar series y episodios"
              >
                <Ionicons name="search" size={16} color="#e2e8f0" />
              </button>
            )}

            {/* User Profile / Login Button */}
            {user ? (
              <button
                style={{
                  ...styles.userProfileBtn,
                  ...(isMobile ? styles.userProfileBtnMobile : {}),
                } as any}
                onClick={() => setShowLoginModal(true)}
                title="Perfil de usuario"
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>{user.avatarUrl || '👤'}</span>
                {!isSmallMobile && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                    {user.displayName?.split(' ')[0] || 'Usuario'}
                  </span>
                )}
                {!isMobile && user.username && (
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
                <Ionicons name="person-circle-outline" size={16} color="#c084fc" />
                {!isSmallMobile && <span>Iniciar Sesión</span>}
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
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)',
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: 1.2,
    color: '#ffffff',
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: '#a855f7',
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navButtonMobile: {
    padding: '7px 9px',
    borderRadius: 8,
  },
  navButtonActive: {
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#ffffff',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  quickSearchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
  },
  quickSearchBtnMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.06)',
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
    gap: 6,
    padding: '6px 12px',
    borderRadius: 12,
    background: 'rgba(168, 85, 247, 0.14)',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userProfileBtnMobile: {
    padding: '5px 8px',
    borderRadius: 8,
    gap: 4,
  },
  loginActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 10,
    background: '#7c3aed',
    border: 'none',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
  },
};

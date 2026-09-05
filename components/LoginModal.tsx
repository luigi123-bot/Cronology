import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import type { AuthUser } from '@/types';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

const AVATARS = [
  { id: '1', emoji: '🦊', label: 'Wesen' },
  { id: '2', emoji: '🛡️', label: 'Detective' },
  { id: '3', emoji: '⚔️', label: 'Guerrero' },
  { id: '4', emoji: '🍿', label: 'Cinéfilo' },
  { id: '5', emoji: '⚡', label: 'Pro' },
  { id: '6', emoji: '🐉', label: 'Dragón' },
];

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const { user, setUser } = useStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarUrl || '🦊');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setDisplayName(user?.displayName || '');
      setUsername(user?.username || '');
      setSelectedAvatar(user?.avatarUrl || '🦊');
      setError('');
    }
  }, [visible, user]);

  const handleSave = () => {
    const trimmedName = displayName.trim();
    const trimmedUser = username.trim().replace(/^@/, '');

    if (!trimmedName) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!trimmedUser) {
      setError('Por favor ingresa un nombre de usuario');
      return;
    }

    const newUser: AuthUser = {
      id: user?.id || 1,
      email: `${trimmedUser.toLowerCase()}@cronology.local`,
      displayName: trimmedName,
      username: trimmedUser,
      avatarUrl: selectedAvatar,
    };

    setUser(newUser);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cronology_auth_user', JSON.stringify(newUser));
      } catch {}
    }
    onClose();
  };

  const handleLogout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cronology_auth_user');
      } catch {}
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#94a3b8" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={24} color="#c084fc" />
            </View>
            <Text style={styles.title}>
              {user ? 'Tu Perfil' : 'Iniciar Sesión'}
            </Text>
            <Text style={styles.subtitle}>
              Personaliza tu nombre y usuario para guardar tu historial y capítulos vistos.
            </Text>
          </View>

          {/* Avatar Selector */}
          <Text style={styles.inputLabel}>Elige tu avatar:</Text>
          <View style={styles.avatarRow}>
            {AVATARS.map((av) => (
              <Pressable
                key={av.id}
                style={[
                  styles.avatarBtn,
                  selectedAvatar === av.emoji && styles.avatarBtnActive,
                ]}
                onPress={() => setSelectedAvatar(av.emoji)}
              >
                <Text style={styles.avatarEmoji}>{av.emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Tu Nombre:</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="Ej: Luigi"
                placeholderTextColor="#64748b"
                value={displayName}
                onChangeText={(t) => {
                  setDisplayName(t);
                  setError('');
                }}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Nombre de Usuario:</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at" size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="Ej: luigi123"
                placeholderTextColor="#64748b"
                value={username}
                autoCapitalize="none"
                onChangeText={(t) => {
                  setUsername(t);
                  setError('');
                }}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Action Buttons */}
          <Pressable style={styles.submitBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            <Text style={styles.submitBtnText}>
              {user ? 'Guardar Cambios' : 'Iniciar Sesión'}
            </Text>
          </Pressable>

          {user && (
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }
      : {}),
  } as any,
  modalCard: {
    width: 440,
    maxWidth: '100%',
    backgroundColor: '#131320',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    cursor: 'pointer' as any,
  },
  avatarBtnActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: '#a855f7',
    transform: [{ scale: 1.1 }] as any,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0c0c14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  } as any,
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    height: 48,
    borderRadius: 14,
    marginTop: 8,
    cursor: 'pointer' as any,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    cursor: 'pointer' as any,
  },
  logoutBtnText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },
});

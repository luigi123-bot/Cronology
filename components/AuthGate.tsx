import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import {
  validateCredentials,
  getStoredUser,
  setStoredUser,
  AUTHORIZED_CREDENTIALS,
} from '@/services/auth';
import type { AuthUser } from '@/types';

interface AuthGateProps {
  children: React.ReactNode;
}

const AVATARS = [
  { id: '1', emoji: '🦊', label: 'Wesen' },
  { id: '2', emoji: '🛡️', label: 'Detective' },
  { id: '3', emoji: '⚔️', label: 'Guerrero' },
  { id: '4', emoji: '🍿', label: 'Cinéfilo' },
  { id: '5', emoji: '⚡', label: 'Pro' },
  { id: '6', emoji: '🐉', label: 'Dragón' },
];

export default function AuthGate({ children }: AuthGateProps) {
  const { user, setUser } = useStore();
  const [isChecking, setIsChecking] = useState(true);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [userInput, setUserInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);

  // Auto-restore session from storage
  useEffect(() => {
    const existing = getStoredUser();
    if (existing) {
      setUser(existing);
    }
    setIsChecking(false);
  }, [setUser]);

  const handleLogin = () => {
    const isValid = validateCredentials(nameInput, userInput);

    if (!isValid) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setErrorMessage(
        'Credenciales incorrectas. Ingresa tu nombre autorizado y usuario.'
      );
      return;
    }

    // Capitalize gracefully or preserve user's typed name
    const cleanName = nameInput.trim();
    const formattedName =
      cleanName.toLowerCase() === AUTHORIZED_CREDENTIALS.normalizedName
        ? AUTHORIZED_CREDENTIALS.defaultDisplayName
        : cleanName;

    const authUser: AuthUser = {
      id: 1266845,
      email: 'luisgotopo@cronology.local',
      displayName: formattedName,
      username: AUTHORIZED_CREDENTIALS.normalizedUser,
      avatarUrl: selectedAvatar,
    };

    setStoredUser(authUser);
    setUser(authUser);
    setErrorMessage('');
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Ionicons name="play" size={24} color="#ffffff" />
        </View>
        <Text style={styles.loadingText}>Iniciando Cronology...</Text>
      </View>
    );
  }

  // If user is already authenticated, allow full access
  if (user) {
    return <>{children}</>;
  }

  // Otherwise, render the mandatory Login Screen
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.fullScreen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.loginCard, shake && styles.cardShake]}>
          {/* Brand Logo & Name */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="play" size={26} color="#ffffff" />
            </View>
            <Text style={styles.brandTitle}>CRONOLOGY</Text>
            <Text style={styles.brandSubtitle}>UNIVERSO & EPISODIOS</Text>
          </View>

          {/* Access Banner */}
          <View style={styles.accessBadge}>
            <Ionicons name="lock-closed" size={13} color="#c084fc" />
            <Text style={styles.accessBadgeText}>ACCESO OBLIGATORIO</Text>
          </View>

          <Text style={styles.instructionText}>
            Inicia sesión con tu cuenta autorizada para acceder a las series, películas y reproductores.
          </Text>

          {/* Avatar Selector */}
          <Text style={styles.fieldLabel}>Elige tu avatar:</Text>
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

          {/* Input: Nombre */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Tu Nombre</Text>
              <Text style={styles.fieldHint}>Mayúsculas o minúsculas</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Luis gotopo"
                placeholderTextColor="#64748b"
                value={nameInput}
                onChangeText={(t) => {
                  setNameInput(t);
                  setErrorMessage('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {/* Input: Usuario */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Usuario</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="Ej: 1266845"
                placeholderTextColor="#64748b"
                value={userInput}
                onChangeText={(t) => {
                  setUserInput(t);
                  setErrorMessage('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {/* Error notice */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#f87171" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Pressable
            style={styles.loginBtn}
            onPress={handleLogin}
            accessibilityLabel="Ingresar a Cronology"
          >
            <Ionicons name="log-in-outline" size={20} color="#ffffff" />
            <Text style={styles.loginBtnText}>Ingresar a Cronology</Text>
          </Pressable>

          {/* Security note */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-outline" size={13} color="#64748b" />
            <Text style={styles.footerText}>
              Acceso privado protegido. Sesión persistente en este dispositivo.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#07070c',
    width: '100%',
    minHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#07070c',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingLogo: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  loginCard: {
    width: 440,
    maxWidth: '100%',
    backgroundColor: '#11111c',
    borderRadius: 28,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 36,
    elevation: 24,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(124, 58, 237, 0.2)',
        }
      : {}),
  } as any,
  cardShake: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  } as any,
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#a855f7',
    marginTop: 2,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: 12,
  },
  accessBadgeText: {
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  fieldHint: {
    fontSize: 11,
    color: '#a855f7',
    fontWeight: '600',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
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
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a0a12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  } as any,
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    width: '100%',
    height: 50,
    borderRadius: 14,
    marginTop: 6,
    cursor: 'pointer' as any,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
});

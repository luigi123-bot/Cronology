import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getRegisteredDriveFolders,
  saveRegisteredDriveFolder,
  extractDriveId,
  CHICAGO_MED_DRIVE_FOLDER_URL,
  type DriveSeriesConfig,
} from '@/services/googleDrive';

interface DriveSyncAdminModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRESET_SERIES = [
  { name: 'Chicago Med', defaultUrl: CHICAGO_MED_DRIVE_FOLDER_URL },
  { name: 'Grimm', defaultUrl: 'https://drive.google.com/drive/folders/1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS?usp=sharing' },
  { name: 'Chicago Fire', defaultUrl: '' },
  { name: 'Chicago P.D.', defaultUrl: '' },
  { name: 'Chicago Justice', defaultUrl: '' },
  { name: 'Law & Order: SVU', defaultUrl: '' },
];

export default function DriveSyncAdminModal({ visible, onClose }: DriveSyncAdminModalProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  const [selectedSeries, setSelectedSeries] = useState('Chicago Med');
  const [folderUrl, setFolderUrl] = useState(CHICAGO_MED_DRIVE_FOLDER_URL);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [folders, setFolders] = useState<Record<string, DriveSeriesConfig>>(getRegisteredDriveFolders());

  const handleSelectPreset = (name: string, defaultUrl: string) => {
    setSelectedSeries(name);
    if (defaultUrl) {
      setFolderUrl(defaultUrl);
    }
  };

  const handleSync = () => {
    if (!folderUrl.trim()) {
      setSyncStatus('Por favor ingresa un enlace de carpeta de Google Drive.');
      setSyncSuccess(false);
      return;
    }

    const folderId = extractDriveId(folderUrl);
    if (!folderId) {
      setSyncStatus('El enlace ingresado no parece ser un enlace válido de Google Drive.');
      setSyncSuccess(false);
      return;
    }

    setSyncStatus('Escaneando y sincronizando episodios de Google Drive...');
    setSyncSuccess(null);

    try {
      const saved = saveRegisteredDriveFolder(selectedSeries, folderUrl.trim());
      setFolders(getRegisteredDriveFolders());
      setSyncSuccess(true);
      setSyncStatus(`¡Listo! Se sincronizaron exitosamente los episodios de ${saved.seriesName} (${saved.episodesCount} capítulos listos para reproducir).`);
    } catch (err: any) {
      setSyncSuccess(false);
      setSyncStatus(`Error al guardar configuración: ${err?.message || 'Error desconocido'}`);
    }
  };

  const openLink = (url: string) => {
    if (url) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Linking.openURL(url);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#facc15" />
                <Text style={styles.adminBadgeText}>Exclusivo Luis Gotopo</Text>
              </View>
              <Text style={styles.title}>Gestor de Series Google Drive</Text>
              <Text style={styles.subtitle}>
                Sincroniza y organiza carpetas de Drive para que los capítulos se reproduzcan en streaming Full HD directamente.
              </Text>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Form Section */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>1. Selecciona o escribe la serie</Text>
              <View style={styles.presetPillsRow}>
                {PRESET_SERIES.map((s) => (
                  <Pressable
                    key={s.name}
                    style={[
                      styles.presetPill,
                      selectedSeries === s.name && styles.presetPillActive,
                    ]}
                    onPress={() => handleSelectPreset(s.name, s.defaultUrl)}
                  >
                    <Ionicons
                      name="tv"
                      size={12}
                      color={selectedSeries === s.name ? '#ffffff' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.presetPillText,
                        selectedSeries === s.name && styles.presetPillTextActive,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                2. Enlace de la Carpeta de Google Drive
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="link" size={16} color="#c084fc" style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.input}
                  value={folderUrl}
                  onChangeText={setFolderUrl}
                  placeholder="https://drive.google.com/drive/folders/..."
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {folderUrl.length > 0 && (
                  <Pressable style={styles.clearInputBtn} onPress={() => setFolderUrl('')}>
                    <Ionicons name="close-circle" size={16} color="#64748b" />
                  </Pressable>
                )}
              </View>

              <Pressable style={styles.syncBtn} onPress={handleSync}>
                <Ionicons name="cloud-upload" size={17} color="#ffffff" />
                <Text style={styles.syncBtnText}>Sincronizar Carpeta con Cronology</Text>
              </Pressable>

              {syncStatus && (
                <View
                  style={[
                    styles.statusBox,
                    syncSuccess === true && styles.statusBoxSuccess,
                    syncSuccess === false && styles.statusBoxError,
                  ]}
                >
                  <Ionicons
                    name={syncSuccess ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={syncSuccess ? '#22c55e' : '#ef4444'}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      syncSuccess === true && { color: '#86efac' },
                      syncSuccess === false && { color: '#fca5a5' },
                    ]}
                  >
                    {syncStatus}
                  </Text>
                </View>
              )}
            </View>

            {/* List of Configured Series */}
            <View style={[styles.sectionBox, { marginTop: 18 }]}>
              <Text style={styles.sectionTitle}>Carpetas de Series Activas en el Sistema</Text>
              <View style={styles.configuredList}>
                {Object.values(folders).map((item) => (
                  <View key={item.seriesKey} style={styles.folderCard}>
                    <View style={styles.folderCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.folderIcon}>
                          <Ionicons name="folder" size={16} color="#facc15" />
                        </View>
                        <View>
                          <Text style={styles.folderSeriesName}>{item.seriesName}</Text>
                          <Text style={styles.folderEpCount}>
                            {item.episodesCount} capítulos listos para reproducir
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={styles.openDriveBtn}
                        onPress={() => openLink(item.folderUrl)}
                      >
                        <Ionicons name="open-outline" size={14} color="#38bdf8" />
                        <Text style={styles.openDriveText}>Abrir en Drive</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.folderUrlText} numberOfLines={1}>
                      {item.folderUrl}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#121320',
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
      } as any,
    }),
  },
  modalCardMobile: {
    maxWidth: '100%',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#151628',
  },
  headerTitleRow: {
    flex: 1,
    paddingRight: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  adminBadgeText: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 17,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
  },
  sectionBox: {
    backgroundColor: '#18192c',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#a855f7',
  },
  presetPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  presetPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f101d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: 14,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#ffffff',
    paddingHorizontal: 10,
    fontSize: 13,
  },
  clearInputBtn: {
    padding: 10,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
      } as any,
    }),
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  statusBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusBoxSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  configuredList: {
    gap: 10,
  },
  folderCard: {
    backgroundColor: '#0f101d',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  folderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  folderIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderSeriesName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  folderEpCount: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
  },
  openDriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  openDriveText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  folderUrlText: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
});

import { useEffect, useRef, useState } from 'react';
import {
  View, TouchableOpacity, Image, ActivityIndicator, StyleSheet,
  Alert, Modal, Pressable, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { ThemedText } from './ThemedText';
import { PhotoPreviewModal } from './PhotoPreviewModal';

// ─── Photo source bottom sheet ───────────────────────────────────────────────

interface PhotoSourceSheetProps {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
}

function PhotoSourceSheet({ visible, onCamera, onGallery, onClose }: PhotoSourceSheetProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function handleOption(fn: () => void) {
    onClose();
    // pequeño delay para que el sheet cierre antes de pedir permisos
    setTimeout(fn, 220);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Card de opciones */}
          <View style={[styles.sheetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText variant="caption" tone="tertiary" style={styles.sheetTitle}>
              {t('photo.source.title').toUpperCase()}
            </ThemedText>

            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: colors.border }]}
              onPress={() => handleOption(onCamera)}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
              </View>
              <ThemedText style={styles.sheetOptionLabel}>{t('photo.source.camera')}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => handleOption(onGallery)}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="images-outline" size={20} color={colors.primary} />
              </View>
              <ThemedText style={styles.sheetOptionLabel}>{t('photo.source.gallery')}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Botón cancelar separado */}
          <TouchableOpacity
            style={[styles.sheetCancel, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText tone="secondary" style={styles.sheetCancelLabel}>
              {t('photo.source.cancel')}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PhotoPickerFieldProps {
  bucket: string;
  storagePath: string;
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  resizeWidth?: number;
  quality?: number;
  uploading?: boolean;
  setUploading?: (v: boolean) => void;
}

export function PhotoPickerField({
  bucket,
  storagePath,
  currentUrl,
  onUploadComplete,
  onRemove,
  label,
  resizeWidth = 500,
  quality = 0.8,
  uploading,
  setUploading,
}: PhotoPickerFieldProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const internalUploading = useRef(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [sourceSheetVisible, setSourceSheetVisible] = useState(false);

  const isUploading = uploading ?? internalUploading.current;

  function setUploadingState(v: boolean) {
    if (setUploading) setUploading(v);
    else internalUploading.current = v;
  }

  async function executeRemove() {
    await supabase.storage.from(bucket).remove([`${storagePath}.webp`]);
    onRemove?.();
  }

  async function processAndUpload(uri: string) {
    setUploadingState(true);
    try {
      const ctx = ImageManipulator.manipulate(uri);
      ctx.resize({ width: resizeWidth });
      const image = await ctx.renderAsync();
      const compressed = await image.saveAsync({ format: SaveFormat.WEBP, compress: quality });
      ctx.release();
      image.release();

      const path = `${storagePath}.webp`;
      const response = await fetch(compressed.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, arrayBuffer, { contentType: 'image/webp', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      onUploadComplete(publicUrl);
      setPreviewVisible(false);
    } catch {
      Alert.alert(t('common.error'), t('appointment.upload.error'));
    } finally {
      setUploadingState(false);
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('appointment.photoPermission.title'), t('appointment.photoPermission.message'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    await processAndUpload(result.assets[0].uri);
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('photo.cameraPermission.title'), t('photo.cameraPermission.message'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    await processAndUpload(result.assets[0].uri);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        onPress={currentUrl ? () => setPreviewVisible(true) : () => setSourceSheetVisible(true)}
        disabled={isUploading}
        activeOpacity={0.8}
      >
        {currentUrl ? (
          <>
            <Image source={{ uri: currentUrl }} style={styles.preview} resizeMode="cover" />
            {isUploading ? (
              <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                <ActivityIndicator color={colors.onPrimary} />
              </View>
            ) : (
              <View style={[styles.hintChip, { backgroundColor: colors.overlay }]}>
                <Ionicons name="camera" size={13} color={colors.onPrimary} />
              </View>
            )}
          </>
        ) : isUploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
            {label ? (
              <ThemedText tone="tertiary" style={styles.label}>{label}</ThemedText>
            ) : null}
          </View>
        )}
      </TouchableOpacity>

      <PhotoSourceSheet
        visible={sourceSheetVisible}
        onCamera={pickFromCamera}
        onGallery={pickFromGallery}
        onClose={() => setSourceSheetVisible(false)}
      />

      {currentUrl ? (
        <PhotoPreviewModal
          visible={previewVisible}
          uri={currentUrl}
          onClose={() => setPreviewVisible(false)}
          onChangePhoto={() => setSourceSheetVisible(true)}
          onRemove={onRemove ? executeRemove : undefined}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    padding: 12,
    paddingBottom: 32,
    gap: 10,
  },
  sheetCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
    paddingVertical: 14,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  sheetCancel: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetCancelLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import { useRef, useState } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { ThemedText } from './ThemedText';
import { PhotoPreviewModal } from './PhotoPreviewModal';

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

  const isUploading = uploading ?? internalUploading.current;

  async function executeRemove() {
    await supabase.storage.from(bucket).remove([`${storagePath}.webp`]);
    onRemove?.();
  }

  async function pick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('appointment.photoPermission.title'), t('appointment.photoPermission.message'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    if (setUploading) setUploading(true);
    else internalUploading.current = true;

    try {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: resizeWidth } }],
        { compress: quality, format: ImageManipulator.SaveFormat.WEBP }
      );

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
      if (setUploading) setUploading(false);
      else internalUploading.current = false;
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        onPress={currentUrl ? () => setPreviewVisible(true) : pick}
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

      {currentUrl ? (
        <PhotoPreviewModal
          visible={previewVisible}
          uri={currentUrl}
          onClose={() => setPreviewVisible(false)}
          onChangePhoto={pick}
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
});

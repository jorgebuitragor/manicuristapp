import { useState } from 'react';
import {
  Modal, View, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, StatusBar,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useError } from '@/context/ErrorContext';
import { ThemedText } from './ThemedText';
import { SwipeToDismissModal } from './SwipeToDismissModal';

interface PhotoPreviewModalProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
  onChangePhoto?: () => void;
  onRemove?: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function PhotoPreviewModal({ visible, uri, onClose, onChangePhoto, onRemove }: PhotoPreviewModalProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showError } = useError();
  const { showConfirm } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function downloadToTemp(): Promise<string> {
    const filename = uri.split('/').pop()?.split('?')[0] ?? 'photo.webp';
    const cacheDir = FileSystem.cacheDirectory ?? 'file:///tmp/';
    const dest = `${cacheDir}${filename}`;
    const { uri: localUri } = await FileSystem.downloadAsync(uri, dest);
    return localUri;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      if (status !== 'granted' && (status as string) !== 'limited') {
        showError(t('appointment.photo.permissionDenied'));
        return;
      }
      const localUri = await downloadToTemp();
      const jpeg = await ImageManipulator.manipulateAsync(
        localUri,
        [],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );
      await MediaLibrary.saveToLibraryAsync(jpeg.uri);
      showToast(t('appointment.photo.savedToGallery'), 'success');
    } catch (e) {
      console.error('[PhotoPreviewModal] handleSave error:', e);
      showError(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const localUri = await downloadToTemp();
      await Sharing.shareAsync(localUri, { mimeType: 'image/webp' });
    } catch {
      showError(t('common.error'));
    } finally {
      setSharing(false);
    }
  }

  function handleRemove() {
    showConfirm({
      title: t('photo.remove.title'),
      message: t('photo.remove.message'),
      confirmLabel: t('photo.remove.ok'),
      variant: 'danger',
      onConfirm: () => {
        onClose();
        onRemove?.();
      },
    });
  }

  const busy = saving || sharing;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']} onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.backdrop}>
        <SwipeToDismissModal onDismiss={onClose} containerStyle={styles.previewSwipeSurface}>
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={[styles.actions, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            {onChangePhoto ? (
              <>
                <TouchableOpacity style={styles.actionBtn} onPress={() => onChangePhoto()} disabled={busy}>
                  <Ionicons name="camera-outline" size={24} color="#fff" />
                  <ThemedText style={styles.actionLabel}>{t('photo.change')}</ThemedText>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
              </>
            ) : null}

            <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={busy}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="download-outline" size={24} color="#fff" />
              )}
              <ThemedText style={styles.actionLabel}>{t('appointment.photo.save')}</ThemedText>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} disabled={busy}>
              {sharing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="share-outline" size={24} color="#fff" />
              )}
              <ThemedText style={styles.actionLabel}>{t('appointment.photo.share')}</ThemedText>
            </TouchableOpacity>

            {onRemove ? (
              <>
                <View style={styles.actionDivider} />
                <TouchableOpacity style={styles.actionBtn} onPress={handleRemove} disabled={busy}>
                  <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
                  <ThemedText style={[styles.actionLabel, styles.actionLabelDanger]}>{t('photo.remove.ok')}</ThemedText>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </SwipeToDismissModal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSwipeSurface: {
    flex: 1,
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.8,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    position: 'absolute',
    bottom: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 12,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
  },
  actionLabelDanger: {
    color: '#ff6b6b',
  },
});

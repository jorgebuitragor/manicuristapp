import { useEffect, useRef } from 'react';
import {
  Modal, View, ScrollView, TouchableOpacity, Image,
  StyleSheet, Animated, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { usePolish, useDeletePolish } from '@/hooks/usePolishes';
import { useNailRacks } from '@/hooks/useNailRacks';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface PolishDetailModalProps {
  polishId: string | null;
  onClose: () => void;
}

function InfoRow({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <ThemedText variant="caption" tone="tertiary" style={styles.infoLabel}>{label}</ThemedText>
      <View style={styles.infoValueRow}>
        {swatch && <View style={[styles.swatch, { backgroundColor: swatch, borderColor: colors.border }]} />}
        <ThemedText style={styles.infoValue} numberOfLines={2}>{value}</ThemedText>
      </View>
    </View>
  );
}

export function PolishDetailModal({ polishId, onClose }: PolishDetailModalProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { data: polish, isLoading } = usePolish(polishId ?? '');
  const { data: racks = [] } = useNailRacks();
  const deletePolish = useDeletePolish();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  const visible = !!polishId;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 4, speed: 20 }),
      ]).start();
    } else {
      scale.setValue(0.92);
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.92, duration: 160, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  function handleEdit() {
    onClose();
    router.push({ pathname: '/polishes/edit' as any, params: { id: polishId } });
  }

  function handleDelete() {
    showConfirm({
      title: t('polishes.delete.title'),
      message: t('polishes.delete.message'),
      confirmLabel: t('polishes.delete.ok'),
      variant: 'danger',
      onConfirm: () =>
        deletePolish.mutate(polish!.id, {
          onSuccess: () => {
            showToast(t('polishes.toast.deleted'), 'info');
            onClose();
          },
        }),
    });
  }

  const rackName = polish?.rack_id
    ? racks.find((r) => r.id === polish.rack_id)?.name ?? null
    : null;

  const baseColorLabel = polish?.base_color
    ? (() => {
        const key = `polishes.colorFamilies.${polish.base_color}`;
        const translated = t(key as Parameters<typeof t>[0]);
        return translated !== key ? translated : polish.base_color;
      })()
    : null;

  const toneFamilyLabel = polish?.tone_family
    ? (() => {
        const key = `polishes.tones.${polish.tone_family}`;
        const translated = t(key as Parameters<typeof t>[0]);
        return translated !== key ? translated : polish.tone_family;
      })()
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <View style={styles.centeredWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            { transform: [{ scale }], opacity: backdropOpacity },
          ]}
        >
          {isLoading || !polish ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                {/* Color preview */}
                <View style={[styles.colorPreview, { backgroundColor: polish.hex_color ?? colors.primaryMuted }]}>
                  {polish.photo_url ? (
                    <Image source={{ uri: polish.photo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : polish.hex_color ? (
                    <View style={styles.nailShape}>
                      <View style={styles.nailShine} />
                    </View>
                  ) : (
                    <Ionicons name="color-palette" size={28} color="rgba(255,255,255,0.7)" />
                  )}
                </View>

                {/* Title area */}
                <View style={styles.titleArea}>
                  <ThemedText variant="subtitle" style={styles.polishName} numberOfLines={2}>
                    {polish.color_name}
                  </ThemedText>
                  <ThemedText tone="secondary" style={styles.brandText}>{polish.brand}</ThemedText>
                  <View style={[styles.codePill, { backgroundColor: colors.primaryMuted }]}>
                    <ThemedText variant="caption" tone="primary" style={styles.codeText}>
                      #{polish.polish_code}
                    </ThemedText>
                  </View>
                </View>

                {/* Close */}
                <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Info */}
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.infoList}
                showsVerticalScrollIndicator={false}
              >
                {polish.hex_color && (
                  <InfoRow label={t('polishes.selectColor')} value={polish.hex_color.toUpperCase()} swatch={polish.hex_color} />
                )}
                {baseColorLabel && <InfoRow label={t('polishes.baseColor')} value={baseColorLabel} />}
                {toneFamilyLabel && <InfoRow label={t('polishes.toneFamily')} value={toneFamilyLabel} />}
                <InfoRow label={t('polishes.rack')} value={rackName ?? t('polishes.unassignedRack')} />
                <InfoRow
                  label={t('polishes.position')}
                  value={polish.rack_position != null ? String(polish.rack_position) : t('polishes.noPosition')}
                />
                <InfoRow label={t('polishes.stock')} value={String(polish.stock)} />
                {polish.notes ? <InfoRow label={t('polishes.detail.notes')} value={polish.notes} /> : null}
              </ScrollView>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Actions */}
              <View style={styles.actions}>
                <ThemedButton
                  label={t('common.edit')}
                  variant="outline"
                  icon="pencil-outline"
                  onPress={handleEdit}
                  style={styles.actionBtn}
                />
                <ThemedButton
                  label={t('common.delete')}
                  variant="dangerOutline"
                  icon="trash-outline"
                  onPress={handleDelete}
                  style={styles.actionBtn}
                />
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  centeredWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  loader: {
    padding: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
  },
  colorPreview: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  nailShape: {
    width: 36,
    height: 54,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  nailShine: {
    position: 'absolute',
    top: 6,
    left: 7,
    width: 9,
    height: 20,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '-15deg' }],
  },
  titleArea: {
    flex: 1,
    gap: 4,
  },
  polishName: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  brandText: {
    fontSize: 14,
  },
  codePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  codeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  closeBtn: {
    padding: 4,
    marginTop: -2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  scrollArea: {
    maxHeight: 260,
  },
  infoList: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoLabel: {
    flexShrink: 0,
    paddingTop: 1,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  infoValue: {
    textAlign: 'right',
    flexShrink: 1,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  actionBtn: {
    flex: 1,
  },
});

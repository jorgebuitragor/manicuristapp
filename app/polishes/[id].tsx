import { View, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { SwipeToDismissModal, ModalDragHandle } from '@/components/ui/SwipeToDismissModal';
import { usePolish, useDeletePolish } from '@/hooks/usePolishes';
import { useNailRacks } from '@/hooks/useNailRacks';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';

function DetailRow({
  label,
  value,
  colorSwatch,
  valueTone,
}: {
  label: string;
  value: string;
  colorSwatch?: string;
  valueTone?: 'default' | 'danger';
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <ThemedText variant="caption" tone="secondary" style={styles.rowLabel}>{label}</ThemedText>
      <View style={styles.rowValue}>
        {colorSwatch && (
          <View style={[styles.colorSwatch, { backgroundColor: colorSwatch, borderColor: colors.border }]} />
        )}
        <ThemedText tone={valueTone ?? 'default'} style={styles.rowValueText}>{value}</ThemedText>
      </View>
    </View>
  );
}

export default function PolishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { data: polish, isLoading } = usePolish(id);
  const { data: racks = [] } = useNailRacks();
  const deletePolish = useDeletePolish();

  const rackName = polish?.rack_id ? racks.find((r) => r.id === polish.rack_id)?.name ?? null : null;

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!polish) return null;

  const baseColorLabel = polish.base_color
    ? (() => {
        const key = `polishes.colorFamilies.${polish.base_color}`;
        const translated = t(key as Parameters<typeof t>[0]);
        return translated !== key ? translated : polish.base_color;
      })()
    : null;

  const toneFamilyLabel = polish.tone_family
    ? (() => {
        const key = `polishes.tones.${polish.tone_family}`;
        const translated = t(key as Parameters<typeof t>[0]);
        return translated !== key ? translated : polish.tone_family;
      })()
    : null;

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
            router.back();
          },
        }),
    });
  }

  const showColorSection = polish.hex_color || polish.base_color || polish.tone_family;

  return (
    <SwipeToDismissModal onDismiss={() => router.back()}>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ModalDragHandle />
      <ScreenHeader
        leadingIcon="chevron-back"
        onLeadingPress={() => router.back()}
        title={polish.color_name}
        trailingLabel={t('common.edit')}
        onTrailingPress={() =>
          router.push({ pathname: '/polishes/edit' as any, params: { id: polish.id } })
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {polish.photo_url ? (
          <Image source={{ uri: polish.photo_url }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder, { backgroundColor: polish.hex_color ?? colors.primaryMuted }]}>
            {polish.hex_color ? (
              <View style={styles.heroNail}>
                <View style={styles.heroNailShine} />
              </View>
            ) : (
              <Ionicons name="color-palette" size={56} color="rgba(255,255,255,0.7)" />
            )}
          </View>
        )}

        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('polishes.section.identification')}</ThemedText>
          <DetailRow label={t('polishes.colorName').replace(' *', '')} value={polish.color_name} />
          <DetailRow label={t('polishes.filter.brand')} value={polish.brand} />
          <DetailRow label={t('polishes.polishCode').replace(' *', '')} value={`#${polish.polish_code}`} />
        </ThemedSection>

        {showColorSection ? (
          <ThemedSection>
            <ThemedText variant="sectionTitle">{t('polishes.section.color')}</ThemedText>
            {polish.hex_color && (
              <DetailRow
                label={t('polishes.selectColor')}
                value={polish.hex_color.toUpperCase()}
                colorSwatch={polish.hex_color}
              />
            )}
            {baseColorLabel && <DetailRow label={t('polishes.baseColor')} value={baseColorLabel} />}
            {toneFamilyLabel && <DetailRow label={t('polishes.toneFamily')} value={toneFamilyLabel} />}
          </ThemedSection>
        ) : null}

        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('polishes.section.location')}</ThemedText>
          <DetailRow
            label={t('polishes.rack')}
            value={rackName ?? t('polishes.unassignedRack')}
          />
          <DetailRow
            label={t('polishes.position')}
            value={polish.rack_position != null ? String(polish.rack_position) : t('polishes.noPosition')}
          />
        </ThemedSection>

        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('polishes.stock')}</ThemedText>
          <DetailRow
            label={t('polishes.stock')}
            value={String(polish.stock)}
            valueTone={polish.stock <= 0 ? 'danger' : 'default'}
          />
        </ThemedSection>

        {polish.notes ? (
          <ThemedSection>
            <ThemedText variant="sectionTitle">{t('polishes.detail.notes')}</ThemedText>
            <ThemedText tone="secondary">{polish.notes}</ThemedText>
          </ThemedSection>
        ) : null}

        <ThemedButton
          label={t('polishes.delete.ok')}
          variant="dangerOutline"
          onPress={handleDelete}
          style={styles.deleteButton}
        />
      </ScrollView>
    </SafeAreaView>
    </SwipeToDismissModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNail: {
    width: 80,
    height: 120,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  heroNailShine: {
    position: 'absolute',
    top: 10,
    left: 14,
    width: 20,
    height: 45,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '-15deg' }],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    flexShrink: 0,
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  rowValueText: {
    textAlign: 'right',
    flexShrink: 1,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 0,
  },
  deleteButton: {
    marginTop: 8,
  },
});

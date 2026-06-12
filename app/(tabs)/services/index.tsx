import { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { PhotoPickerField } from '@/components/ui/PhotoPickerField';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices';
import { useTheme } from '@/context/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import type { Service } from '@/types/database.types';

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <View style={styles.fieldLabelRow}>
      <ThemedText variant="label" tone="secondary">
        {label}
        {required ? <ThemedText tone="primary"> *</ThemedText> : null}
      </ThemedText>
      {hint ? <ThemedText variant="caption" tone="tertiary">{hint}</ThemedText> : null}
    </View>
  );
}

function InputWithSuffix({
  suffix,
  ...props
}: { suffix: string } & React.ComponentProps<typeof ThemedInput>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.inputSuffixRow, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
      <ThemedInput style={styles.inputNoBorder} {...props} />
      <View style={[styles.suffixBox, { borderLeftColor: colors.border }]}>
        <ThemedText tone="tertiary" style={styles.suffixText}>{suffix}</ThemedText>
      </View>
    </View>
  );
}

function ServiceModal({
  service,
  onClose,
}: {
  service?: Service | null;
  onClose: () => void;
}) {
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const tempIdRef = useRef(`new_${Date.now()}`);
  const durationRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const { colors } = useTheme();
  const { symbol } = useCurrency();
  const { t } = useI18n();
  const { showToast } = useToast();
  const isEditing = Boolean(service);

  useEffect(() => {
    if (!service) return;
    setName(service.name);
    setDuration(String(service.duration));
    setPrice(service.price != null ? String(service.price) : '');
    setPhotoUrl(service.photo_url ?? null);
  }, [service]);

  async function handleSave() {
    if (!name.trim()) {
      showToast(t('services.error.nameRequired'), 'error');
      return;
    }
    const parsedPrice = parseFloat(price.replace(',', '.'));
    const payload = {
      name: name.trim(),
      duration: parseInt(duration, 10) || 60,
      price: price.trim() ? (isNaN(parsedPrice) ? null : parsedPrice) : null,
      photo_url: photoUrl,
    };

    if (service) {
      await updateService.mutateAsync({ id: service.id, ...payload });
      showToast(t('services.toast.updated'));
    } else {
      await createService.mutateAsync(payload);
      showToast(t('services.toast.created'));
    }
    onClose();
  }

  const isPending = createService.isPending || updateService.isPending;

  return (
    <View style={[styles.modal, { backgroundColor: colors.background }]}>
      <ScreenHeader
        leadingLabel={t('common.cancel')}
        onLeadingPress={onClose}
        title={isEditing ? t('services.edit') : t('services.new')}
        trailingLabel={t('common.save')}
        onTrailingPress={handleSave}
        trailingDisabled={isPending}
      />
      <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

        {/* Foto */}
        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('services.addPhoto')}</ThemedText>
          <PhotoPickerField
            bucket="service-photos"
            storagePath={service ? `services/${service.id}` : `services/${tempIdRef.current}`}
            currentUrl={photoUrl}
            onUploadComplete={setPhotoUrl}
            onRemove={() => setPhotoUrl(null)}
            uploading={uploading}
            setUploading={setUploading}
            label={t('services.photoHint')}
            resizeWidth={800}
          />
        </ThemedSection>

        {/* Información */}
        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('services.section.info')}</ThemedText>

          <View style={styles.field}>
            <FieldLabel label={t('services.name')} required />
            <ThemedInput
              value={name}
              onChangeText={setName}
              placeholder={t('services.namePlaceholder')}
              autoFocus={!isEditing}
              returnKeyType="next"
              onSubmitEditing={() => durationRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.field}>
            <FieldLabel label={t('services.duration')} />
            <InputWithSuffix
              ref={durationRef}
              suffix={t('services.minutes')}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => priceRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </ThemedSection>

        {/* Precio */}
        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('services.section.pricing')}</ThemedText>

          <View style={styles.field}>
            <FieldLabel
              label={t('services.price')}
              hint={t('services.priceHint')}
            />
            <InputWithSuffix
              ref={priceRef}
              suffix={symbol}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder="0.00"
            />
          </View>
        </ThemedSection>

      </ScrollView>
    </View>
  );
}

function ServiceRow({
  service,
  onPress,
  onDelete,
}: {
  service: Service;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { formatAmount } = useCurrency();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.rowMain} onPress={onPress} activeOpacity={0.85}>
        {service.photo_url ? (
          <Image source={{ uri: service.photo_url }} style={styles.rowImage} resizeMode="cover" />
        ) : (
          <View style={[styles.rowImagePlaceholder, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="hand-left-outline" size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.rowInfo}>
          <ThemedText variant="subtitle" numberOfLines={1}>{service.name}</ThemedText>
          <ThemedText variant="caption" tone="secondary">
            {`${service.duration} ${t('services.minutes')}`}
            {service.price != null ? `  ·  ${formatAmount(service.price)}` : ''}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.rowDeleteBtn, { borderLeftColor: colors.border }]}
        onPress={onDelete}
        hitSlop={4}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

export default function ServicesScreen() {
  const router = useRouter();
  const { data: services, isLoading } = useServices();
  const deleteService = useDeleteService();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { colors } = useTheme();
  const { t } = useI18n();

  function handleDelete(service: Service) {
    showConfirm({
      title: service.name,
      message: t('services.delete.message'),
      confirmLabel: t('services.delete.ok'),
      variant: 'danger',
      onConfirm: () => deleteService.mutate(service.id, { onSuccess: () => showToast(t('services.toast.deleted'), 'info') }),
    });
  }

  function closeModal() {
    setShowAdd(false);
    setEditingService(null);
  }

  if (showAdd || editingService) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ServiceModal service={editingService} onClose={closeModal} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingIcon="arrow-back"
        onLeadingPress={() => router.back()}
        title={t('services.title')}
        trailingLabel={t('services.new')}
        onTrailingPress={() => setShowAdd(true)}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {services?.length ? (
            services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onPress={() => setEditingService(service)}
                onDelete={() => handleDelete(service)}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="hand-left-outline" size={48} color={colors.textTertiary} />
              <ThemedText tone="tertiary" style={styles.emptyText}>{t('services.empty')}</ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 60 },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 14,
  },
  rowDeleteBtn: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  rowImage: {
    width: 72,
    height: 72,
  },
  rowImagePlaceholder: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 4,
    paddingVertical: 14,
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  // Modal
  modal: { flex: 1 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, gap: 12, paddingBottom: 40 },
  field: { gap: 6 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputSuffixRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputNoBorder: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  suffixBox: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  suffixText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

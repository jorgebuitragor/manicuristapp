import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhotoPickerField } from '@/components/ui/PhotoPickerField';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedField } from '@/components/ui/ThemedField';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ColorPickerField } from '@/components/ui/ColorPickerField';
import { ThemedDropdown } from '@/components/ui/ThemedDropdown';
import { ThemedText } from '@/components/ui/ThemedText';
import { SwipeToDismissModal } from '@/components/ui/SwipeToDismissModal';
import { usePolishes, useCreatePolish, useUpdatePolish } from '@/hooks/usePolishes';
import { usePolishBrands } from '@/hooks/usePolishBrands';
import { useNailRacks } from '@/hooks/useNailRacks';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useError } from '@/context/ErrorContext';
import type { NailPolish } from '@/types/database.types';

function normalizeHexColor(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/.test(normalized)) return null;
  return normalized;
}

function FormSection({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <ThemedText
      variant="caption"
      tone="secondary"
      style={[styles.sectionLabel, { borderBottomColor: colors.border }]}
    >
      {label.toUpperCase()}
    </ThemedText>
  );
}

function StockStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stepper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={() => onChange(Math.max(0, value - 1))}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={20} color={value === 0 ? colors.textTertiary : colors.text} />
      </TouchableOpacity>
      <View style={[styles.stepperDivider, { backgroundColor: colors.border }]} />
      <ThemedText style={styles.stepperValue}>{value}</ThemedText>
      <View style={[styles.stepperDivider, { backgroundColor: colors.border }]} />
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={() => onChange(value + 1)}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

interface PolishFormModalProps {
  onClose: () => void;
  polish?: NailPolish | null;
  initialRackId?: string;
  initialPosition?: number;
}

export function PolishFormModal({ onClose, polish, initialRackId, initialPosition }: PolishFormModalProps) {
  const createPolish = useCreatePolish();
  const updatePolish = useUpdatePolish();
  const { data: brands = [] } = usePolishBrands();
  const { data: racks = [] } = useNailRacks();
  const { data: allPolishes = [] } = usePolishes();
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [polishCode, setPolishCode] = useState('');
  const [selectedRackId, setSelectedRackId] = useState(initialRackId ?? '');
  const [rackPosition, setRackPosition] = useState(initialPosition != null ? String(initialPosition) : '');
  const [colorName, setColorName] = useState('');
  const [hexColor, setHexColor] = useState('');
  const [baseColor, setBaseColor] = useState('pink');
  const [toneFamily, setToneFamily] = useState('classic');
  const [effect, setEffect] = useState<string>('');
  const [showColorPickerModal, setShowColorPickerModal] = useState(false);
  const [stock, setStock] = useState(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const tempIdRef = useRef(`new_${Date.now()}`);
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showError } = useError();
  const isEditing = Boolean(polish);

  const { selectedRack, positionSlots, parsedPosition, isPositionTaken, isOverCapacity, occupantPolish } = useMemo(() => {
    const rackPolishes = allPolishes.filter(
      (p) => p.rack_id === selectedRackId && p.id !== polish?.id
    );
    const occupied = new Set(
      rackPolishes.filter((p) => p.rack_position != null).map((p) => p.rack_position!)
    );
    const rack = racks.find((r) => r.id === selectedRackId) ?? null;
    const maxCap = rack?.max_capacity ?? null;
    const parsed = parseInt(rackPosition, 10);
    const taken = !isNaN(parsed) && parsed > 0 && occupied.has(parsed);
    const overCap = !isNaN(parsed) && parsed > 0 && maxCap != null && parsed > maxCap;

    let slots: { position: number; taken: boolean }[] = [];
    if (selectedRackId) {
      const limit = maxCap ?? Math.max(Math.max(...occupied, 0) + 3, 5);
      for (let i = 1; i <= limit; i++) {
        slots.push({ position: i, taken: occupied.has(i) });
      }
    }

    return {
      selectedRack: rack,
      positionSlots: slots,
      parsedPosition: isNaN(parsed) ? null : parsed,
      isPositionTaken: taken,
      isOverCapacity: overCap,
      occupantPolish: taken ? rackPolishes.find((p) => p.rack_position === parsed) ?? null : null,
    };
  }, [allPolishes, selectedRackId, rackPosition, polish?.id, racks]);

  useEffect(() => {
    if (!polish) return;
    setSelectedBrandId(polish.brand_id ?? '');
    setPolishCode(polish.polish_code ?? '');
    setSelectedRackId(polish.rack_id ?? '');
    setRackPosition(polish.rack_position ? String(polish.rack_position) : '');
    setColorName(polish.color_name ?? '');
    setHexColor(polish.hex_color ?? '');
    setBaseColor(polish.base_color ?? 'pink');
    setToneFamily(polish.tone_family ?? 'classic');
    setEffect(polish.effect ?? '');
    setShowColorPickerModal(false);
    setStock(polish.stock ?? 1);
    setPhotoUrl(polish.photo_url ?? null);
  }, [polish]);

  async function handleSave() {
    const selectedBrand = brands.find((b) => b.id === selectedBrandId);
    if (!selectedBrand || !colorName.trim() || !polishCode.trim()) {
      showError(t('polishes.error.required'));
      return;
    }
    const normalizedHex = normalizeHexColor(hexColor);
    if (hexColor.trim() && !normalizedHex) {
      showError(t('polishes.invalidHex'));
      return;
    }
    const payload = {
      brand: selectedBrand.name,
      brand_id: selectedBrand.id,
      polish_code: polishCode.trim(),
      rack_id: selectedRackId || null,
      rack_position: rackPosition.trim() ? parseInt(rackPosition, 10) || null : null,
      color_name: colorName.trim(),
      hex_color: normalizedHex,
      base_color: baseColor || null,
      tone_family: toneFamily || null,
      effect: (effect || null) as NailPolish['effect'],
      photo_url: photoUrl,
      stock,
      notes: polish?.notes ?? null,
    };
    if (polish) {
      await updatePolish.mutateAsync({ id: polish.id, ...payload });
      showToast(t('polishes.toast.updated'));
    } else {
      await createPolish.mutateAsync(payload);
      showToast(t('polishes.toast.created'));
    }
    onClose();
  }

  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));
  const rackOptions = racks.map((r) => ({ value: r.id, label: r.name }));
  const normalizedHex = normalizeHexColor(hexColor);

  return (
    <View style={[styles.modal, { backgroundColor: colors.background }]}>
      <ScreenHeader
        leadingLabel={t('common.cancel')}
        onLeadingPress={onClose}
        title={isEditing ? t('polishes.edit') : t('polishes.new')}
        trailingLabel={t('common.save')}
        onTrailingPress={handleSave}
        trailingDisabled={createPolish.isPending || updatePolish.isPending}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <PhotoPickerField
          bucket="polish-photos"
          storagePath={polish ? `polishes/${polish.id}` : `polishes/${tempIdRef.current}`}
          currentUrl={photoUrl}
          onUploadComplete={setPhotoUrl}
          onRemove={() => setPhotoUrl(null)}
          uploading={uploading}
          setUploading={setUploading}
          label={t('polishes.addPhoto')}
        />

        <FormSection label={t('polishes.section.identification')} />

        <ThemedDropdown
          label={t('polishes.brand')}
          value={selectedBrandId}
          options={brandOptions}
          onChange={setSelectedBrandId}
          placeholder={t('polishes.brandPlaceholder')}
          stackOrder={20}
        />

        <ThemedField
          label={t('polishes.polishCode')}
          placeholder="001"
          value={polishCode}
          onChangeText={setPolishCode}
          autoCapitalize="characters"
        />

        <FormSection label={t('polishes.section.color')} />

        <ThemedField
          label={t('polishes.colorName')}
          placeholder="Nude Rose"
          value={colorName}
          onChangeText={setColorName}
        />

        <TouchableOpacity
          style={[styles.colorTrigger, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
          onPress={() => setShowColorPickerModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.colorTriggerLeft}>
            <ThemedText variant="caption" tone="tertiary">{t('polishes.selectColor')}</ThemedText>
            <ThemedText style={[styles.colorTriggerHex, { color: normalizedHex ? colors.text : colors.textTertiary }]}>
              {normalizedHex ?? t('polishes.selectColorAction')}
            </ThemedText>
          </View>
          <View style={styles.colorTriggerRight}>
            <View
              style={[
                styles.colorSwatch,
                {
                  backgroundColor: normalizedHex ?? colors.inputBackground,
                  borderColor: colors.border,
                },
              ]}
            />
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <ThemedDropdown
          label={t('polishes.effect')}
          value={effect}
          options={[
            { value: '', label: t('polishes.effect.none') },
            { value: 'matte', label: t('polishes.effect.matte') },
            { value: 'shimmer', label: t('polishes.effect.shimmer') },
            { value: 'glitter', label: t('polishes.effect.glitter') },
            { value: 'cat_eye', label: t('polishes.effect.cat_eye') },
            { value: 'holographic', label: t('polishes.effect.holographic') },
            { value: 'duochrome', label: t('polishes.effect.duochrome') },
          ]}
          onChange={setEffect}
          stackOrder={15}
        />

        <FormSection label={t('polishes.section.location')} />

        <ThemedDropdown
          label={t('polishes.rack')}
          value={selectedRackId}
          options={rackOptions}
          onChange={setSelectedRackId}
          placeholder={t('polishes.rackPlaceholder')}
          stackOrder={10}
        />

        <View style={styles.positionField}>
          <View style={styles.positionLabelRow}>
            <ThemedText variant="label" tone="secondary">{t('polishes.rackPosition')}</ThemedText>
            {selectedRack?.max_capacity ? (
              <ThemedText variant="caption" tone="tertiary">
                {`${t('polishes.capacity')}: ${selectedRack.max_capacity}`}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.positionInputRow}>
            <ThemedInput
              style={styles.positionInput}
              placeholder="1"
              value={rackPosition}
              onChangeText={setRackPosition}
              keyboardType="number-pad"
            />
            {rackPosition.trim() && parsedPosition != null && parsedPosition > 0 ? (
              <View style={[
                styles.positionBadge,
                { backgroundColor: isPositionTaken || isOverCapacity ? colors.dangerMuted : colors.primaryMuted },
              ]}>
                <Ionicons
                  name={isPositionTaken || isOverCapacity ? 'close-circle' : 'checkmark-circle'}
                  size={18}
                  color={isPositionTaken || isOverCapacity ? colors.danger : colors.primary}
                />
              </View>
            ) : null}
          </View>
          {isOverCapacity ? (
            <ThemedText variant="caption" tone="danger">
              {t('polishes.position.overCapacity')}
            </ThemedText>
          ) : isPositionTaken && occupantPolish ? (
            <ThemedText variant="caption" tone="danger">
              {`${t('polishes.position.takenBy')}: ${occupantPolish.polish_code} · ${occupantPolish.color_name}`}
            </ThemedText>
          ) : null}
          {positionSlots.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll} contentContainerStyle={styles.slotsContent}>
              {positionSlots.map(({ position, taken }) => {
                const isCurrent = parsedPosition === position;
                return (
                  <TouchableOpacity
                    key={position}
                    onPress={() => !taken ? setRackPosition(String(position)) : undefined}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: isCurrent ? colors.primary : taken ? colors.dangerMuted : colors.primaryMuted,
                        borderColor: isCurrent ? colors.primary : taken ? colors.dangerBorder : colors.border,
                        opacity: taken && !isCurrent ? 0.7 : 1,
                      },
                    ]}
                    activeOpacity={taken ? 1 : 0.7}
                  >
                    <ThemedText
                      variant="caption"
                      style={{ color: isCurrent ? colors.onPrimary : taken ? colors.danger : colors.primary, fontWeight: '700' }}
                    >
                      {position}
                    </ThemedText>
                    {taken && !isCurrent ? (
                      <Ionicons name="lock-closed" size={8} color={colors.danger} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <FormSection label={t('polishes.stock')} />
        <StockStepper value={stock} onChange={setStock} />
      </ScrollView>

      {showColorPickerModal ? (
        <View style={[styles.colorModalOverlay, { backgroundColor: colors.background }]}>
          <SwipeToDismissModal onDismiss={() => setShowColorPickerModal(false)} containerStyle={styles.colorSwipeSurface}>
            <ScreenHeader
              leadingLabel={t('common.cancel')}
              onLeadingPress={() => setShowColorPickerModal(false)}
              title={t('polishes.selectColor')}
              trailingLabel={t('common.ok')}
              onTrailingPress={() => setShowColorPickerModal(false)}
            />
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <ColorPickerField
                value={hexColor}
                onChangeValue={setHexColor}
                baseColor={baseColor}
                onChangeBaseColor={setBaseColor}
                toneFamily={toneFamily}
                onChangeToneFamily={setToneFamily}
                label={t('polishes.selectColor')}
                placeholder={t('polishes.hexColor')}
                hint={t('polishes.colorHint')}
              />
            </ScrollView>
          </SwipeToDismissModal>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  sectionLabel: {
    letterSpacing: 0.7,
    fontWeight: '600',
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  stepperValue: {
    width: 52,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  colorTrigger: {
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  colorTriggerLeft: {
    flex: 1,
    gap: 4,
  },
  colorTriggerHex: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  positionField: { gap: 6 },
  positionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  positionInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  positionInput: { flex: 1 },
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsScroll: { marginTop: 4 },
  slotsContent: { gap: 6, paddingVertical: 2 },
  slot: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  colorModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  colorSwipeSurface: {
    flex: 1,
  },
});

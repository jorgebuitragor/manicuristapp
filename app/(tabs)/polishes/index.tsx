import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  View, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, TextInput,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedDropdown } from '@/components/ui/ThemedDropdown';
import { ThemedText } from '@/components/ui/ThemedText';
import { usePolishes, useDeletePolish, useMovePolish } from '@/hooks/usePolishes';
import { usePolishBrands } from '@/hooks/usePolishBrands';
import { useNailRacks } from '@/hooks/useNailRacks';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { usePolishLabels } from '@/context/PolishLabelsContext';
import type { NailPolish, PolishBrand, NailRack } from '@/types/database.types';

const MIN_CARD_WIDTH = 130;

type PolishViewMode = 'grid' | 'list' | 'swatch';
type StockFilter = 'all' | 'inStock' | 'outOfStock';
type PolishSort = 'recent' | 'color' | 'brand' | 'code' | 'position';
type SortDirection = 'asc' | 'desc';

interface PolishFilterState {
  brandId: string;
  rackId: string;
  stock: StockFilter;
  baseColor: string;
  toneFamily: string;
  sortBy: PolishSort;
  sortDirection: SortDirection;
}

const DEFAULT_POLISH_FILTERS: PolishFilterState = {
  brandId: '',
  rackId: '',
  stock: 'all',
  baseColor: '',
  toneFamily: '',
  sortBy: 'recent',
  sortDirection: 'desc',
};


function buildPolishLocation(polish: NailPolish, rackName: string | undefined, positionLabel: string) {
  return `#${polish.polish_code}${rackName ? ` · ${rackName}` : ''}${polish.rack_position ? ` · ${positionLabel} ${polish.rack_position}` : ''}`;
}

function compareNullableNumbers(left: number | null, right: number | null) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
}

function PolishViewButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.viewButton,
        {
          backgroundColor: active ? colors.primaryMuted : colors.inputBackground,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={16} color={active ? colors.primary : colors.textSecondary} />
      <ThemedText variant="caption" tone={active ? 'primary' : 'secondary'} style={styles.viewButtonLabel}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

function PolishCard({ polish, rackName, onPress, onLongPress }: {
  polish: NailPolish;
  rackName?: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const locationLabel = buildPolishLocation(polish, rackName, t('polishes.position'));

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8}>
      {polish.photo_url ? (
        <Image source={{ uri: polish.photo_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: polish.hex_color ?? colors.primaryMuted }]}>
          <Ionicons name="color-palette" size={28} color="rgba(255,255,255,0.8)" />
        </View>
      )}
      <View style={styles.cardInfo}>
        {polish.hex_color && (
          <View style={[styles.colorDot, { backgroundColor: polish.hex_color }]} />
        )}
        <ThemedText style={styles.colorName} numberOfLines={1}>{polish.color_name}</ThemedText>
        <ThemedText variant="caption" tone="tertiary" style={styles.brandName} numberOfLines={1}>{polish.brand}</ThemedText>
        <ThemedText variant="caption" tone="tertiary" style={styles.locationText} numberOfLines={2}>{locationLabel}</ThemedText>
        {polish.stock <= 0 && (
          <ThemedText variant="caption" tone="danger" style={styles.outOfStock}>Sin stock</ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PolishListItem({ polish, rackName, onPress, onLongPress }: {
  polish: NailPolish;
  rackName?: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const locationLabel = buildPolishLocation(polish, rackName, t('polishes.position'));

  return (
    <TouchableOpacity
      style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      {polish.photo_url ? (
        <Image source={{ uri: polish.photo_url }} style={styles.listImage} resizeMode="cover" />
      ) : (
        <View style={[styles.listImagePlaceholder, { backgroundColor: polish.hex_color ?? colors.primaryMuted }]}>
          <Ionicons name="color-palette" size={24} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      <View style={styles.listMainInfo}>
        <View style={styles.listTitleRow}>
          <View style={styles.listTitleGroup}>
            <ThemedText variant="subtitle" numberOfLines={1}>{polish.color_name}</ThemedText>
            <ThemedText variant="caption" tone="tertiary" numberOfLines={1}>{polish.brand}</ThemedText>
          </View>
          {polish.hex_color ? <View style={[styles.listColorDot, { backgroundColor: polish.hex_color }]} /> : null}
        </View>

        <ThemedText variant="caption" tone="secondary" numberOfLines={2}>{locationLabel}</ThemedText>

        <View style={styles.listMetaRow}>
          <ThemedText variant="caption" tone={polish.stock > 0 ? 'tertiary' : 'danger'}>
            {polish.stock > 0 ? `${t('polishes.stock')}: ${polish.stock}` : 'Sin stock'}
          </ThemedText>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function NailSwatch({ polish, onPress, onLongPress }: {
  polish: NailPolish;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const swatchColor = polish.hex_color ?? colors.primaryMuted;
  const isLight = polish.hex_color
    ? parseInt(polish.hex_color.slice(1), 16) > 0xaaaaaa
    : true;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      style={styles.swatchWrapper}
    >
      <View style={[styles.nail, { backgroundColor: swatchColor, shadowColor: swatchColor }]}>
        <View style={[styles.nailShine, { backgroundColor: isLight ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }]} />
        {polish.stock <= 0 && (
          <View style={styles.outOfStockOverlay}>
            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </View>
      <ThemedText variant="caption" tone="tertiary" style={styles.swatchCode} numberOfLines={1}>
        {polish.polish_code}
      </ThemedText>
    </TouchableOpacity>
  );
}

function SwatchSection({
  rackName,
  rackId,
  polishes,
  maxCapacity,
  onPress,
  showAllPositions,
}: {
  rackName: string;
  rackId: string | null;
  polishes: NailPolish[];
  maxCapacity: number | null;
  onPress: (polish: NailPolish) => void;
  showAllPositions: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const movePolish = useMovePolish();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPolish = selectedId ? polishes.find((p) => p.id === selectedId) ?? null : null;

  // Positions already occupied in this rack
  const occupiedMap = useMemo(() => {
    const m = new Map<number, NailPolish>();
    for (const p of polishes) {
      if (p.rack_position != null) m.set(p.rack_position, p);
    }
    return m;
  }, [polishes]);

  // Slot range to display in move mode or showAllPositions
  const allSlots = useMemo(() => {
    const occupiedPositions = [...occupiedMap.keys()];
    const max = maxCapacity ?? (occupiedPositions.length > 0 ? Math.max(...occupiedPositions) : 0);
    if (max <= 0) return [];
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [maxCapacity, occupiedMap]);

  const moveSlots = useMemo(() => {
    if (!selectedPolish) return [];
    return allSlots.length > 0 ? allSlots : Array.from({ length: Math.max(Math.max(...occupiedMap.keys(), 0) + 2, 5) }, (_, i) => i + 1);
  }, [selectedPolish, allSlots, occupiedMap]);

  async function handleSlotPress(position: number) {
    if (!selectedPolish || !rackId) return;
    const occupant = occupiedMap.get(position);
    if (occupant?.id === selectedPolish.id) {
      setSelectedId(null);
      return;
    }
    try {
      await movePolish.mutateAsync({
        polishId: selectedPolish.id,
        targetPosition: position,
        rackId,
        occupantId: occupant?.id,
        occupantCurrentPosition: selectedPolish.rack_position,
      });
      setSelectedId(null);
      showToast(t('polishes.position.moved'));
    } catch {
      showToast(t('common.error'));
    }
  }

  return (
    <View style={[styles.swatchSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.swatchSectionHeader}>
        <ThemedText variant="sectionTitle">{rackName}</ThemedText>
        <View style={styles.swatchSectionRight}>
          <ThemedText variant="caption" tone="tertiary">{`${polishes.length} ${t('tabs.polishes').toLowerCase()}`}</ThemedText>
          {selectedId ? (
            <TouchableOpacity onPress={() => setSelectedId(null)} hitSlop={8}>
              <ThemedText variant="caption" tone="primary">{t('common.cancel')}</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {selectedPolish ? (
        <>
          <View style={[styles.moveBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
            <Ionicons name="move-outline" size={14} color={colors.primary} />
            <ThemedText variant="caption" tone="primary">
              {`${selectedPolish.color_name} · ${t('polishes.position.selectTarget')}`}
            </ThemedText>
          </View>
          <View style={styles.swatchGrid}>
            {moveSlots.map((pos) => {
              const occupant = occupiedMap.get(pos);
              const isSelf = occupant?.id === selectedPolish.id;
              const isOccupied = !!occupant && !isSelf;
              return (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.swatchWrapper,
                    styles.moveSlot,
                    {
                      borderColor: isSelf ? colors.primary : isOccupied ? colors.border : colors.primaryMuted,
                      backgroundColor: isSelf ? colors.primaryMuted : 'transparent',
                    },
                  ]}
                  onPress={() => handleSlotPress(pos)}
                  activeOpacity={0.7}
                  disabled={movePolish.isPending}
                >
                  {occupant ? (
                    <>
                      <View style={[styles.nail, { backgroundColor: occupant.hex_color ?? colors.primaryMuted, shadowColor: occupant.hex_color ?? colors.primaryMuted }]}>
                        <View style={styles.nailShine} />
                        {isSelf ? (
                          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="hand-right-outline" size={14} color="#fff" />
                          </View>
                        ) : null}
                      </View>
                      <ThemedText variant="caption" tone="tertiary" style={styles.swatchCode} numberOfLines={1}>{occupant.polish_code}</ThemedText>
                    </>
                  ) : (
                    <>
                      <View style={[styles.nail, styles.emptySlotNail, { borderColor: colors.primary }]}>
                        <ThemedText style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{pos}</ThemedText>
                      </View>
                      <ThemedText variant="caption" tone="tertiary" style={styles.swatchCode}>{'·'}</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : showAllPositions && allSlots.length > 0 ? (
        <View style={styles.swatchGrid}>
          {allSlots.map((pos) => {
            const polish = occupiedMap.get(pos);
            return polish ? (
              <NailSwatch
                key={pos}
                polish={polish}
                onPress={() => onPress(polish)}
                onLongPress={() => setSelectedId(polish.id)}
              />
            ) : (
              <View key={pos} style={[styles.swatchWrapper]}>
                <View style={[styles.nail, styles.emptySlotNail, { borderColor: colors.border }]}>
                  <ThemedText style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '600' }}>{pos}</ThemedText>
                </View>
                <ThemedText variant="caption" tone="tertiary" style={styles.swatchCode}>{'–'}</ThemedText>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.swatchGrid}>
          {polishes.map((polish) => (
            <NailSwatch
              key={polish.id}
              polish={polish}
              onPress={() => onPress(polish)}
              onLongPress={() => setSelectedId(polish.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function PolishFiltersModal({
  visible,
  onClose,
  brands,
  racks,
  initialState,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  brands: PolishBrand[];
  racks: NailRack[];
  initialState: PolishFilterState;
  onApply: (state: PolishFilterState) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { baseColors, toneFamilies } = usePolishLabels();
  const [draft, setDraft] = useState<PolishFilterState>(initialState);

  useEffect(() => {
    if (visible) {
      setDraft(initialState);
    }
  }, [initialState, visible]);

  const brandOptions = [{ value: '', label: t('polishes.filter.allBrands') }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))];
  const rackOptions = [{ value: '', label: t('polishes.filter.allRacks') }, ...racks.map((rack) => ({ value: rack.id, label: rack.name }))];
  const stockOptions = [
    { value: 'all', label: t('polishes.filter.stock.all') },
    { value: 'inStock', label: t('polishes.filter.stock.inStock') },
    { value: 'outOfStock', label: t('polishes.filter.stock.outOfStock') },
  ];
  const baseColorOptions = [
    { value: '', label: t('polishes.filter.allBaseColors') },
    ...baseColors.map((entry) => {
      const i18nLabel = t(`polishes.colorFamilies.${entry.key}`);
      return { value: entry.key, label: entry.label ?? (i18nLabel !== `polishes.colorFamilies.${entry.key}` ? i18nLabel : entry.key) };
    }),
  ];
  const toneOptions = [
    { value: '', label: t('polishes.filter.allToneFamilies') },
    ...toneFamilies.map((entry) => {
      const i18nLabel = t(`polishes.tones.${entry.key}`);
      return { value: entry.key, label: entry.label ?? (i18nLabel !== `polishes.tones.${entry.key}` ? i18nLabel : entry.key) };
    }),
  ];
  const sortOptions = [
    { value: 'recent', label: t('polishes.sort.recent') },
    { value: 'color', label: t('polishes.sort.color') },
    { value: 'brand', label: t('polishes.sort.brand') },
    { value: 'code', label: t('polishes.sort.code') },
    { value: 'position', label: t('polishes.sort.position') },
  ];
  const sortDirectionOptions = [
    { value: 'asc', label: t('polishes.sortDirection.asc') },
    { value: 'desc', label: t('polishes.sortDirection.desc') },
  ];

  function updateDraft<Key extends keyof PolishFilterState>(key: Key, value: PolishFilterState[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.filtersModalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.filtersModalSheet, { backgroundColor: colors.background }]}>
          <ScreenHeader
            leadingLabel={t('common.cancel')}
            onLeadingPress={onClose}
            title={t('polishes.filtersTitle')}
            trailingLabel={t('common.apply')}
            onTrailingPress={() => {
              onApply(draft);
              onClose();
            }}
          />

          <ScrollView contentContainerStyle={styles.filtersContent} keyboardShouldPersistTaps="handled">
            <ThemedDropdown
              label={t('polishes.filter.brand')}
              value={draft.brandId}
              options={brandOptions}
              onChange={(value) => updateDraft('brandId', value)}
              placeholder={t('polishes.filter.allBrands')}
              stackOrder={70}
            />

            <ThemedDropdown
              label={t('polishes.filter.rack')}
              value={draft.rackId}
              options={rackOptions}
              onChange={(value) => updateDraft('rackId', value)}
              placeholder={t('polishes.filter.allRacks')}
              stackOrder={60}
            />

            <ThemedDropdown
              label={t('polishes.filter.stock')}
              value={draft.stock}
              options={stockOptions}
              onChange={(value) => updateDraft('stock', value as StockFilter)}
              stackOrder={50}
            />

            <ThemedDropdown
              label={t('polishes.filter.baseColor')}
              value={draft.baseColor}
              options={baseColorOptions}
              onChange={(value) => updateDraft('baseColor', value)}
              placeholder={t('polishes.filter.allBaseColors')}
              stackOrder={40}
            />

            <ThemedDropdown
              label={t('polishes.filter.toneFamily')}
              value={draft.toneFamily}
              options={toneOptions}
              onChange={(value) => updateDraft('toneFamily', value)}
              placeholder={t('polishes.filter.allToneFamilies')}
              stackOrder={30}
            />

            <ThemedDropdown
              label={t('polishes.sortBy')}
              value={draft.sortBy}
              options={sortOptions}
              onChange={(value) => updateDraft('sortBy', value as PolishSort)}
              stackOrder={20}
            />

            <ThemedDropdown
              label={t('polishes.sortDirection')}
              value={draft.sortDirection}
              options={sortDirectionOptions}
              onChange={(value) => updateDraft('sortDirection', value as SortDirection)}
              stackOrder={10}
            />

            <ThemedButton
              label={t('polishes.clearFilters')}
              variant="ghost"
              onPress={() => setDraft(DEFAULT_POLISH_FILTERS)}
              style={styles.clearFiltersButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function PolishesScreen() {
  const router = useRouter();
  const { data: polishes, isLoading } = usePolishes();
  const { data: brands = [] } = usePolishBrands();
  const { data: racks = [] } = useNailRacks();
  const deletePolish = useDeletePolish();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [viewMode, setViewMode] = useState<PolishViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PolishFilterState>(DEFAULT_POLISH_FILTERS);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const { width } = useWindowDimensions();
  const gridColumns = Math.max(2, Math.floor(width / MIN_CARD_WIDTH));
  const { colors } = useTheme();
  const { t } = useI18n();

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const rackMap = new Map(racks.map((rack) => [rack.id, rack.name]));
  const hasActiveFilters =
    filters.brandId !== DEFAULT_POLISH_FILTERS.brandId ||
    filters.rackId !== DEFAULT_POLISH_FILTERS.rackId ||
    filters.stock !== DEFAULT_POLISH_FILTERS.stock ||
    filters.baseColor !== DEFAULT_POLISH_FILTERS.baseColor ||
    filters.toneFamily !== DEFAULT_POLISH_FILTERS.toneFamily ||
    filters.sortBy !== DEFAULT_POLISH_FILTERS.sortBy ||
    filters.sortDirection !== DEFAULT_POLISH_FILTERS.sortDirection;

  const filtered = [...(polishes ?? [])]
    .filter((polish) => {
      const rackName = polish.rack_id ? rackMap.get(polish.rack_id)?.toLowerCase() : '';
      const matchesSearch =
        !normalizedSearch ||
        polish.color_name.toLowerCase().includes(normalizedSearch) ||
        polish.brand.toLowerCase().includes(normalizedSearch) ||
        polish.polish_code.toLowerCase().includes(normalizedSearch) ||
        rackName?.includes(normalizedSearch);

      const matchesBrand = !filters.brandId || polish.brand_id === filters.brandId;
      const matchesRack = !filters.rackId || polish.rack_id === filters.rackId;
      const matchesStock =
        filters.stock === 'all' ||
        (filters.stock === 'inStock' && polish.stock > 0) ||
        (filters.stock === 'outOfStock' && polish.stock <= 0);
      const matchesBaseColor = !filters.baseColor || polish.base_color === filters.baseColor;
      const matchesToneFamily = !filters.toneFamily || polish.tone_family === filters.toneFamily;

      return matchesSearch && matchesBrand && matchesRack && matchesStock && matchesBaseColor && matchesToneFamily;
    })
    .sort((left, right) => {
      let result = 0;

      if (filters.sortBy === 'color') {
        result = left.color_name.localeCompare(right.color_name, undefined, { sensitivity: 'base' });
      } else if (filters.sortBy === 'brand') {
        result = left.brand.localeCompare(right.brand, undefined, { sensitivity: 'base' });
      } else if (filters.sortBy === 'code') {
        result = left.polish_code.localeCompare(right.polish_code, undefined, { numeric: true, sensitivity: 'base' });
      } else if (filters.sortBy === 'position') {
        result = compareNullableNumbers(left.rack_position, right.rack_position);
        if (result === 0) {
          result = left.polish_code.localeCompare(right.polish_code, undefined, { numeric: true, sensitivity: 'base' });
        }
      } else {
        result = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      }

      return filters.sortDirection === 'asc' ? result : result * -1;
    });

  const rackSections = Array.from(
    filtered.reduce((sections, polish) => {
      const key = polish.rack_id ?? 'unassigned';
      const rackObj = polish.rack_id ? racks.find((r) => r.id === polish.rack_id) ?? null : null;
      const label = rackObj?.name ?? t('polishes.unassignedRack');
      const current = sections.get(key);

      if (current) {
        current.polishes.push(polish);
      } else {
        sections.set(key, { label, rackId: polish.rack_id ?? null, maxCapacity: rackObj?.max_capacity ?? null, polishes: [polish] });
      }

      return sections;
    }, new Map<string, { label: string; rackId: string | null; maxCapacity: number | null; polishes: NailPolish[] }>())
      .entries()
  )
    .map(([key, section]) => ({
      key,
      label: section.label,
      rackId: section.rackId,
      maxCapacity: section.maxCapacity,
      polishes: [...section.polishes].sort((left, right) => {
        const byPosition = compareNullableNumbers(left.rack_position, right.rack_position);
        if (byPosition !== 0) return byPosition;
        return left.polish_code.localeCompare(right.polish_code, undefined, { numeric: true, sensitivity: 'base' });
      }),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }));

  function handleLongPress(p: NailPolish) {
    showConfirm({
      title: p.color_name,
      message: `${p.brand}\n\n${t('polishes.delete.message')}`,
      confirmLabel: t('polishes.delete.ok'),
      variant: 'danger',
      onConfirm: () => deletePolish.mutate(p.id, { onSuccess: () => showToast(t('polishes.toast.deleted'), 'info') }),
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ThemedText variant="title">{t('polishes.title')}</ThemedText>
        <ThemedButton label={t('polishes.new')} icon="add" onPress={() => router.push('/polishes/new' as any)} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder={t('polishes.search')}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.inputBackground, borderColor: hasActiveFilters ? colors.primary : colors.border }]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="options-outline" size={18} color={hasActiveFilters ? colors.primary : colors.textSecondary} />
            {hasActiveFilters ? <View style={[styles.filterIndicator, { backgroundColor: colors.primary }]} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.viewSwitcherRow}>
          <PolishViewButton
            label={t('polishes.views.grid')}
            icon="grid-outline"
            active={viewMode === 'grid'}
            onPress={() => setViewMode('grid')}
          />
          <PolishViewButton
            label={t('polishes.views.list')}
            icon="list-outline"
            active={viewMode === 'list'}
            onPress={() => setViewMode('list')}
          />
          <PolishViewButton
            label={t('polishes.views.swatch')}
            icon="color-palette-outline"
            active={viewMode === 'swatch'}
            onPress={() => setViewMode('swatch')}
          />
        </View>

        {viewMode === 'swatch' ? (
          <TouchableOpacity
            style={[styles.allPositionsToggle, { borderColor: showAllPositions ? colors.primary : colors.border, backgroundColor: showAllPositions ? colors.primaryMuted : colors.inputBackground }]}
            onPress={() => setShowAllPositions((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name={showAllPositions ? 'eye' : 'eye-outline'} size={14} color={showAllPositions ? colors.primary : colors.textSecondary} />
            <ThemedText variant="caption" tone={showAllPositions ? 'primary' : 'secondary'} style={styles.allPositionsLabel}>
              {t('polishes.swatch.showAllPositions')}
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : viewMode === 'swatch' ? (
        <ScrollView contentContainerStyle={styles.swatchSectionsContent}>
          {rackSections.length ? (
            rackSections.map((section) => (
              <SwatchSection
                key={section.key}
                rackName={section.label}
                rackId={section.rackId}
                maxCapacity={section.maxCapacity}
                polishes={section.polishes}
                onPress={(polish) => router.push({ pathname: '/polishes/[id]' as any, params: { id: polish.id } })}
                showAllPositions={showAllPositions}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="color-palette-outline" size={48} color={colors.textTertiary} />
              <ThemedText tone="tertiary" style={styles.emptyText}>
                {search || hasActiveFilters ? t('common.noResults') : t('polishes.empty')}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          key={viewMode === 'grid' ? `grid-${gridColumns}` : 'list'}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? gridColumns : 1}
          contentContainerStyle={viewMode === 'grid' ? styles.grid : styles.listContent}
          columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
          renderItem={({ item }) => (
            viewMode === 'grid' ? (
              <PolishCard
                polish={item}
                rackName={item.rack_id ? rackMap.get(item.rack_id) : undefined}
                onPress={() => router.push({ pathname: '/polishes/[id]' as any, params: { id: item.id } })}
                onLongPress={() => handleLongPress(item)}
              />
            ) : (
              <PolishListItem
                polish={item}
                rackName={item.rack_id ? rackMap.get(item.rack_id) : undefined}
                onPress={() => router.push({ pathname: '/polishes/[id]' as any, params: { id: item.id } })}
                onLongPress={() => handleLongPress(item)}
              />
            )
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="color-palette-outline" size={48} color={colors.textTertiary} />
              <ThemedText tone="tertiary" style={styles.emptyText}> 
                {search || hasActiveFilters ? t('common.noResults') : t('polishes.empty')}
              </ThemedText>
            </View>
          }
        />
      )}

      <PolishFiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        brands={brands}
        racks={racks}
        initialState={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchContainer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIndicator: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  viewSwitcherRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  viewButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewButtonLabel: {
    fontWeight: '600',
  },
  allPositionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  allPositionsLabel: {
    fontWeight: '600',
  },
  loader: { marginTop: 60 },
  grid: { padding: 12 },
  listContent: { padding: 12, gap: 10 },
  row: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1, borderRadius: 12, overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardImage: { width: '100%', aspectRatio: 1 },
  cardImagePlaceholder: {
    width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { padding: 8, gap: 2 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  colorName: { fontSize: 13, fontWeight: '700' },
  brandName: { fontSize: 11 },
  locationText: { fontSize: 11 },
  outOfStock: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  listImage: {
    width: 88,
    height: 88,
  },
  listImagePlaceholder: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listMainInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  listTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  listTitleGroup: {
    flex: 1,
    gap: 2,
  },
  listColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swatchSectionsContent: {
    padding: 12,
    gap: 12,
    paddingBottom: 32,
  },
  swatchSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  swatchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchWrapper: {
    alignItems: 'center',
    gap: 5,
    width: 52,
  },
  nail: {
    width: 52,
    height: 78,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nailShine: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 14,
    height: 30,
    borderRadius: 7,
    transform: [{ rotate: '-15deg' }],
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchCode: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    width: 52,
  },
  swatchSectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  moveSlot: {
    borderWidth: 1.5,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  emptySlotNail: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  filtersModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    justifyContent: 'flex-end',
  },
  filtersModalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  filtersContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
  },
  // Modal
  modal: { flex: 1 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, gap: 12, paddingBottom: 28 },
  photoButton: {
    height: 160, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoButtonText: { fontSize: 15 },
  newBrandRow: {
    gap: 10,
  },
  newBrandInput: {
    flex: 1,
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
  colorTriggerInfo: {
    flex: 1,
    gap: 4,
  },
  colorTriggerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  colorModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
});

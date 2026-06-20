import { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { CompactColorPicker } from '@/components/ui/CompactColorPicker';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useError } from '@/context/ErrorContext';
import {
  usePolishLabels,
  labelToKey,
  BUILT_IN_BASE_KEYS,
  BUILT_IN_TONE_KEYS,
  type PolishLabel,
} from '@/context/PolishLabelsContext';

function normalizeHex(value: string) {
  const cleaned = value.replace(/[^#0-9a-fA-F]/g, '').toUpperCase();
  if (!cleaned) return '';
  return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
}

function isValidHex(value: string) {
  return /^#([0-9A-F]{6})$/i.test(value.trim());
}

function AddRow({
  onAdd,
  existingKeys,
  withColor = false,
}: {
  onAdd: (key: string, label: string, hexColor?: string | null) => Promise<void>;
  existingKeys: string[];
  withColor?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showError } = useError();
  const [text, setText] = useState('');
  const [hexColor, setHexColor] = useState('');
  const [showHexInput, setShowHexInput] = useState(false);
  const [saving, setSaving] = useState(false);

  const normalizedHex = normalizeHex(hexColor);
  const validHex = isValidHex(normalizedHex);

  async function handleConfirm() {
    const trimmed = text.trim();
    if (!trimmed) {
      showError(t('polishLabels.empty'));
      return;
    }
    const key = labelToKey(trimmed) || `custom_${Date.now()}`;
    if (existingKeys.includes(key)) {
      showError(t('polishLabels.duplicate'));
      return;
    }
    setSaving(true);
    try {
      await onAdd(key, trimmed, withColor && validHex ? normalizedHex : null);
      setText('');
      setHexColor('');
      setShowHexInput(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <View style={[styles.addRow, { borderTopColor: colors.border }]}>
        {withColor && (
          <TouchableOpacity
            onPress={() => setShowHexInput((v) => !v)}
            style={[
              styles.colorDot,
              {
                backgroundColor: validHex ? normalizedHex : colors.inputBackground,
                borderColor: showHexInput ? colors.primary : colors.border,
                borderStyle: validHex ? 'solid' : 'dashed',
              },
            ]}
            activeOpacity={0.7}
          >
            {!validHex && (
              <Ionicons name="color-palette-outline" size={14} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.addInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder={t('polishLabels.placeholder')}
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleConfirm}
          returnKeyType="done"
          editable={!saving}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.onPrimary} />
            : <>
                <Ionicons name="add" size={20} color={colors.onPrimary} />
                <ThemedText style={[styles.addButtonLabel, { color: colors.onPrimary }]}>
                  {t('polishLabels.add')}
                </ThemedText>
              </>
          }
        </TouchableOpacity>
      </View>
      {withColor && showHexInput && (
        <View style={[styles.colorPickerPanel, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <ThemedText variant="caption" tone="secondary" style={styles.colorPickerLabel}>
            {t('polishLabels.defaultColor')}
          </ThemedText>
          <CompactColorPicker
            value={hexColor}
            onChangeValue={setHexColor}
          />
          <TextInput
            style={[
              styles.hexInput,
              {
                backgroundColor: colors.inputBackground,
                color: validHex ? normalizedHex : colors.text,
                borderColor: validHex ? colors.primary : colors.border,
              },
            ]}
            placeholder="#FF0000"
            placeholderTextColor={colors.textTertiary}
            value={hexColor}
            onChangeText={(v) => setHexColor(normalizeHex(v))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
          />
        </View>
      )}
    </View>
  );
}

function LabelItem({
  entry,
  onDelete,
}: {
  entry: PolishLabel;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const validHex = entry.hex_color && /^#[0-9A-Fa-f]{6}$/.test(entry.hex_color);

  return (
    <View style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={styles.itemLeft}>
        {validHex ? (
          <View style={[styles.colorSwatch, { backgroundColor: entry.hex_color!, borderColor: colors.border }]} />
        ) : null}
        <ThemedText style={styles.itemLabel}>{entry.label}</ThemedText>
        {entry.isBuiltIn ? (
          <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
            <ThemedText variant="caption" tone="primary" style={styles.badgeText}>
              {t('polishLabels.builtIn')}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8} activeOpacity={0.7}>
        <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

function LabelSection({
  title,
  entries,
  onDelete,
  onAdd,
  withColor = false,
}: {
  title: string;
  entries: PolishLabel[];
  onDelete: (id: string) => Promise<void>;
  onAdd: (key: string, label: string, hexColor?: string | null) => Promise<void>;
  withColor?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText variant="caption" tone="tertiary" style={styles.sectionHeader}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {entries.map((entry) => (
          <LabelItem
            key={entry.id}
            entry={entry}
            onDelete={() => onDelete(entry.id)}
          />
        ))}
        <AddRow
          onAdd={onAdd}
          existingKeys={entries.map((e) => e.key)}
          withColor={withColor}
        />
      </View>
    </View>
  );
}

export default function PolishLabelsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showError } = useError();
  const {
    baseColors, toneFamilies, isLoading,
    addBaseColor, removeBaseColor,
    addToneFamily, removeToneFamily,
  } = usePolishLabels();

  async function handleRemoveBaseColor(id: string) {
    if (BUILT_IN_BASE_KEYS.includes(baseColors.find((c) => c.id === id)?.key ?? '')) {
      showError(t('polishLabels.cannotDeleteBuiltIn'));
      return;
    }
    try {
      await removeBaseColor(id);
      showToast(t('common.deleted'), 'info');
    } catch {
      showToast(t('common.error'));
    }
  }

  async function handleRemoveToneFamily(id: string) {
    if (BUILT_IN_TONE_KEYS.includes(toneFamilies.find((c) => c.id === id)?.key ?? '')) {
      showError(t('polishLabels.cannotDeleteBuiltIn'));
      return;
    }
    try {
      await removeToneFamily(id);
      showToast(t('common.deleted'), 'info');
    } catch {
      showToast(t('common.error'));
    }
  }

  async function handleAddBaseColor(key: string, label: string, hexColor?: string | null) {
    try {
      await addBaseColor(key, label, hexColor);
    } catch {
      showToast(t('common.error'));
    }
  }

  async function handleAddToneFamily(key: string, label: string) {
    try {
      await addToneFamily(key, label);
    } catch {
      showToast(t('common.error'));
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingIcon="chevron-back"
        onLeadingPress={() => router.back()}
        title={t('polishLabels.title')}
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <LabelSection
              title={t('polishLabels.baseColors')}
              entries={baseColors}
              onDelete={handleRemoveBaseColor}
              onAdd={handleAddBaseColor}
              withColor
            />
            <LabelSection
              title={t('polishLabels.toneFamilies')}
              entries={toneFamilies}
              onDelete={handleRemoveToneFamily}
              onAdd={handleAddToneFamily}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 60 },
  content: { padding: 20, paddingBottom: 40, gap: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
    marginLeft: 4,
  },
  section: { gap: 0 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  colorPickerPanel: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  colorPickerLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hexInput: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

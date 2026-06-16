import { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedText } from '@/components/ui/ThemedText';
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

function AddRow({
  onAdd,
  existingKeys,
}: {
  onAdd: (key: string, label: string) => Promise<void>;
  existingKeys: string[];
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showError } = useError();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

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
      await onAdd(key, trimmed);
      setText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.addRow, { borderTopColor: colors.border }]}>
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

  return (
    <View style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={styles.itemLeft}>
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
}: {
  title: string;
  entries: PolishLabel[];
  onDelete: (id: string) => Promise<void>;
  onAdd: (key: string, label: string) => Promise<void>;
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

  async function handleAddBaseColor(key: string, label: string) {
    try {
      await addBaseColor(key, label);
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
        onLeadingPress={() => router.navigate('/(tabs)/settings')}
        title={t('polishLabels.title')}
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <LabelSection
            title={t('polishLabels.baseColors')}
            entries={baseColors}
            onDelete={handleRemoveBaseColor}
            onAdd={handleAddBaseColor}
          />
          <LabelSection
            title={t('polishLabels.toneFamilies')}
            entries={toneFamilies}
            onDelete={handleRemoveToneFamily}
            onAdd={handleAddToneFamily}
          />
        </ScrollView>
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
});

import { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { useNailRacks, useCreateNailRack, useUpdateNailRack, useDeleteNailRack } from '@/hooks/useNailRacks';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import type { NailRack } from '@/types/database.types';

function RackRow({
  rack,
  onEdit,
  onDelete,
}: {
  rack: NailRack;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name="albums-outline" size={16} color={colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <ThemedText style={styles.rowName} numberOfLines={1}>{rack.name}</ThemedText>
        {rack.max_capacity ? (
          <ThemedText variant="caption" tone="tertiary">{`${rack.max_capacity} pos.`}</ThemedText>
        ) : null}
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.rowAction} hitSlop={8}>
        <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.rowAction} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

export default function RacksScreen() {
  const router = useRouter();
  const { data: racks, isLoading } = useNailRacks();
  const createRack = useCreateNailRack();
  const updateRack = useUpdateNailRack();
  const deleteRack = useDeleteNailRack();
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCapacity, setEditingCapacity] = useState('');
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  function parseCapacity(s: string) {
    const n = parseInt(s, 10);
    return s.trim() && !isNaN(n) && n > 0 ? n : null;
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    await createRack.mutateAsync({ name: newName, max_capacity: parseCapacity(newCapacity) });
    setNewName('');
    setNewCapacity('');
    showToast(t('racks.toast.created'));
  }

  async function handleUpdate() {
    if (!editingId || !editingName.trim()) return;
    await updateRack.mutateAsync({ id: editingId, name: editingName, max_capacity: parseCapacity(editingCapacity) });
    setEditingId(null);
    setEditingName('');
    setEditingCapacity('');
    showToast(t('racks.toast.updated'));
  }

  function handleDelete(rack: NailRack) {
    showConfirm({
      title: rack.name,
      message: t('racks.delete.message'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      onConfirm: () => deleteRack.mutate(rack.id, { onSuccess: () => showToast(t('racks.toast.deleted'), 'info') }),
    });
  }

  function startEdit(rack: NailRack) {
    setEditingId(rack.id);
    setEditingName(rack.name);
    setEditingCapacity(rack.max_capacity ? String(rack.max_capacity) : '');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingIcon="arrow-back"
        onLeadingPress={() => router.back()}
        title={t('racks.title')}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Add new */}
        <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText variant="sectionTitle">{t('racks.new')}</ThemedText>
          <View style={styles.addFields}>
            <ThemedInput
              placeholder={t('racks.namePlaceholder')}
              value={newName}
              onChangeText={setNewName}
              style={styles.addNameInput}
              returnKeyType="next"
            />
            <ThemedInput
              placeholder={t('racks.capacityPlaceholder')}
              value={newCapacity}
              onChangeText={setNewCapacity}
              keyboardType="number-pad"
              style={styles.addCapInput}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
          </View>
          <ThemedButton
            label={t('common.save')}
            onPress={handleCreate}
            disabled={!newName.trim() || createRack.isPending}
          />
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : racks?.length ? (
          <View style={styles.list}>
            {racks.map((rack) =>
              editingId === rack.id ? (
                <View key={rack.id} style={[styles.editRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.editFields}>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                      value={editingName}
                      onChangeText={setEditingName}
                      autoFocus
                      returnKeyType="next"
                      placeholder={t('racks.namePlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                    />
                    <TextInput
                      style={[styles.editCapInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                      value={editingCapacity}
                      onChangeText={setEditingCapacity}
                      keyboardType="number-pad"
                      onSubmitEditing={handleUpdate}
                      returnKeyType="done"
                      placeholder={t('racks.capacityPlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <ThemedButton label={t('common.save')} onPress={handleUpdate} disabled={updateRack.isPending} />
                  <ThemedButton label={t('common.cancel')} variant="ghost" onPress={() => setEditingId(null)} />
                </View>
              ) : (
                <RackRow
                  key={rack.id}
                  rack={rack}
                  onEdit={() => startEdit(rack)}
                  onDelete={() => handleDelete(rack)}
                />
              )
            )}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={40} color={colors.textTertiary} />
            <ThemedText tone="tertiary">{t('racks.empty')}</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  loader: { marginTop: 40 },
  addCard: {
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  addFields: { flexDirection: 'row', gap: 8 },
  addNameInput: { flex: 1 },
  addCapInput: { width: 90 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500' },
  rowAction: { padding: 4 },
  editRow: {
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  editFields: { flexDirection: 'row', gap: 8 },
  editInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  editCapInput: {
    width: 80,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
});

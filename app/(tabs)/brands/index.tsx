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
import { usePolishBrands, useCreatePolishBrand, useUpdatePolishBrand, useDeletePolishBrand } from '@/hooks/usePolishBrands';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import type { PolishBrand } from '@/types/database.types';

function BrandRow({
  brand,
  onEdit,
  onDelete,
}: {
  brand: PolishBrand;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
      </View>
      <ThemedText style={styles.rowName} numberOfLines={1}>{brand.name}</ThemedText>
      <TouchableOpacity onPress={onEdit} style={styles.rowAction} hitSlop={8}>
        <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.rowAction} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

export default function BrandsScreen() {
  const router = useRouter();
  const { data: brands, isLoading } = usePolishBrands();
  const createBrand = useCreatePolishBrand();
  const updateBrand = useUpdatePolishBrand();
  const deleteBrand = useDeletePolishBrand();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  async function handleCreate() {
    if (!newName.trim()) return;
    await createBrand.mutateAsync(newName);
    setNewName('');
    showToast(t('brands.toast.created'));
  }

  async function handleUpdate() {
    if (!editingId || !editingName.trim()) return;
    await updateBrand.mutateAsync({ id: editingId, name: editingName });
    setEditingId(null);
    setEditingName('');
    showToast(t('brands.toast.updated'));
  }

  function handleDelete(brand: PolishBrand) {
    showConfirm({
      title: brand.name,
      message: t('brands.delete.message'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      onConfirm: () => deleteBrand.mutate(brand.id, { onSuccess: () => showToast(t('brands.toast.deleted'), 'info') }),
    });
  }

  function startEdit(brand: PolishBrand) {
    setEditingId(brand.id);
    setEditingName(brand.name);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingIcon="arrow-back"
        onLeadingPress={() => router.back()}
        title={t('brands.title')}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Add new */}
        <View style={[styles.addRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedInput
            placeholder={t('brands.namePlaceholder')}
            value={newName}
            onChangeText={setNewName}
            style={styles.addInput}
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          <ThemedButton
            label={t('common.save')}
            onPress={handleCreate}
            disabled={!newName.trim() || createBrand.isPending}
          />
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : brands?.length ? (
          <View style={styles.list}>
            {brands.map((brand) =>
              editingId === brand.id ? (
                <View key={brand.id} style={[styles.editRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                    onSubmitEditing={handleUpdate}
                    returnKeyType="done"
                  />
                  <ThemedButton label={t('common.save')} onPress={handleUpdate} disabled={updateBrand.isPending} />
                  <ThemedButton label={t('common.cancel')} variant="ghost" onPress={() => setEditingId(null)} />
                </View>
              ) : (
                <BrandRow
                  key={brand.id}
                  brand={brand}
                  onEdit={() => startEdit(brand)}
                  onDelete={() => handleDelete(brand)}
                />
              )
            )}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={40} color={colors.textTertiary} />
            <ThemedText tone="tertiary">{t('brands.empty')}</ThemedText>
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  addInput: { flex: 1 },
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
  rowName: { flex: 1, fontSize: 15, fontWeight: '500' },
  rowAction: { padding: 4 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  editInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
});

import { useState } from 'react';
import {
  View, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { useClients } from '@/hooks/useClients';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { Client } from '@/types/database.types';

function ClientRow({ client, onPress }: { client: Client; onPress: () => void }) {
  const { colors } = useTheme();
  const initials = client.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.avatar, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
        <ThemedText style={[styles.avatarText, { color: colors.primary }]}>{initials}</ThemedText>
      </View>
      <View style={styles.rowContent}>
        <ThemedText style={styles.clientName}>{client.name}</ThemedText>
        {client.phone ? <ThemedText variant="caption" tone="tertiary" style={styles.clientPhone}>{client.phone}</ThemedText> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function ClientsScreen() {
  const router = useRouter();
  const { data: clients, isLoading } = useClients();
  const [search, setSearch] = useState('');
  const { colors } = useTheme();
  const { t } = useI18n();

  const filtered = clients?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  ) ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ThemedText variant="title">{t('clients.title')}</ThemedText>
        <ThemedButton
          label={t('clients.new')}
          icon="add"
          onPress={() => router.push('/clients/new')}
        />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder={t('clients.search')}
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientRow
              client={item}
              onPress={() => router.push(`/(tabs)/clients/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <ThemedText tone="tertiary" style={styles.emptyText}> 
                {search ? t('common.noResults') : t('clients.empty')}
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  loader: {
    marginTop: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  clientPhone: {
    fontSize: 13,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});

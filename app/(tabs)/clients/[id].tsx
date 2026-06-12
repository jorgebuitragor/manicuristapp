import { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, Image, Linking,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useConfirm } from '@/context/ConfirmContext';
import { useAppointmentsByClient } from '@/hooks/useAppointments';
import { useTimeFormat } from '@/context/TimeFormatContext';
import type { AppointmentWithRelations } from '@/types/database.types';

function formatDateTime(iso: string, is24Hour: boolean) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: !is24Hour,
  });
}

function HistoryCard({ apt, onPress }: { apt: AppointmentWithRelations; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { is24Hour } = useTimeFormat();

  const statusBg: Record<string, string> = {
    pending: colors.statusPending,
    completed: colors.statusCompleted,
    cancelled: colors.statusCancelled,
  };

  const statusText: Record<string, string> = {
    pending: colors.statusPendingText,
    completed: colors.statusCompletedText,
    cancelled: colors.statusCancelledText,
  };

  return (
    <TouchableOpacity
      style={[styles.historyCard, { borderTopColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {apt.design_photo_url ? (
        <Image source={{ uri: apt.design_photo_url }} style={[styles.historyThumb, { borderColor: colors.border }]} />
      ) : (
        <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
      )}
      <View style={styles.historyContent}>
        <ThemedText variant="caption" style={styles.historyDate}>{formatDateTime(apt.start_time, is24Hour)}</ThemedText>
        {apt.services.length > 0 ? <ThemedText variant="caption" tone="primary">{apt.services.map((service) => service.name).join(' · ')}</ThemedText> : null}
      </View>
      <ThemedView style={[styles.historyBadge, { backgroundColor: statusBg[apt.status] ?? colors.border }]}>
        <ThemedText variant="caption" style={{ color: statusText[apt.status] ?? colors.textSecondary, fontWeight: '700' }}>
          {t(`status.${apt.status}`)}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

function ClientField({
  label,
  value,
  editing,
  multiline = false,
  keyboardType,
  onChangeText,
}: {
  label: string;
  value: string;
  editing: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  onChangeText?: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <ThemedText variant="caption" tone="tertiary" style={styles.fieldLabel}>{label}</ThemedText>
      {editing ? (
        <ThemedInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          style={multiline ? styles.fieldInputMultiline : undefined}
        />
      ) : (
        <ThemedText>{value || '—'}</ThemedText>
      )}
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading } = useClient(id);
  const { data: appointments, isError: appointmentsError } = useAppointmentsByClient(id);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showConfirm } = useConfirm();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');

  useEffect(() => {
    if (client) {
      setName(client.name);
      setPhone(client.phone ?? '');
      setNotes(client.notes ?? '');
      setAllergies(client.allergies ?? '');
    }
  }, [client]);

  async function handleSave() {
    if (!name.trim()) return;
    await updateClient.mutateAsync({
      id,
      name: name.trim(),
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      allergies: allergies.trim() || null,
    });
    setEditing(false);
  }

  function handleDelete() {
    showConfirm({
      title: t('client.delete.title'),
      message: t('client.delete.message').replace('{name}', client?.name ?? ''),
      confirmLabel: t('client.delete.ok'),
      variant: 'danger',
      onConfirm: async () => {
        await deleteClient.mutateAsync(id);
        router.back();
      },
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ThemedText tone="tertiary" style={styles.errorText}>{t('client.notFound')}</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingLabel={t('common.back')}
        onLeadingPress={() => router.back()}
        title={client.name}
        trailingLabel={editing ? t('common.save') : t('client.edit')}
        onTrailingPress={() => (editing ? handleSave() : setEditing(true))}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedSection>
            <ThemedText variant="sectionTitle">{t('client.detailsSection')}</ThemedText>
            <ClientField label={t('client.name')} value={name} editing={editing} onChangeText={setName} />
            {editing ? (
              <ClientField label={t('client.phone')} value={phone} editing={true} keyboardType="phone-pad" onChangeText={setPhone} />
            ) : (
              <View style={styles.field}>
                <ThemedText variant="caption" tone="tertiary" style={styles.fieldLabel}>{t('client.phone')}</ThemedText>
                <View style={styles.phoneRow}>
                  <ThemedText>{phone || '—'}</ThemedText>
                  {phone ? (
                    <View style={styles.phoneActions}>
                      <TouchableOpacity
                        onPress={() => Clipboard.setStringAsync(phone)}
                        hitSlop={8}
                      >
                        <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const digits = phone.replace(/\D/g, '');
                          Linking.openURL(`https://wa.me/${digits}`);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
            <ClientField label={t('client.allergies')} value={allergies} editing={editing} multiline onChangeText={setAllergies} />
            <ClientField label={t('client.notes')} value={notes} editing={editing} multiline onChangeText={setNotes} />
          </ThemedSection>

          <ThemedSection>
            <View style={styles.sectionHeaderRow}>
              <ThemedText variant="sectionTitle">{t('client.appointments')}</ThemedText>
              <ThemedButton
                label={t('client.addAppointment')}
                variant="outline"
                icon="add"
                onPress={() => router.push({ pathname: '/appointments/new', params: { client_id: id } })}
              />
            </View>

            {appointmentsError ? (
              <ThemedText tone="danger" style={styles.noHistory}>Error al cargar citas. Revisa la consola.</ThemedText>
            ) : appointments && appointments.length > 0 ? (
              appointments.map((apt) => (
                <HistoryCard
                  key={apt.id}
                  apt={apt}
                  onPress={() => router.push(`/appointments/${apt.id}`)}
                />
              ))
            ) : (
              <ThemedText tone="tertiary" style={styles.noHistory}>{t('client.noAppointments')}</ThemedText>
            )}
          </ThemedSection>

          {!editing ? (
            <ThemedButton
              label={t('client.delete.ok')}
              variant="dangerOutline"
              onPress={handleDelete}
              style={styles.deleteButton}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 60 },
  errorText: { textAlign: 'center', marginTop: 60, fontSize: 16 },
  content: { padding: 16, gap: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  field: { gap: 4 },
  fieldLabel: { textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyThumb: { width: 40, height: 40, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  historyContent: { flex: 1, gap: 2 },
  historyDate: { fontWeight: '600' },
  historyBadge: { minHeight: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  noHistory: { textAlign: 'center', paddingVertical: 12 },
  deleteButton: { marginTop: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});

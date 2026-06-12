import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAppointmentsByDate } from '@/hooks/useAppointments';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import type { AppointmentWithRelations } from '@/types/database.types';

function formatTime(iso: string, is24Hour: boolean) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
}

function getTodayString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function AppointmentCard({ appointment, onPress }: { appointment: AppointmentWithRelations; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { is24Hour } = useTimeFormat();

  const statusBg: Record<string, string> = {
    pending: colors.statusPending,
    completed: colors.statusCompleted,
    cancelled: colors.statusCancelled,
  };
  const statusTextColor: Record<string, string> = {
    pending: colors.statusPendingText,
    completed: colors.statusCompletedText,
    cancelled: colors.statusCancelledText,
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardAccent, { backgroundColor: colors.primary }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.clientName}>{appointment.client?.name ?? '—'}</ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: statusBg[appointment.status] ?? colors.border }]}>
            <ThemedText variant="caption" style={[styles.statusText, { color: statusTextColor[appointment.status] ?? colors.textSecondary }]}> 
              {t(`status.${appointment.status}`)}
            </ThemedText>
          </View>
        </View>
        <ThemedText tone="secondary" style={styles.timeText}>
          {formatTime(appointment.start_time, is24Hour)} – {formatTime(appointment.end_time, is24Hour)}
        </ThemedText>
        <View style={styles.cardFooter}>
          {appointment.services.length > 0 ? (
            <ThemedText tone="primary" style={styles.serviceText}>{appointment.services.map((service) => service.name).join(' · ')}</ThemedText>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const today = getTodayString();
  const { data: appointments, isLoading, isError, error, refetch } = useAppointmentsByDate(today);
  const { colors } = useTheme();
  const { t } = useI18n();

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <ThemedText variant="label" tone="tertiary" style={styles.dateLabel}>{todayFormatted}</ThemedText>
          <ThemedText variant="title">{t('home.title')}</ThemedText>
        </View>
        <ThemedButton
          label={t('home.newAppointment')}
          icon="add"
          onPress={() => router.push('/appointments/new')}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : isError ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.danger} />
          <ThemedText tone="danger" style={styles.emptyText}>Error al cargar citas</ThemedText>
          <ThemedText variant="caption" tone="tertiary" style={{ textAlign: 'center', paddingHorizontal: 32 }}>
            {(error as Error)?.message ?? 'Error desconocido'}
          </ThemedText>
          <ThemedButton label="Reintentar" variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
        >
          {appointments && appointments.length > 0 ? (
            appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onPress={() => router.push(`/appointments/${apt.id}`)}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="flower-outline" size={48} color={colors.textTertiary} />
              <ThemedText tone="tertiary" style={styles.emptyText}>{t('home.empty')}</ThemedText>
            </View>
          )}
        </ScrollView>
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
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateLabel: {
    fontSize: 13,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  loader: {
    marginTop: 60,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '500',
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

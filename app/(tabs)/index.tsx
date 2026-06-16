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
import { useCurrency } from '@/context/CurrencyContext';
import type { AppointmentWithRelations } from '@/types/database.types';

function formatTime(iso: string, is24Hour: boolean) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
}

function getTodayString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getNextAppointment(appointments: AppointmentWithRelations[]): AppointmentWithRelations | null {
  const now = new Date();
  return appointments.find((a) => a.status !== 'cancelled' && new Date(a.end_time) > now) ?? null;
}

// ─── Summary bar ────────────────────────────────────────────────────────────

function SummaryBar({ appointments }: { appointments: AppointmentWithRelations[] }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { formatAmount } = useCurrency();

  const total = appointments.filter((a) => a.status !== 'cancelled').length;
  const pending = appointments.filter((a) => a.status === 'pending').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const earnings = appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.services.reduce((s, sv) => s + (sv.price ?? 0), 0), 0);

  const stats = [
    { label: t('home.summary.total'), value: String(total), icon: 'calendar-outline' as const },
    { label: t('home.summary.pending'), value: String(pending), icon: 'time-outline' as const },
    { label: t('home.summary.completed'), value: String(completed), icon: 'checkmark-circle-outline' as const },
    { label: t('home.summary.earnings'), value: formatAmount(earnings), icon: 'cash-outline' as const },
  ];

  return (
    <View style={[styles.summaryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {stats.map((stat, i) => (
        <View
          key={stat.label}
          style={[
            styles.summaryItem,
            i < stats.length - 1 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
          ]}
        >
          <Ionicons name={stat.icon} size={16} color={colors.primary} style={{ marginBottom: 4 }} />
          <ThemedText style={styles.summaryValue}>{stat.value}</ThemedText>
          <ThemedText variant="caption" tone="tertiary" style={styles.summaryLabel}>{stat.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

// ─── Next appointment card ───────────────────────────────────────────────────

function NextAppointmentCard({
  next,
  onPress,
}: {
  next: AppointmentWithRelations | null;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { is24Hour } = useTimeFormat();

  if (!next) {
    return (
      <View style={[styles.nextCard, styles.nextCardEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="moon-outline" size={20} color={colors.textTertiary} />
        <ThemedText tone="tertiary" style={styles.nextNoneText}>{t('home.nextNone')}</ThemedText>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.nextCard, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.nextCardTop}>
        <View style={styles.nextCardTitleRow}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <ThemedText variant="caption" tone="primary" style={styles.nextLabel}>{t('home.next')}</ThemedText>
        </View>
        <ThemedText variant="caption" tone="primary" style={styles.nextTime}>
          {formatTime(next.start_time, is24Hour)} – {formatTime(next.end_time, is24Hour)}
        </ThemedText>
      </View>
      <ThemedText style={[styles.nextClientName, { color: colors.primary }]}>{next.client?.name ?? '—'}</ThemedText>
      {next.services.length > 0 && (
        <ThemedText tone="secondary" style={styles.nextServices}>
          {next.services.map((s) => s.name).join(' · ')}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

// ─── Appointment card ────────────────────────────────────────────────────────

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
          {appointment.services.length > 0 && (
            <ThemedText tone="primary" style={styles.serviceText}>{appointment.services.map((s) => s.name).join(' · ')}</ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Quick actions (empty state) ─────────────────────────────────────────────

function QuickActions() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();

  const actions = [
    { icon: 'add-circle-outline' as const, label: t('home.newAppointmentShort'), route: '/appointments/new' },
    { icon: 'person-add-outline' as const, label: t('home.quickNewClient'), route: '/clients/new' },
    { icon: 'calendar-outline' as const, label: t('home.quickCalendar'), route: '/(tabs)/calendar' },
  ];

  return (
    <View style={styles.quickActions}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={[styles.quickItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.75}
        >
          <Ionicons name={action.icon} size={24} color={colors.primary} />
          <ThemedText variant="caption" tone="secondary" style={styles.quickLabel}>{action.label}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const today = getTodayString();
  const { data: appointments, isLoading, isError, error, refetch } = useAppointmentsByDate(today);
  const { colors } = useTheme();
  const { t } = useI18n();

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const next = appointments ? getNextAppointment(appointments) : null;

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
            <>
              <SummaryBar appointments={appointments} />
              <NextAppointmentCard
                next={next}
                onPress={() => next && router.push(`/appointments/${next.id}`)}
              />
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onPress={() => router.push(`/appointments/${apt.id}`)}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flower-outline" size={48} color={colors.textTertiary} />
              <ThemedText tone="tertiary" style={styles.emptyText}>{t('home.empty')}</ThemedText>
              <QuickActions />
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
  loader: {
    marginTop: 60,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
  },
  // Next appointment
  nextCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  nextCardEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  nextCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nextCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  nextTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  nextClientName: {
    fontSize: 17,
    fontWeight: '700',
  },
  nextServices: {
    fontSize: 13,
  },
  nextNoneText: {
    fontSize: 14,
  },
  // Appointment cards
  card: {
    marginHorizontal: 16,
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
  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

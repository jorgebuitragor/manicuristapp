import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Linking,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { ThemedDropdown } from '@/components/ui/ThemedDropdown';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { PhotoPickerField } from '@/components/ui/PhotoPickerField';
import { IncomeConfirmModal } from '@/components/ui/IncomeConfirmModal';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useError } from '@/context/ErrorContext';
import { useOrganization } from '@/context/OrganizationContext';
import {
  useAppointment,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
  useRescheduleAppointment,
  useAddPolishToAppointment,
  useRemovePolishFromAppointment,
  useAddServiceToAppointment,
  useRemoveServiceFromAppointment,
  findConflictingAppointments,
} from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { syncAppointmentToCalendar, deleteAppointmentFromCalendar } from '@/hooks/useGoogleCalendar';
import { useNotificationSettings } from '@/context/NotificationContext';
import { scheduleAppointmentReminder, cancelAppointmentReminder } from '@/lib/notifications';
import { usePolishes } from '@/hooks/usePolishes';
import {
  canTransitionTo,
  canReschedule,
  type AppointmentStatus,
} from '@/lib/appointmentStateMachine';
import { useCreateIncome, useUpdateIncome, useIncomeByAppointment } from '@/hooks/useIncomes';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';
import { DatePickerField, TimePickerField } from '@/components/ui/AppDatePicker';
import { useTimeFormat } from '@/context/TimeFormatContext';

function formatDateTime(iso: string, is24Hour: boolean) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', hour12: !is24Hour,
  });
}

function formatTime(iso: string, is24Hour: boolean) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
}

function formatTimeLocal(d: Date, is24Hour: boolean) {
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
}

const STATUS_ICON: Record<AppointmentStatus, React.ComponentProps<typeof Ionicons>['name']> = {
  pending: 'time-outline',
  completed: 'checkmark-circle',
  cancelled: 'close-circle',
};

const STATUS_ICON_COLOR: Record<AppointmentStatus, keyof ReturnType<typeof useTheme>['colors']> = {
  pending: 'statusPendingText',
  completed: 'statusCompletedText',
  cancelled: 'statusCancelledText',
};

function AppointmentStatusOption({
  status,
  selected,
  disabled,
  onPress,
}: {
  status: AppointmentStatus;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={[
        styles.statusOption,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryMuted : colors.inputBackground,
          opacity: disabled && !selected ? 0.35 : 1,
        },
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Ionicons
        name={STATUS_ICON[status]}
        size={15}
        color={colors[STATUS_ICON_COLOR[status]]}
      />
      <ThemedText variant="caption" style={styles.statusOptionText} tone={selected ? 'primary' : 'default'}>
        {t(`status.${status}`)}
      </ThemedText>
    </TouchableOpacity>
  );
}


export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const { data: appointment, isLoading, refetch } = useAppointment(id);
  const createIncome = useCreateIncome();
  const { data: existingIncome } = useIncomeByAppointment(id);
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const reschedule = useRescheduleAppointment();
  const addPolish = useAddPolishToAppointment();
  const removePolish = useRemovePolishFromAppointment();
  const addService = useAddServiceToAppointment();
  const removeService = useRemoveServiceFromAppointment();
  const { data: allPolishes = [] } = usePolishes();
  const { data: allServices = [] } = useServices();
  const [polishPickerValue, setPolishPickerValue] = useState('');
  const [servicePickerValue, setServicePickerValue] = useState('');
  const { colors } = useTheme();
  const { t } = useI18n();
  const { is24Hour } = useTimeFormat();
  const { showToast } = useToast();
  const { showError } = useError();
  const { showConfirm } = useConfirm();
  const { reminderEnabled, reminderMinutes } = useNotificationSettings();
  const { organizationId } = useOrganization();

  const updateIncome = useUpdateIncome();
  const { symbol, formatAmount, parseAmountInput } = useCurrency();

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState<Date | null>(null);
  const [rescheduleEnd, setRescheduleEnd] = useState<Date | null>(null);


  const [incomeEditOpen, setIncomeEditOpen] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeNotes, setIncomeNotes] = useState('');

  function openIncomeEdit() {
    setIncomeAmount(existingIncome ? String(existingIncome.amount) : '');
    setIncomeNotes(existingIncome?.notes ?? '');
    setIncomeEditOpen(true);
  }

  function cancelIncomeEdit() {
    setIncomeEditOpen(false);
  }

  async function handleIncomeSave() {
    const parsed = parseAmountInput(incomeAmount);
    if (isNaN(parsed) || parsed <= 0) return;
    if (existingIncome) {
      await updateIncome.mutateAsync({ id: existingIncome.id, amount: parsed, notes: incomeNotes.trim() || null });
      showToast(t('appointment.toast.incomeUpdated'));
    } else {
      await createIncome.mutateAsync({ appointment_id: id, amount: parsed, notes: incomeNotes.trim() || null });
      showToast(t('appointment.toast.incomeRegistered'));
    }
    setIncomeEditOpen(false);
  }

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

  const suggestedAmount = (appointment?.services ?? []).reduce(
    (sum, s) => sum + (s.price ?? 0), 0
  );

  function openReschedule() {
    if (!appointment) return;
    setRescheduleStart(new Date(appointment.start_time));
    setRescheduleEnd(new Date(appointment.end_time));
    setRescheduleOpen(true);
  }

  function cancelReschedule() {
    setRescheduleOpen(false);
  }

  async function handleReschedule() {
    if (!rescheduleStart || !rescheduleEnd) return;
    if (rescheduleEnd <= rescheduleStart) {
      showError(t('appointment.error.timeConflict'));
      return;
    }
    const conflicts = await findConflictingAppointments(
      rescheduleStart.toISOString(),
      rescheduleEnd.toISOString(),
      organizationId!,
      id
    );
    if (conflicts.length > 0) {
      const names = conflicts.map((c) => c.client?.name ?? '?').join(', ');
      const time = `${formatTimeLocal(new Date(conflicts[0].start_time), is24Hour)} – ${formatTimeLocal(new Date(conflicts[0].end_time), is24Hour)}`;
      showError(t('appointment.error.conflict.title'), t('appointment.error.conflict.message').replace('{client}', names).replace('{time}', time));
      return;
    }
    await reschedule.mutateAsync({
      id,
      start_time: rescheduleStart.toISOString(),
      end_time: rescheduleEnd.toISOString(),
    });

    // Reschedule appointment reminder
    if (appointment && reminderEnabled) {
      cancelAppointmentReminder(id);
      scheduleAppointmentReminder(
        id,
        rescheduleStart.toISOString(),
        appointment.client?.name ?? '',
        appointment.services.map((s) => s.name),
        reminderMinutes,
      );
    }

    // Fire-and-forget Google Calendar sync
    if (appointment) {
      syncAppointmentToCalendar({
        appointmentId: id,
        clientName: appointment.client?.name ?? '',
        serviceNames: appointment.services.map((s) => s.name),
        startTime: rescheduleStart.toISOString(),
        endTime: rescheduleEnd.toISOString(),
        notes: appointment.notes,
        googleEventId: appointment.google_event_id,
      });
    }

    showToast(t('appointment.toast.rescheduled'));
    setRescheduleOpen(false);
  }

  function handleStatusChange(status: AppointmentStatus) {
    if (!appointment) return;
    const { allowed, reason } = canTransitionTo(appointment.status, status, appointment.start_time);
    if (!allowed) {
      const msg = reason === 'futureAppointment'
        ? t('appointment.error.futureAppointment')
        : t('appointment.error.invalidTransition');
      showError(msg);
      return;
    }
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          showToast(t('appointment.toast.statusUpdated'));
          if (status === 'completed' && !existingIncome) {
            setIncomeModalVisible(true);
          }
        },
      }
    );
  }

  async function handleIncomeConfirm(amount: number, notes: string) {
    await createIncome.mutateAsync({
      appointment_id: id,
      amount,
      notes: notes || null,
    });
    setIncomeModalVisible(false);
    showToast(t('appointment.toast.incomeRegistered'));
  }

  async function handlePhotoUploaded(url: string) {
    await supabase.from('appointments').update({ design_photo_url: url }).eq('id', id);
    refetch();
    showToast(t('appointment.toast.photoUploaded'));
  }

  async function handlePhotoRemoved() {
    await supabase.from('appointments').update({ design_photo_url: null }).eq('id', id);
    refetch();
  }

  async function handleWhatsApp() {
    if (!appointment) return;
    const phone = appointment.client?.phone;
    if (!phone) {
      showError(t('appointment.whatsapp.noPhone'));
      return;
    }
    const dateStr = formatDateTime(appointment.start_time, is24Hour);
    const endStr = formatTime(appointment.end_time, is24Hour);
    const message = t('appointment.whatsapp.message')
      .replace('{name}', appointment.client?.name ?? '')
      .replace('{date}', dateStr)
      .replace('{end}', endStr);
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      showError(t('appointment.whatsapp.notInstalled'));
    }
  }

  async function handleShare() {
    if (!appointment) return;
    const dateStr = formatDateTime(appointment.start_time, is24Hour);
    const endStr = formatTime(appointment.end_time, is24Hour);
    const servicesStr = appointment.services.length > 0
      ? appointment.services.map((s) => s.name).join(', ')
      : '—';
    const polishesStr = (appointment.polishes ?? []).length > 0
      ? (appointment.polishes ?? []).map((p) => p.color_name).join(', ')
      : null;
    const lines = [
      `📅 ${dateStr} – ${endStr}`,
      `👤 ${appointment.client?.name}`,
      `✂️ ${servicesStr}`,
      polishesStr ? `💅 ${polishesStr}` : null,
      appointment.notes ? `📝 ${appointment.notes}` : null,
    ].filter(Boolean).join('\n');
    await Share.share({ message: lines });
  }

  function handleDelete() {
    showConfirm({
      title: t('appointment.delete.title'),
      message: t('appointment.delete.message'),
      confirmLabel: t('appointment.delete.ok'),
      variant: 'danger',
      onConfirm: async () => {
        const googleEventId = appointment?.google_event_id;
        cancelAppointmentReminder(id);
        await deleteAppointment.mutateAsync(id);
        if (googleEventId) deleteAppointmentFromCalendar(googleEventId);
        showToast(t('appointment.toast.deleted'));
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

  if (!appointment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ThemedText tone="tertiary" style={styles.errorText}>{t('appointment.notFound')}</ThemedText>
      </SafeAreaView>
    );
  }

  const start = rescheduleStart ?? new Date(appointment.start_time);
  const end = rescheduleEnd ?? new Date(appointment.end_time);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingLabel={t('common.back')}
        onLeadingPress={() => router.back()}
        title={t('appointment.detail.title')}
        trailingLabel={t('common.delete')}
        onTrailingPress={handleDelete}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedSection>
          <View style={styles.sectionRow}>
            <View style={[styles.accent, { backgroundColor: colors.primary }]} />
            <View style={styles.infoBody}>
              <ThemedText variant="subtitle">{appointment.client?.name}</ThemedText>
              <ThemedText tone="secondary" style={styles.timeText}>
                {formatDateTime(appointment.start_time, is24Hour)} - {formatTime(appointment.end_time, is24Hour)}
              </ThemedText>
              {appointment.services.length > 0 ? (
                <ThemedText tone="primary" style={styles.serviceText}>{appointment.services.map((service) => service.name).join(' · ')}</ThemedText>
              ) : null}
            </View>
            <View style={styles.cardTrailing}>
              <ThemedView style={[styles.statusBadge, { backgroundColor: statusBg[appointment.status] }]}>
                <ThemedText variant="caption" style={{ color: statusText[appointment.status], fontWeight: '600' }}>
                  {t(`status.${appointment.status}`)}
                </ThemedText>
              </ThemedView>
              <View style={styles.cardActions}>
                {appointment.client?.phone ? (
                  <TouchableOpacity onPress={handleWhatsApp} hitSlop={8}>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleShare} hitSlop={8}>
                  <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {appointment.notes ? (
            <ThemedText tone="secondary" style={[styles.notes, { borderTopColor: colors.border }]}>{appointment.notes}</ThemedText>
          ) : null}
        </ThemedSection>

        {/* Reschedule — only available for pending appointments */}
        <ThemedSection>
          <TouchableOpacity
            style={styles.rescheduleHeader}
            onPress={
              !canReschedule(appointment.status)
                ? () => showError(t('appointment.reschedule.notPending'))
                : rescheduleOpen ? cancelReschedule : openReschedule
            }
            activeOpacity={0.7}
          >
            <View style={styles.rescheduleHeaderLeft}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={canReschedule(appointment.status) ? colors.primary : colors.textTertiary}
              />
              <ThemedText
                variant="sectionTitle"
                tone={canReschedule(appointment.status) ? 'default' : 'tertiary'}
              >
                {t('appointment.reschedule.title')}
              </ThemedText>
            </View>
            <Ionicons
              name={canReschedule(appointment.status) ? (rescheduleOpen ? 'chevron-up' : 'chevron-down') : 'lock-closed-outline'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {rescheduleOpen ? (
            <>
              <DatePickerField
                label={t('appointment.date')}
                value={start}
                onChange={(d) => {
                  const newStart = new Date(start);
                  newStart.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                  const newEnd = new Date(end);
                  newEnd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                  setRescheduleStart(newStart);
                  setRescheduleEnd(newEnd);
                }}
              />
              <TimePickerField
                label={t('appointment.startTime')}
                value={start}
                minuteInterval={5}
                onChange={(d) => {
                  const prevDuration = end.getTime() - start.getTime();
                  setRescheduleStart(d);
                  setRescheduleEnd(new Date(d.getTime() + Math.max(prevDuration, 30 * 60 * 1000)));
                }}
              />
              <TimePickerField
                label={t('appointment.endTime')}
                value={end}
                minuteInterval={5}
                onChange={setRescheduleEnd}
              />

              <View style={styles.rescheduleActions}>
                <ThemedButton
                  label={t('common.cancel')}
                  variant="outline"
                  onPress={cancelReschedule}
                  style={styles.rescheduleActionBtn}
                />
                <ThemedButton
                  label={t('appointment.reschedule.save')}
                  variant="primary"
                  onPress={handleReschedule}
                  disabled={reschedule.isPending}
                  style={styles.rescheduleActionBtn}
                />
              </View>
            </>
          ) : null}
        </ThemedSection>

        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('appointment.statusTitle')}</ThemedText>
          <View style={styles.statusRow}>
            {(['pending', 'completed', 'cancelled'] as const).map((status) => (
              <AppointmentStatusOption
                key={status}
                status={status}
                selected={appointment.status === status}
                disabled={!canTransitionTo(appointment.status, status, appointment.start_time).allowed}
                onPress={() => handleStatusChange(status)}
              />
            ))}
          </View>
        </ThemedSection>

        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('appointment.services')}</ThemedText>
          <ThemedDropdown
            label=""
            value={servicePickerValue}
            options={allServices
              .filter((s) => !appointment.services.some((as) => as.id === s.id))
              .map((s) => ({ value: s.id, label: s.name }))}
            onChange={(sid: string) => {
              setServicePickerValue(sid);
              addService.mutate({ appointment_id: id, service_id: sid });
            }}
            placeholder={t('appointment.services.add')}
          />
          {appointment.services.length > 0 ? (
            <View style={styles.polishPillsRow}>
              {appointment.services.map((s) => {
                const remaining = appointment.services.find((x) => x.id !== s.id)?.id ?? null;
                return (
                  <View key={s.id} style={[styles.polishPill, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                    <Ionicons name="hand-left-outline" size={12} color={colors.primary} />
                    <ThemedText variant="caption" style={styles.polishPillText} numberOfLines={1}>{s.name}</ThemedText>
                    <TouchableOpacity
                      onPress={() => removeService.mutate({ appointment_id: id, service_id: s.id, remaining_service_id: remaining })}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <ThemedText tone="tertiary" style={styles.photoLockedHint}>{t('appointment.services.empty')}</ThemedText>
          )}
        </ThemedSection>

        <ThemedSection>
          <ThemedText variant="sectionTitle">{t('appointment.usedPolishes')}</ThemedText>
          <ThemedDropdown
            label=""
            value={polishPickerValue}
            options={allPolishes
              .filter((p) => !(appointment.polishes ?? []).some((ap) => ap.id === p.id))
              .map((p) => ({ value: p.id, label: `${p.brand} · ${p.color_name}` }))}
            onChange={(polishId: string) => {
              setPolishPickerValue(polishId);
              addPolish.mutate({ appointment_id: id, nail_polish_id: polishId });
            }}
            placeholder={t('appointment.polishes.add')}
          />
          {(appointment.polishes ?? []).length > 0 ? (
            <View style={styles.polishPillsRow}>
              {(appointment.polishes ?? []).map((p) => (
                <View key={p.id} style={[styles.polishPill, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                  {p.hex_color ? <View style={[styles.polishDot, { backgroundColor: p.hex_color }]} /> : null}
                  <ThemedText variant="caption" style={styles.polishPillText} numberOfLines={1}>{p.color_name}</ThemedText>
                  <TouchableOpacity
                    onPress={() => removePolish.mutate({ appointment_id: id, nail_polish_id: p.id })}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText tone="tertiary" style={styles.photoLockedHint}>{t('appointment.polishes.empty')}</ThemedText>
          )}
        </ThemedSection>

        {appointment.status === 'completed' && (
          <ThemedSection>
            <TouchableOpacity
              style={styles.rescheduleHeader}
              onPress={incomeEditOpen ? cancelIncomeEdit : openIncomeEdit}
              activeOpacity={0.7}
            >
              <View style={styles.rescheduleHeaderLeft}>
                <Ionicons name="cash-outline" size={18} color={colors.primary} />
                <ThemedText variant="sectionTitle">{t('appointment.income.title')}</ThemedText>
              </View>
              <View style={styles.incomeHeaderRight}>
                {existingIncome && !incomeEditOpen && (
                  <ThemedText tone="primary" style={styles.incomeAmount}>
                    {formatAmount(existingIncome.amount)}
                  </ThemedText>
                )}
                <Ionicons
                  name={incomeEditOpen ? 'chevron-up' : (existingIncome ? 'pencil-outline' : 'add-circle-outline')}
                  size={18}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            {!incomeEditOpen && existingIncome?.notes ? (
              <ThemedText tone="secondary" style={[styles.notes, { borderTopColor: colors.border }]}>
                {existingIncome.notes}
              </ThemedText>
            ) : null}

            {!incomeEditOpen && !existingIncome ? (
              <ThemedText tone="tertiary" style={styles.photoLockedHint}>
                {t('appointment.income.notRegistered')}
              </ThemedText>
            ) : null}

            {incomeEditOpen && (
              <>
                <ThemedInput
                  placeholder={`${t('incomes.confirm.amount')} (${symbol})`}
                  value={incomeAmount}
                  onChangeText={setIncomeAmount}
                  keyboardType="decimal-pad"
                  style={styles.incomeInput}
                />
                <ThemedInput
                  placeholder={t('incomes.confirm.notes')}
                  value={incomeNotes}
                  onChangeText={setIncomeNotes}
                  style={styles.incomeInput}
                />
                <View style={styles.rescheduleActions}>
                  <ThemedButton
                    label={t('common.cancel')}
                    variant="outline"
                    onPress={cancelIncomeEdit}
                    style={styles.rescheduleActionBtn}
                  />
                  <ThemedButton
                    label={t('common.save')}
                    variant="primary"
                    onPress={handleIncomeSave}
                    disabled={updateIncome.isPending || createIncome.isPending}
                    style={styles.rescheduleActionBtn}
                  />
                </View>
              </>
            )}
          </ThemedSection>
        )}

        {appointment.status === 'completed' && (
          <ThemedSection>
            <ThemedText variant="sectionTitle">{t('appointment.designPhoto')}</ThemedText>
            <PhotoPickerField
              bucket="design-photos"
              storagePath={`designs/${id}`}
              currentUrl={appointment.design_photo_url}
              onUploadComplete={handlePhotoUploaded}
              onRemove={appointment.design_photo_url ? handlePhotoRemoved : undefined}
              label={t('appointment.uploadPhoto')}
              resizeWidth={1080}
              quality={0.8}
            />
          </ThemedSection>
        )}
      </ScrollView>

      <IncomeConfirmModal
        visible={incomeModalVisible}
        suggestedAmount={suggestedAmount}
        onConfirm={handleIncomeConfirm}
        onSkip={() => setIncomeModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 60 },
  errorText: { textAlign: 'center', marginTop: 60, fontSize: 16 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoBody: { flex: 1 },
  accent: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  timeText: { marginTop: 2 },
  serviceText: { marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  notes: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rescheduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rescheduleActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  rescheduleActionBtn: { flex: 1 },
  statusRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { fontWeight: '600' },
  photoLockedHint: { fontSize: 13, marginTop: 4 },
  incomeHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  incomeAmount: { fontSize: 15, fontWeight: '600' },
  incomeInput: { marginTop: 8 },
  polishPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  polishPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
  },
  polishDot: { width: 12, height: 12, borderRadius: 6 },
  polishPillText: { maxWidth: 140 },
  cardTrailing: { alignItems: 'flex-end', gap: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useError } from '@/context/ErrorContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useCreateAppointment, useAddPolishToAppointment, findConflictingAppointments } from '@/hooks/useAppointments';
import { syncAppointmentToCalendar } from '@/hooks/useGoogleCalendar';
import { useNotificationSettings } from '@/context/NotificationContext';
import { scheduleAppointmentReminder } from '@/lib/notifications';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { usePolishes } from '@/hooks/usePolishes';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedDropdown } from '@/components/ui/ThemedDropdown';
import { ThemedField } from '@/components/ui/ThemedField';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { ThemedText } from '@/components/ui/ThemedText';
import { DatePickerField, TimePickerField } from '@/components/ui/AppDatePicker';
import { useTimeFormat } from '@/context/TimeFormatContext';
import type { Service } from '@/types/database.types';

function isoFromDate(d: Date) {
  return d.toISOString();
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ client_id?: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showError } = useError();
  const { is24Hour } = useTimeFormat();
  const { organizationId } = useOrganization();

  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const { data: polishes = [] } = usePolishes();
  const createAppointment = useCreateAppointment();
  const addPolish = useAddPolishToAppointment();
  const { reminderEnabled, reminderMinutes } = useNotificationSettings();

  const [selectedClientId, setSelectedClientId] = useState<string>(params.client_id ?? '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [servicePickerValue, setServicePickerValue] = useState<string>('');
  const [selectedPolishIds, setSelectedPolishIds] = useState<string[]>([]);
  const [polishPickerValue, setPolishPickerValue] = useState<string>('');
  const [notes, setNotes] = useState('');

  const now = new Date();
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(new Date(now.getTime() + 60 * 60 * 1000));

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  function removeService(serviceId: string) {
    setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
  }

  function togglePolish(polishId: string) {
    setSelectedPolishIds((prev) =>
      prev.includes(polishId) ? prev.filter((id) => id !== polishId) : [...prev, polishId]
    );
  }

  function removePolish(polishId: string) {
    setSelectedPolishIds((prev) => prev.filter((id) => id !== polishId));
  }

  async function handleCreate() {
    if (!selectedClientId) { showError(t('appointment.error.clientRequired')); return; }
    if (endTime <= startTime) { showError(t('appointment.error.timeConflict')); return; }

    const conflicts = await findConflictingAppointments(isoFromDate(startTime), isoFromDate(endTime), organizationId!);
    if (conflicts.length > 0) {
      const names = conflicts.map((c) => c.client?.name ?? '?').join(', ');
      const fmt = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
      const time = `${fmt(new Date(conflicts[0].start_time))} – ${fmt(new Date(conflicts[0].end_time))}`;
      showError(t('appointment.error.conflict.title'), t('appointment.error.conflict.message').replace('{client}', names).replace('{time}', time));
      return;
    }

    const created = await createAppointment.mutateAsync({
      client_id: selectedClientId,
      service_ids: selectedServiceIds,
      start_time: isoFromDate(startTime),
      end_time: isoFromDate(endTime),
      notes: notes.trim() || null,
    });

    if (selectedPolishIds.length > 0) {
      await Promise.all(
        selectedPolishIds.map((nail_polish_id) =>
          addPolish.mutateAsync({ appointment_id: created.id, nail_polish_id })
        )
      );
    }

    const clientName = clients.find((c) => c.id === selectedClientId)?.name ?? '';
    const serviceNames = services.filter((s) => selectedServiceIds.includes(s.id)).map((s) => s.name);

    // Schedule appointment reminder
    if (reminderEnabled) {
      scheduleAppointmentReminder(created.id, isoFromDate(startTime), clientName, serviceNames, reminderMinutes);
    }

    // Fire-and-forget Google Calendar sync
    syncAppointmentToCalendar({
      appointmentId: created.id,
      clientName,
      serviceNames,
      startTime: isoFromDate(startTime),
      endTime: isoFromDate(endTime),
      notes: notes.trim() || null,
    });

    showToast(t('appointment.toast.created'));
    router.back();
  }

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const serviceOptions = services.map((s) => ({ value: s.id, label: s.name }));
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const polishOptions = polishes.map((p) => ({ value: p.id, label: `${p.brand} · ${p.color_name}` }));
  const selectedPolishes = polishes.filter((p) => selectedPolishIds.includes(p.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingLabel={t('common.cancel')}
        onLeadingPress={() => router.back()}
        title={t('appointment.new.title')}
        trailingLabel={t('common.save')}
        onTrailingPress={handleCreate}
        trailingDisabled={createAppointment.isPending}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <ThemedSection>
            <ThemedText variant="sectionTitle">{t('appointment.dateTime')}</ThemedText>
            <DatePickerField
              label={t('appointment.date')}
              value={startTime}
              onChange={(d) => {
                const newStart = new Date(startTime);
                newStart.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                const newEnd = new Date(endTime);
                newEnd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                setStartTime(newStart);
                setEndTime(newEnd);
              }}
            />
            <TimePickerField
              label={t('appointment.startTime')}
              value={startTime}
              minuteInterval={5}
              onChange={(d) => {
                const prevDuration = endTime.getTime() - startTime.getTime();
                setStartTime(d);
                setEndTime(new Date(d.getTime() + Math.max(prevDuration, 30 * 60 * 1000)));
              }}
            />
            <TimePickerField
              label={t('appointment.endTime')}
              value={endTime}
              minuteInterval={5}
              onChange={setEndTime}
            />
          </ThemedSection>

          <ThemedSection>
            <ThemedDropdown
              label={t('appointment.client')}
              value={selectedClientId}
              options={clientOptions}
              onChange={setSelectedClientId}
              placeholder={t('appointment.select.client')}
              searchable
              searchPlaceholder={t('appointment.search.client')}
            />
          </ThemedSection>

          <ThemedSection>
            <ThemedDropdown
              label={t('appointment.service')}
              value={servicePickerValue}
              options={serviceOptions}
              onChange={(serviceId) => { setServicePickerValue(serviceId); toggleService(serviceId); }}
              placeholder={t('appointment.select.service')}
              searchable
              searchPlaceholder={t('appointment.search.service')}
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              {t('appointment.multipleServicesHelp')}
            </Text>
            <View style={styles.pillsWrap}>
              {selectedServices.length > 0 ? (
                selectedServices.map((service: Service) => (
                  <View key={service.id} style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                    <Text style={[styles.pillText, { color: colors.text }]} numberOfLines={1}>{service.name}</Text>
                    <TouchableOpacity onPress={() => removeService(service.id)} hitSlop={8}>
                      <Text style={[styles.pillRemove, { color: colors.danger }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={[styles.pillsEmpty, { color: colors.textTertiary }]}>{t('appointment.noServicesSelected')}</Text>
              )}
            </View>
          </ThemedSection>

          <ThemedSection>
            <ThemedDropdown
              label={t('appointment.usedPolishes')}
              value={polishPickerValue}
              options={polishOptions}
              onChange={(polishId) => { setPolishPickerValue(polishId); togglePolish(polishId); }}
              placeholder={t('appointment.select.polish')}
              searchable
              searchPlaceholder={t('appointment.search.polish')}
            />
            <View style={styles.pillsWrap}>
              {selectedPolishes.length > 0 ? (
                selectedPolishes.map((p) => (
                  <View key={p.id} style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                    {p.hex_color ? <View style={[styles.polishDot, { backgroundColor: p.hex_color }]} /> : null}
                    <Text style={[styles.pillText, { color: colors.text }]} numberOfLines={1}>{p.color_name}</Text>
                    <TouchableOpacity onPress={() => removePolish(p.id)} hitSlop={8}>
                      <Text style={[styles.pillRemove, { color: colors.danger }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={[styles.pillsEmpty, { color: colors.textTertiary }]}>{t('appointment.noPolishesSelected')}</Text>
              )}
            </View>
          </ThemedSection>

          <ThemedSection>
            <ThemedField
              label={t('appointment.notes')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('appointment.notesPlaceholder')}
              multiline
              style={styles.inputMultiline}
            />
          </ThemedSection>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  helperText: { fontSize: 13 },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  pillText: { fontSize: 13, maxWidth: 180 },
  pillRemove: { fontSize: 14, fontWeight: '700' },
  pillsEmpty: { fontSize: 13, fontStyle: 'italic' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  polishDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
});

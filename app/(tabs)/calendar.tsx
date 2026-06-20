import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View, TouchableOpacity, StyleSheet, useWindowDimensions,
  ScrollView, ActivityIndicator, TextInput, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarUtils } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedCalendar } from '@/components/ui/ThemedCalendar';
import { CalendarNotesPad } from '@/components/ui/CalendarNotesPad';
import { useAppointmentsByDate, useAppointmentsByDateRange, useSearchAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useDrawingPad } from '@/context/DrawingPadContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import type { AppointmentWithRelations, Client } from '@/types/database.types';

const BIRTHDAY_COLOR = '#E91E63';

type CalendarView = 'day' | 'week';

function todayString() {
  return CalendarUtils.getCalendarDateString(new Date());
}

function formatTime(iso: string, locale: string, is24Hour: boolean) {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
}

function durationMin(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return CalendarUtils.getCalendarDateString(d);
}

function weekStart(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return CalendarUtils.getCalendarDateString(d);
}

function formatWeekDay(dateStr: string, locale: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
}

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  pending: 'time-outline',
  completed: 'checkmark-circle',
  cancelled: 'close-circle',
};

function TimelineBlock({ apt, onPress }: { apt: AppointmentWithRelations; onPress: () => void }) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const { is24Hour } = useTimeFormat();
  const mins = durationMin(apt.start_time, apt.end_time);
  const height = Math.max(56, mins * 1.2);
  const locale = lang === 'en' ? 'en-US' : 'es-ES';

  const blockBg: Record<string, string> = {
    pending: colors.primary,
    completed: colors.statusCompleted,
    cancelled: colors.statusCancelled,
  };
  const blockText: Record<string, string> = {
    pending: colors.onPrimary,
    completed: colors.statusCompletedText,
    cancelled: colors.statusCancelledText,
  };

  const bg = blockBg[apt.status] ?? colors.primary;
  const textColor = blockText[apt.status] ?? colors.onPrimary;

  return (
    <TouchableOpacity
      style={[styles.block, { height, backgroundColor: bg, opacity: apt.status === 'cancelled' ? 0.65 : 1 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.blockTopRow}>
        <ThemedText variant="body" style={[styles.blockClient, { color: textColor }]} numberOfLines={1}>
          {apt.client?.name}
        </ThemedText>
        <Ionicons name={STATUS_ICON[apt.status] ?? 'ellipse'} size={14} color={textColor} style={{ opacity: 0.85 }} />
      </View>
      <ThemedText variant="caption" style={[styles.blockTime, { color: textColor }]}>
        {formatTime(apt.start_time, locale, is24Hour)} – {formatTime(apt.end_time, locale, is24Hour)}
      </ThemedText>
      {apt.services.length > 0 ? (
        <ThemedText variant="caption" style={[styles.blockService, { color: textColor }]} numberOfLines={1}>
          {apt.services.map((s) => s.name).join(' · ')}
        </ThemedText>
      ) : null}
    </TouchableOpacity>
  );
}

function BirthdayBanner({ clients }: { clients: Client[] }) {
  const { t } = useI18n();
  return (
    <View style={styles.birthdayBanner}>
      <Ionicons name="gift-outline" size={16} color={BIRTHDAY_COLOR} />
      <ThemedText style={[styles.birthdayText, { color: BIRTHDAY_COLOR }]}>
        {t('calendar.birthdayBanner')}: {clients.map((c) => c.name).join(', ')}
      </ThemedText>
    </View>
  );
}

function SearchResultRow({ apt, onPress }: { apt: AppointmentWithRelations; onPress: () => void }) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const { is24Hour } = useTimeFormat();
  const locale = lang === 'en' ? 'en-US' : 'es-ES';
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
      style={[styles.searchRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.searchAccent, { backgroundColor: colors.primary }]} />
      <View style={styles.searchBody}>
        <ThemedText variant="body" style={{ fontWeight: '600' }}>{apt.client?.name}</ThemedText>
        <ThemedText variant="caption" tone="secondary">
          {new Date(apt.start_time).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          {formatTime(apt.start_time, locale, is24Hour)}
        </ThemedText>
        {apt.services.length > 0 ? (
          <ThemedText variant="caption" tone="primary">{apt.services.map((s) => s.name).join(' · ')}</ThemedText>
        ) : null}
      </View>
      <View style={[styles.searchBadge, { backgroundColor: statusBg[apt.status] }]}>
        <ThemedText variant="caption" style={{ color: statusText[apt.status], fontWeight: '700', fontSize: 11 }}>
          {apt.status === 'pending' ? '⏱' : apt.status === 'completed' ? '✓' : '✕'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isWideLayout = width >= 1000 || width > height;
  const isTablet = width >= 768;
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [calView, setCalView] = useState<CalendarView>('day');
  const [weekAnchor, setWeekAnchor] = useState(() => weekStart(todayString()));
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<TextInput>(null);
  const { data: clients } = useClients();

  // Map of 'YYYY-MM-DD' → clients with birthday on that day (year-agnostic)
  const birthdayMap = useMemo(() => {
    const map: Record<string, Client[]> = {};
    for (const c of clients ?? []) {
      if (!c.birthday) continue;
      const mmdd = c.birthday.slice(5); // 'MM-DD'
      const year = new Date().getFullYear();
      const key = `${year}-${mmdd}`;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [clients]);

  const { data: dayAppointments, isLoading: dayLoading } = useAppointmentsByDate(selectedDate);

  const weekEnd = addDays(weekAnchor, 6);
  const { data: weekAppointments, isLoading: weekLoading } = useAppointmentsByDateRange(
    weekAnchor, weekEnd
  );

  const { data: searchResults, isLoading: searchLoading } = useSearchAppointments(searchQuery);

  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { drawingPadEnabled } = useDrawingPad();
  const { is24Hour } = useTimeFormat();
  const locale = lang === 'en' ? 'en-US' : 'es-ES';

  useEffect(() => {
    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (searchActive) {
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [searchActive]);

  const onDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
    if (calView === 'week') {
      setCalView('day');
    }
  }, [calView]);

  const markedDates = useMemo(() => {
    const result: Record<string, any> = {};

    // Birthday dots for all known birthdays
    for (const [date, bClients] of Object.entries(birthdayMap)) {
      result[date] = {
        ...(result[date] ?? {}),
        dots: [
          ...(result[date]?.dots ?? []),
          { key: `bday-${bClients[0].id}`, color: BIRTHDAY_COLOR, selectedColor: '#fff' },
        ],
      };
    }

    // Selected date
    result[selectedDate] = {
      ...(result[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
      dots: result[selectedDate]?.dots ?? [],
    };

    // Week range dots
    if (calView === 'week') {
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekAnchor, i);
        result[d] = {
          ...(result[d] ?? {}),
          dots: [
            { key: 'apt', color: colors.primary, selectedColor: colors.onPrimary },
            ...(result[d]?.dots?.filter((dot: any) => dot.key !== 'apt') ?? []),
          ],
        };
      }
    }

    return result;
  }, [birthdayMap, selectedDate, calView, weekAnchor, colors]);

  const appointments = calView === 'day' ? dayAppointments : undefined;
  const isLoading = calView === 'day' ? dayLoading : weekLoading;

  const grouped = (appointments ?? []).reduce<Record<string, AppointmentWithRelations[]>>((acc, apt) => {
    const hour = new Date(apt.start_time).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(apt);
    return acc;
  }, {});
  const timeSlots = Object.keys(grouped).sort();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));
  const weekGrouped = (weekAppointments ?? []).reduce<Record<string, AppointmentWithRelations[]>>((acc, apt) => {
    const d = apt.start_time.slice(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(apt);
    return acc;
  }, {});

  function Timeline() {
    if (isLoading) return <ActivityIndicator style={styles.loader} color={colors.primary} />;
    const birthdayClients = birthdayMap[selectedDate] ?? [];
    return (
      <ScrollView contentContainerStyle={styles.timeline}>
        {birthdayClients.length > 0 && <BirthdayBanner clients={birthdayClients} />}
        {timeSlots.length > 0 ? (
          timeSlots.map((slot) => (
            <View key={slot} style={styles.slotRow}>
              <ThemedText variant="caption" tone="tertiary" style={styles.slotLabel}>{slot}</ThemedText>
              <View style={styles.slotBlocks}>
                {grouped[slot].map((apt) => (
                  <TimelineBlock key={apt.id} apt={apt} onPress={() => router.push(`/appointments/${apt.id}`)} />
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Image
              source={require('@/assets/empty_calendar.png')}
              style={{ width: isTablet ? 480 : 320, height: isTablet ? 480 : 320 }}
              resizeMode="contain"
            />
            <ThemedText tone="tertiary" style={[styles.emptyText, { marginTop: isTablet ? -120 : -80 }]}>{t('calendar.noAppointments')}</ThemedText>
          </View>
        )}
      </ScrollView>
    );
  }

  function WeekView() {
    if (weekLoading) return <ActivityIndicator style={styles.loader} color={colors.primary} />;
    return (
      <ScrollView contentContainerStyle={styles.weekContent}>
        {weekDays.map((day) => {
          const dayApts = weekGrouped[day] ?? [];
          const isToday = day === todayString();
          const isSelected = day === selectedDate;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.weekDayRow, { borderBottomColor: colors.border }]}
              onPress={() => { setSelectedDate(day); setCalView('day'); }}
              activeOpacity={0.7}
            >
              <View style={[styles.weekDayLabel, isToday && { backgroundColor: colors.primaryMuted, borderRadius: 8 }]}>
                <ThemedText
                  variant="caption"
                  tone={isSelected ? 'primary' : isToday ? 'primary' : 'secondary'}
                  style={[styles.weekDayText, isSelected && { fontWeight: '700' }]}
                >
                  {formatWeekDay(day, locale)}
                </ThemedText>
              </View>
              <View style={styles.weekDayApts}>
                {(birthdayMap[day] ?? []).length > 0 && (
                  <View style={styles.weekBirthday}>
                    <Ionicons name="gift-outline" size={11} color={BIRTHDAY_COLOR} />
                    <ThemedText variant="caption" style={[styles.weekBirthdayText, { color: BIRTHDAY_COLOR }]} numberOfLines={1}>
                      {(birthdayMap[day] ?? []).map((c) => c.name).join(', ')}
                    </ThemedText>
                  </View>
                )}
                {dayApts.length === 0 ? (
                  <ThemedText variant="caption" tone="tertiary" style={styles.weekEmpty}>—</ThemedText>
                ) : (
                  dayApts.map((apt) => (
                    <TouchableOpacity
                      key={apt.id}
                      style={[styles.weekBlock, { backgroundColor: colors.primaryMuted, borderLeftColor: colors.primary }]}
                      onPress={(e) => { e.stopPropagation(); router.push(`/appointments/${apt.id}`); }}
                      activeOpacity={0.75}
                    >
                      <ThemedText variant="caption" tone="primary" numberOfLines={1} style={{ fontWeight: '600' }}>
                        {formatTime(apt.start_time, locale, is24Hour)} {apt.client?.name}
                      </ThemedText>
                      {apt.services.length > 0 ? (
                        <ThemedText variant="caption" tone="secondary" numberOfLines={1}>
                          {apt.services.map((s) => s.name).join(' · ')}
                        </ThemedText>
                      ) : null}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  const calendarNode = (
    <ThemedCalendar
      current={calView === 'week' ? weekAnchor : selectedDate}
      onDayPress={onDayPress}
      markedDates={markedDates}
      markingType="multi-dot"
      style={styles.calendar}
    />
  );

  const viewToggle = (
    <View style={[styles.viewToggle, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      {(['day', 'week'] as CalendarView[]).map((v) => (
        <TouchableOpacity
          key={v}
          style={[styles.viewToggleBtn, calView === v && { backgroundColor: colors.primary }]}
          onPress={() => {
            setCalView(v);
            if (v === 'week') setWeekAnchor(weekStart(selectedDate));
          }}
          activeOpacity={0.8}
        >
          <ThemedText
            variant="caption"
            style={[styles.viewToggleBtnText, { color: calView === v ? colors.onPrimary : colors.textSecondary }]}
          >
            {v === 'day' ? t('calendar.viewDay') : t('calendar.viewWeek')}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const weekNavigation = calView === 'week' ? (
    <View style={[styles.weekNav, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => setWeekAnchor(addDays(weekAnchor, -7))} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </TouchableOpacity>
      <ThemedText variant="caption" tone="secondary">
        {formatWeekDay(weekAnchor, locale)} – {formatWeekDay(weekEnd, locale)}
      </ThemedText>
      <TouchableOpacity onPress={() => setWeekAnchor(addDays(weekAnchor, 7))} hitSlop={8}>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {searchActive ? (
          <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              ref={searchRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('calendar.search.placeholder')}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ThemedText variant="title">{t('tabs.calendar')}</ThemedText>
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setSearchActive((v) => !v)}
            style={styles.headerIconBtn}
            hitSlop={8}
          >
            <Ionicons
              name={searchActive ? 'close' : 'search'}
              size={22}
              color={searchActive ? colors.danger : colors.primary}
            />
          </TouchableOpacity>
          {!searchActive && (
            <ThemedButton label={t('home.newAppointment')} icon="add" onPress={() => router.push('/appointments/new')} />
          )}
        </View>
      </View>

      {searchActive ? (
        <ScrollView contentContainerStyle={styles.searchResults} keyboardShouldPersistTaps="handled">
          {searchQuery.length < 2 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
              <ThemedText tone="tertiary" style={styles.emptyText}>{t('calendar.search.hint')}</ThemedText>
            </View>
          ) : searchLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (searchResults ?? []).length === 0 ? (
            <View style={styles.empty}>
              <ThemedText tone="tertiary" style={styles.emptyText}>{t('common.noResults')}</ThemedText>
            </View>
          ) : (
            (searchResults ?? []).map((apt) => (
              <SearchResultRow
                key={apt.id}
                apt={apt}
                onPress={() => { setSearchActive(false); router.push(`/appointments/${apt.id}`); }}
              />
            ))
          )}
        </ScrollView>
      ) : isWideLayout ? (
        <View style={styles.tabletContent}>
          <View style={styles.tabletCalendarPane}>
            {viewToggle}
            {calendarNode}
            {drawingPadEnabled && calView === 'day'
              ? <CalendarNotesPad date={selectedDate} expanded allowDrawing={width >= 1000} />
              : null}
          </View>
          <View style={[styles.tabletTimelinePane, { borderLeftColor: colors.border }]}>
            {weekNavigation}
            {calView === 'day' ? <Timeline /> : <WeekView />}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.calendarHeader}>
            {viewToggle}
          </View>
          {calView === 'day' && calendarNode}
          {weekNavigation}
          {calView === 'day' ? <Timeline /> : <WeekView />}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: { padding: 4 },
  calendarHeader: { paddingHorizontal: 12, paddingVertical: 8 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, height: 36,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  searchResults: { paddingBottom: 32 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  searchBody: { flex: 1, gap: 2 },
  searchBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  viewToggle: {
    flexDirection: 'row', borderRadius: 8, borderWidth: 1,
    overflow: 'hidden', alignSelf: 'flex-end',
  },
  viewToggleBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  viewToggleBtnText: { fontSize: 13, fontWeight: '600' },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekContent: { paddingBottom: 32 },
  weekDayRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  weekDayLabel: { width: 72, justifyContent: 'flex-start', paddingTop: 2, paddingHorizontal: 4 },
  weekDayText: { fontSize: 12 },
  weekDayApts: { flex: 1, gap: 4 },
  weekEmpty: { opacity: 0.4 },
  weekBlock: {
    borderLeftWidth: 3, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  calendar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabletContent: { flex: 1, flexDirection: 'row' },
  tabletCalendarPane: { width: '52%', padding: 16, gap: 12 },
  tabletTimelinePane: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  loader: { marginTop: 40 },
  timeline: { padding: 16, gap: 4 },
  slotRow: { flexDirection: 'row', gap: 12, minHeight: 60 },
  slotLabel: { width: 50, paddingTop: 10, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  slotBlocks: { flex: 1, gap: 4 },
  block: { borderRadius: 10, padding: 10, justifyContent: 'center', opacity: 0.92 },
  blockTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  blockClient: { fontWeight: '700', flex: 1 },
  blockTime: { marginTop: 2, opacity: 0.85 },
  blockService: { marginTop: 1, opacity: 0.75 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15 },
  birthdayBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FCE4EC', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4,
  },
  birthdayText: { fontSize: 13, fontWeight: '600', flex: 1 },
  weekBirthday: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekBirthdayText: { fontSize: 11, fontWeight: '600' },
});

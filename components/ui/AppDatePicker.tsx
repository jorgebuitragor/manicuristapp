import { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { CalendarUtils } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { ThemedCalendar } from '@/components/ui/ThemedCalendar';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import { SwipeToDismissModal } from '@/components/ui/SwipeToDismissModal';

const ITEM_H = 48;
const VISIBLE = 5; // items shown in the wheel at once

// ─── WheelColumn ──────────────────────────────────────────────────────────────

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width: number;
}

function WheelColumn({ items, selectedIndex, onChange, width }: WheelColumnProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  function handleScrollEnd(offsetY: number) {
    const idx = Math.max(0, Math.min(Math.round(offsetY / ITEM_H), items.length - 1));
    onChange(idx);
    // Snap precisely in case of rounding drift
    scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: true });
  }

  return (
    <View style={{ width, height: ITEM_H * VISIBLE }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y)}
      >
        {items.map((item, i) => (
          <View key={item} style={styles.wheelItem}>
            <ThemedText
              style={[
                styles.wheelText,
                i === selectedIndex
                  ? { color: colors.primary, fontWeight: '700' }
                  : { color: colors.text, opacity: 0.35 + Math.max(0, 0.65 - Math.abs(i - selectedIndex) * 0.3) },
              ]}
            >
              {item}
            </ThemedText>
          </View>
        ))}
      </ScrollView>

      {/* Selection bracket — rendered on top, ignores touches */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.selectionLine, { top: ITEM_H * 2, backgroundColor: colors.primary }]} />
        <View style={[styles.selectionLine, { top: ITEM_H * 3 - StyleSheet.hairlineWidth, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

// ─── PickerRow ────────────────────────────────────────────────────────────────

interface PickerRowProps {
  label: string;
  displayValue: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  borderTop?: boolean;
}

function PickerRow({ label, displayValue, icon, onPress, borderTop = true }: PickerRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, borderTop && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={17} color={colors.textSecondary} />
        <ThemedText tone="secondary" style={styles.rowLabel}>{label}</ThemedText>
      </View>
      <ThemedText tone="primary" style={styles.rowValue}>{displayValue}</ThemedText>
    </TouchableOpacity>
  );
}

// ─── PickerSheet ──────────────────────────────────────────────────────────────

interface PickerSheetProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

function PickerSheet({ open, title, onCancel, onConfirm, children }: PickerSheetProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width: screenWidth } = useWindowDimensions();
  const dialogWidth = Math.min(screenWidth - 24, 600);
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 4, speed: 20 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
    >
      <Animated.View style={[styles.backdropFill, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      <View style={styles.dialogWrapper} pointerEvents="box-none">
        <SwipeToDismissModal onDismiss={onCancel} containerStyle={styles.dialogSwipeSurface}>
          <Animated.View
            style={[
              styles.dialog,
              { width: dialogWidth, backgroundColor: colors.card, borderColor: colors.border },
              { transform: [{ scale }], opacity: backdropOpacity },
            ]}
          >
            <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
              <ThemedText variant="caption" tone="tertiary" style={styles.toolbarTitle}>
                {title}
              </ThemedText>
              <View style={styles.toolbarButtons}>
                <TouchableOpacity onPress={onCancel} hitSlop={8} style={styles.toolbarBtn}>
                  <ThemedText tone="secondary">{t('common.cancel')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={onConfirm} hitSlop={8} style={styles.toolbarBtn}>
                  <ThemedText tone="primary" style={{ fontWeight: '700' }}>{t('common.done')}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            {children}
          </Animated.View>
        </SwipeToDismissModal>
      </View>
    </Modal>
  );
}

// ─── DatePickerField ──────────────────────────────────────────────────────────

interface DatePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  borderTop?: boolean;
}

export function DatePickerField({
  label, value, onChange, minimumDate, maximumDate, borderTop,
}: DatePickerFieldProps) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [staged, setStaged] = useState(value);
  const locale = lang === 'en' ? 'en-US' : 'es-ES';

  const displayValue = value.toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const stagedDateStr = CalendarUtils.getCalendarDateString(staged);

  const minDateStr = minimumDate ? CalendarUtils.getCalendarDateString(minimumDate) : undefined;
  const maxDateStr = maximumDate ? CalendarUtils.getCalendarDateString(maximumDate) : undefined;

  function handleDayPress(day: DateData) {
    const picked = new Date(staged);
    picked.setFullYear(day.year, day.month - 1, day.day);
    setStaged(picked);
  }

  function handleOpen() {
    setStaged(value);
    setOpen(true);
  }

  return (
    <>
      <PickerRow
        label={label}
        displayValue={displayValue}
        icon="calendar-outline"
        onPress={handleOpen}
        borderTop={borderTop}
      />
      <PickerSheet
        open={open}
        title={label}
        onCancel={() => setOpen(false)}
        onConfirm={() => { onChange(staged); setOpen(false); }}
      >
        <ThemedCalendar
          current={stagedDateStr}
          onDayPress={handleDayPress}
          markedDates={{ [stagedDateStr]: { selected: true, selectedColor: colors.primary } }}
          minDate={minDateStr}
          maxDate={maxDateStr}
        />
      </PickerSheet>
    </>
  );
}

// ─── TimePickerField ──────────────────────────────────────────────────────────

interface TimePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  borderTop?: boolean;
}

function to12Hour(hour24: number): { hour: number; ampm: 'AM' | 'PM' } {
  if (hour24 === 0) return { hour: 12, ampm: 'AM' };
  if (hour24 < 12) return { hour: hour24, ampm: 'AM' };
  if (hour24 === 12) return { hour: 12, ampm: 'PM' };
  return { hour: hour24 - 12, ampm: 'PM' };
}

function to24Hour(hour12: number, ampm: 'AM' | 'PM'): number {
  if (ampm === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function TimePickerField({
  label, value, onChange, minuteInterval = 5, borderTop,
}: TimePickerFieldProps) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const { is24Hour } = useTimeFormat();
  const locale = lang === 'en' ? 'en-US' : 'es-ES';

  const [open, setOpen] = useState(false);
  const [stagedHour24, setStagedHour24] = useState(value.getHours());
  const [stagedMinute, setStagedMinute] = useState(
    Math.round(value.getMinutes() / minuteInterval) * minuteInterval
  );
  const [stagedAmPm, setStagedAmPm] = useState<'AM' | 'PM'>(
    value.getHours() < 12 ? 'AM' : 'PM'
  );

  const displayValue = value.toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit', hour12: !is24Hour,
  });

  const hours24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minuteCount = Math.floor(60 / minuteInterval);
  const minutes = Array.from({ length: minuteCount }, (_, i) =>
    String(i * minuteInterval).padStart(2, '0')
  );
  const ampmItems = ['AM', 'PM'];

  function handleOpen() {
    const h = value.getHours();
    setStagedHour24(h);
    setStagedMinute(Math.round(value.getMinutes() / minuteInterval) * minuteInterval);
    setStagedAmPm(h < 12 ? 'AM' : 'PM');
    setOpen(true);
  }

  function handleConfirm() {
    const d = new Date(value);
    if (is24Hour) {
      d.setHours(stagedHour24, stagedMinute, 0, 0);
    } else {
      const { hour } = to12Hour(stagedHour24);
      d.setHours(to24Hour(hour, stagedAmPm), stagedMinute, 0, 0);
    }
    onChange(d);
    setOpen(false);
  }

  const { hour: hour12 } = to12Hour(stagedHour24);

  return (
    <>
      <PickerRow
        label={label}
        displayValue={displayValue}
        icon="time-outline"
        onPress={handleOpen}
        borderTop={borderTop}
      />
      <PickerSheet
        open={open}
        title={label}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      >
        <View style={styles.timeWheel}>
          {is24Hour ? (
            <WheelColumn
              items={hours24}
              selectedIndex={stagedHour24}
              onChange={(i) => setStagedHour24(i)}
              width={72}
            />
          ) : (
            <>
              <WheelColumn
                items={hours12}
                selectedIndex={hour12 - 1}
                onChange={(i) => {
                  const newHour12 = i + 1;
                  setStagedHour24(to24Hour(newHour12, stagedAmPm));
                }}
                width={72}
              />
            </>
          )}
          <ThemedText style={[styles.timeSeparator, { color: colors.primary }]}>:</ThemedText>
          <WheelColumn
            items={minutes}
            selectedIndex={Math.round(stagedMinute / minuteInterval)}
            onChange={(i) => setStagedMinute(i * minuteInterval)}
            width={72}
          />
          {!is24Hour && (
            <WheelColumn
              items={ampmItems}
              selectedIndex={stagedAmPm === 'AM' ? 0 : 1}
              onChange={(i) => {
                const newAmPm = i === 0 ? 'AM' : 'PM';
                setStagedAmPm(newAmPm);
                const { hour } = to12Hour(stagedHour24);
                setStagedHour24(to24Hour(hour, newAmPm));
              }}
              width={64}
            />
          )}
        </View>
      </PickerSheet>
    </>
  );
}

// ─── BirthdayPickerField ──────────────────────────────────────────────────────

interface BirthdayPickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  borderTop?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => String(CURRENT_YEAR - i));

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function BirthdayPickerField({ label, value, onChange, borderTop }: BirthdayPickerFieldProps) {
  const { lang } = useI18n();
  const { colors } = useTheme();
  const locale = lang === 'en' ? 'en-US' : 'es-ES';

  const defaultDate = value ?? new Date(CURRENT_YEAR - 30, 0, 1);

  const [open, setOpen] = useState(false);
  const [stagedDay,   setStagedDay]   = useState(defaultDate.getDate());
  const [stagedMonth, setStagedMonth] = useState(defaultDate.getMonth());
  const [stagedYear,  setStagedYear]  = useState(defaultDate.getFullYear());

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: 'long' })
  );

  const totalDays = daysInMonth(stagedMonth, stagedYear);
  const days = Array.from({ length: totalDays }, (_, i) => String(i + 1).padStart(2, '0'));

  useEffect(() => {
    if (stagedDay > totalDays) setStagedDay(totalDays);
  }, [stagedMonth, stagedYear, totalDays]);

  function handleOpen() {
    const d = value ?? new Date(CURRENT_YEAR - 30, 0, 1);
    setStagedDay(d.getDate());
    setStagedMonth(d.getMonth());
    setStagedYear(d.getFullYear());
    setOpen(true);
  }

  function handleConfirm() {
    onChange(new Date(stagedYear, stagedMonth, Math.min(stagedDay, totalDays), 12, 0, 0));
    setOpen(false);
  }

  const displayValue = value
    ? value.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const yearIndex = YEARS.indexOf(String(stagedYear));

  return (
    <>
      <PickerRow
        label={label}
        displayValue={displayValue}
        icon="gift-outline"
        onPress={handleOpen}
        borderTop={borderTop}
      />
      <PickerSheet open={open} title={label} onCancel={() => setOpen(false)} onConfirm={handleConfirm}>
        <View style={styles.birthdayWheel}>
          <WheelColumn
            items={days}
            selectedIndex={Math.min(stagedDay - 1, days.length - 1)}
            onChange={(i) => setStagedDay(i + 1)}
            width={56}
          />
          <View style={[styles.birthdaySep, { backgroundColor: colors.border }]} />
          <WheelColumn
            items={months}
            selectedIndex={stagedMonth}
            onChange={(i) => setStagedMonth(i)}
            width={130}
          />
          <View style={[styles.birthdaySep, { backgroundColor: colors.border }]} />
          <WheelColumn
            items={YEARS}
            selectedIndex={yearIndex >= 0 ? yearIndex : 0}
            onChange={(i) => setStagedYear(Number(YEARS[i]))}
            width={68}
          />
        </View>
      </PickerSheet>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Row trigger
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 15, fontWeight: '600' },

  // Wheel
  wheelItem: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  wheelText: { fontSize: 22 },
  selectionLine: { position: 'absolute', left: 8, right: 8, height: 1.5, borderRadius: 1 },

  // Time picker layout
  timeWheel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  timeSeparator: { fontSize: 28, fontWeight: '700', marginBottom: 2 },

  // Birthday wheel
  birthdayWheel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 0,
  },
  birthdaySep: {
    width: StyleSheet.hairlineWidth,
    height: ITEM_H * VISIBLE * 0.6,
    marginHorizontal: 4,
    opacity: 0.3,
  },

  // Dialog
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dialogWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  dialogSwipeSurface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  toolbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: 16,
    gap: 8,
  },
  toolbarTitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  toolbarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toolbarBtn: {},
});

import { StyleSheet } from 'react-native';
import { Calendar, LocaleConfig, type CalendarProps } from 'react-native-calendars';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';

interface ThemedCalendarProps extends CalendarProps {
  themeOverrides?: CalendarProps['theme'];
}

LocaleConfig.locales.es = {
  monthNames: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  monthNamesShort: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'],
  dayNames: ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
  dayNamesShort: ['dom.', 'lun.', 'mar.', 'mie.', 'jue.', 'vie.', 'sab.'],
  today: 'hoy',
};

LocaleConfig.locales.en = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'today',
};

export function ThemedCalendar({ style, themeOverrides, ...props }: ThemedCalendarProps) {
  const { colors, isDark } = useTheme();
  const { lang } = useI18n();

  LocaleConfig.defaultLocale = lang;

  const theme: CalendarProps['theme'] = {
    backgroundColor: colors.card,
    calendarBackground: colors.card,
    textSectionTitleColor: colors.textSecondary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: colors.onPrimary,
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: colors.textTertiary,
    dotColor: colors.primary,
    selectedDotColor: colors.onPrimary,
    arrowColor: colors.primary,
    disabledArrowColor: colors.textTertiary,
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontWeight: '500',
    textMonthFontWeight: '700',
    textDayHeaderFontWeight: '600',
    ...themeOverrides,
  };

  return (
    <Calendar
      key={isDark ? 'dark' : 'light'}
      {...props}
      theme={theme}
      style={[styles.calendar, { borderBottomColor: colors.border }, style]}
    />
  );
}

const styles = StyleSheet.create({
  calendar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

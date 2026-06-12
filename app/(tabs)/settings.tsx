import { View, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedDropdown } from '@/components/ui/ThemedDropdown';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useCurrency, CURRENCIES } from '@/context/CurrencyContext';
import { useDrawingPad } from '@/context/DrawingPadContext';
import { useTimeFormat } from '@/context/TimeFormatContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useGoogleCalendarConnection } from '@/hooks/useGoogleCalendar';
import type { ColorScheme } from '@/lib/theme';
import Constants from 'expo-constants';

type LangPref = 'system' | 'es' | 'en';

function SectionHeader({ label }: { label: string }) {
  return (
    <ThemedText variant="caption" tone="tertiary" style={styles.sectionHeader}>{label.toUpperCase()}</ThemedText>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segmentedItem,
              active && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <ThemedText
              variant="caption"
              style={[
                styles.segmentedLabel,
                { color: active ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {opt.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, colorScheme, setColorScheme } = useTheme();
  const { t, langPreference, setLangPreference } = useI18n();
  const { symbol, setSymbol } = useCurrency();
  const { drawingPadEnabled, setDrawingPadEnabled } = useDrawingPad();
  const { is24Hour, setIs24Hour } = useTimeFormat();
  const { showConfirm } = useConfirm();
  const { isConnected: gcalConnected, isLoading: gcalLoading, isConnecting, connect: gcalConnect, disconnect: gcalDisconnect } = useGoogleCalendarConnection();

  const themeOptions: { value: ColorScheme; label: string }[] = [
    { value: 'system', label: t('settings.theme.system') },
    { value: 'light', label: t('settings.theme.light') },
    { value: 'dark', label: t('settings.theme.dark') },
  ];

  const langOptions: { value: LangPref; label: string }[] = [
    { value: 'system', label: t('settings.lang.system') },
    { value: 'es', label: t('settings.lang.es') },
    { value: 'en', label: t('settings.lang.en') },
  ];

  function handleLogout() {
    showConfirm({
      title: t('settings.logout.confirm.title'),
      message: t('settings.logout.confirm.message'),
      confirmLabel: t('settings.logout.confirm.ok'),
      variant: 'danger',
      onConfirm: () => supabase.auth.signOut(),
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText variant="title" style={styles.headerTitle}>{t('settings.title')}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Appearance */}
        <SectionHeader label={t('settings.appearance')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow icon="moon-outline" label={t('settings.theme')}>
            <SegmentedControl
              options={themeOptions}
              value={colorScheme}
              onChange={setColorScheme}
            />
          </SettingsRow>
        </View>

        {/* Language */}
        <SectionHeader label={t('settings.language')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow icon="language-outline" label={t('settings.lang')}>
            <SegmentedControl
              options={langOptions}
              value={langPreference}
              onChange={setLangPreference}
            />
          </SettingsRow>
        </View>

        {/* Currency */}
        <SectionHeader label={t('settings.currency')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dropdownRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedDropdown
                value={symbol}
                options={CURRENCIES.map((c) => ({ value: c.symbol, label: c.label }))}
                onChange={(v) => setSymbol(v as typeof symbol)}
                stackOrder={30}
              />
            </View>
          </View>
        </View>

        {/* Calendar */}
        <SectionHeader label={t('settings.calendar')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow icon="time-outline" label={t('settings.timeFormat')}>
            <SegmentedControl
              options={[
                { value: '12h', label: t('settings.timeFormat.12h') },
                { value: '24h', label: t('settings.timeFormat.24h') },
              ]}
              value={is24Hour ? '24h' : '12h'}
              onChange={(v) => setIs24Hour(v === '24h')}
            />
          </SettingsRow>
          <SettingsRow icon="pencil-outline" label={t('settings.drawingPad')}>
            <Switch
              value={drawingPadEnabled}
              onValueChange={setDrawingPadEnabled}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={drawingPadEnabled ? colors.primary : colors.textTertiary}
            />
          </SettingsRow>
        </View>

        {/* App data */}
        <SectionHeader label="App" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(tabs)/services')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="hand-left-outline" size={18} color={colors.primary} />
              </View>
              <ThemedText style={styles.rowLabel}>{t('settings.services')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(tabs)/brands')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              </View>
              <ThemedText style={styles.rowLabel}>{t('settings.brands')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(tabs)/racks')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="albums-outline" size={18} color={colors.primary} />
              </View>
              <ThemedText style={styles.rowLabel}>{t('settings.racks')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowNoBorder]}
            onPress={() => router.push('/(tabs)/polishes/labels' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="color-filter-outline" size={18} color={colors.primary} />
              </View>
              <ThemedText style={styles.rowLabel}>{t('settings.polishLabels')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Google Calendar */}
        <SectionHeader label={t('settings.googleCalendar')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, styles.rowNoBorder]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <ThemedText style={styles.rowLabel}>{t('settings.googleCalendar')}</ThemedText>
                <ThemedText variant="caption" tone={gcalConnected ? 'primary' : 'tertiary'}>
                  {gcalLoading
                    ? '...'
                    : gcalConnected
                      ? t('settings.googleCalendar.connected')
                      : t('settings.googleCalendar.description')}
                </ThemedText>
              </View>
            </View>
            {gcalLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <TouchableOpacity
                onPress={gcalConnected ? gcalDisconnect : gcalConnect}
                disabled={isConnecting}
                activeOpacity={0.7}
                style={[
                  styles.gcalButton,
                  { backgroundColor: gcalConnected ? colors.dangerMuted : colors.primaryMuted,
                    borderColor: gcalConnected ? colors.dangerBorder : colors.primary },
                ]}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <ThemedText
                    variant="caption"
                    style={[styles.gcalButtonLabel, { color: gcalConnected ? colors.danger : colors.primary }]}
                  >
                    {gcalConnected
                      ? t('settings.googleCalendar.disconnect')
                      : t('settings.googleCalendar.connect')}
                  </ThemedText>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account */}
        <SectionHeader label={t('settings.account')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, styles.rowNoBorder]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.dangerMuted }]}> 
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              </View>
              <ThemedText tone="danger" style={styles.rowLabel}>{t('settings.logout')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <ThemedText variant="caption" tone="tertiary" style={styles.version}> 
          v{Constants.expoConfig?.version ?? '1.0.0'}
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 2,
  },
  segmentedItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  segmentedLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
  },
  gcalButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    alignItems: 'center',
  },
  gcalButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import {
  useIncomes, useDeleteIncome, useIncomeSummary, useIncomeStats,
  type IncomeWithRelations, type StatsPeriod,
} from '@/hooks/useIncomes';
import { useCurrency } from '@/context/CurrencyContext';

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function SummaryCard({ label, amount }: { label: string; amount: number }) {
  const { colors } = useTheme();
  const { formatAmount } = useCurrency();
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText tone="secondary" style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText variant="subtitle" tone="primary" style={styles.summaryAmount}>
        {formatAmount(amount)}
      </ThemedText>
    </View>
  );
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const CHART_HEIGHT = 72;

function IncomeChart({ data }: { data: { label: string; amount: number }[] }) {
  const { colors } = useTheme();
  const { formatAmount } = useCurrency();
  const max = Math.max(...data.map((d) => d.amount), 1);
  const hasAny = data.some((d) => d.amount > 0);

  return (
    <View style={styles.chart}>
      <View style={{ flexDirection: 'row', height: CHART_HEIGHT, alignItems: 'flex-end', gap: 3 }}>
        {data.map(({ label, amount }) => {
          const fillH = amount > 0 ? Math.max(4, (amount / max) * CHART_HEIGHT) : 2;
          return (
            <View key={label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT }}>
              <View
                style={{
                  width: '100%',
                  height: fillH,
                  borderRadius: 3,
                  backgroundColor: amount > 0 ? colors.primary : colors.border,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
        {data.map(({ label }) => (
          <ThemedText key={label} variant="caption" tone="tertiary" style={styles.chartLabel}>
            {label}
          </ThemedText>
        ))}
      </View>
      {hasAny && (
        <ThemedText variant="caption" tone="tertiary" style={styles.chartMax}>
          {formatAmount(max)}
        </ThemedText>
      )}
    </View>
  );
}

function StatsSection({ period }: { period: StatsPeriod }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { formatAmount } = useCurrency();
  const { data: stats, isLoading } = useIncomeStats(period);

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />;
  if (!stats) return null;

  const maxClientTotal = stats.topClients[0]?.total ?? 1;
  const { chartData } = stats;
  const maxServiceCount = stats.topServices[0]?.count ?? 1;

  return (
    <ThemedSection>
      <ThemedText variant="sectionTitle">{t('incomes.stats.title')}</ThemedText>

      {chartData && chartData.length > 0 && (
        <>
          <ThemedText variant="caption" tone="tertiary" style={styles.chartTitle}>{t('incomes.stats.evolution')}</ThemedText>
          <IncomeChart data={chartData} />
        </>
      )}

      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        <View style={styles.statCell}>
          <ThemedText tone="tertiary" style={styles.statLabel}>{t('incomes.stats.total')}</ThemedText>
          <ThemedText tone="primary" style={styles.statValue}>{formatAmount(stats.total)}</ThemedText>
        </View>
        <View style={[styles.statCell, styles.statCellBorder, { borderLeftColor: colors.border }]}>
          <ThemedText tone="tertiary" style={styles.statLabel}>{t('incomes.stats.count')}</ThemedText>
          <ThemedText tone="primary" style={styles.statValue}>{stats.count}</ThemedText>
        </View>
        <View style={[styles.statCell, styles.statCellBorder, { borderLeftColor: colors.border }]}>
          <ThemedText tone="tertiary" style={styles.statLabel}>{t('incomes.stats.avg')}</ThemedText>
          <ThemedText tone="primary" style={styles.statValue}>{formatAmount(stats.avg)}</ThemedText>
        </View>
      </View>

      {stats.topClients.length > 0 && (
        <View style={styles.rankBlock}>
          <ThemedText variant="caption" tone="secondary" style={styles.rankTitle}>{t('incomes.stats.topClients')}</ThemedText>
          {stats.topClients.map((c) => (
            <View key={c.name} style={styles.rankRow}>
              <ThemedText variant="caption" style={styles.rankName} numberOfLines={1}>{c.name}</ThemedText>
              <StatBar value={c.total} max={maxClientTotal} color={colors.primary} />
              <ThemedText variant="caption" tone="primary" style={styles.rankValue}>{formatAmount(c.total)}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {stats.topServices.length > 0 && (
        <View style={styles.rankBlock}>
          <ThemedText variant="caption" tone="secondary" style={styles.rankTitle}>{t('incomes.stats.topServices')}</ThemedText>
          {stats.topServices.map((s) => (
            <View key={s.name} style={styles.rankRow}>
              <ThemedText variant="caption" style={styles.rankName} numberOfLines={1}>{s.name}</ThemedText>
              <StatBar value={s.count} max={maxServiceCount} color={colors.statusCompleted} />
              <ThemedText variant="caption" tone="secondary" style={styles.rankValue}>×{s.count}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </ThemedSection>
  );
}

function IncomeRow({ income, onDelete }: { income: IncomeWithRelations; onDelete: () => void }) {
  const { colors } = useTheme();
  const { formatAmount } = useCurrency();
  const clientName = income.appointment?.client?.name ?? '—';
  const serviceNames = (income.appointment?.appointment_services ?? [])
    .map((as) => as.service?.name)
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.rowAccent, { backgroundColor: colors.statusCompleted }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <ThemedText variant="subtitle" style={styles.rowClient} numberOfLines={1}>{clientName}</ThemedText>
          <ThemedText tone="primary" style={styles.rowAmount}>{formatAmount(Number(income.amount))}</ThemedText>
        </View>
        {serviceNames ? (
          <ThemedText tone="secondary" variant="caption" numberOfLines={1}>{serviceNames}</ThemedText>
        ) : null}
        {income.notes ? (
          <ThemedText tone="tertiary" variant="caption" numberOfLines={1}>{income.notes}</ThemedText>
        ) : null}
        <ThemedText tone="tertiary" variant="caption">{formatDate(income.date)}</ThemedText>
      </View>
      <TouchableOpacity style={styles.rowDelete} onPress={onDelete} hitSlop={4}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

function groupByDate(incomes: IncomeWithRelations[]) {
  const groups: { date: string; items: IncomeWithRelations[] }[] = [];
  for (const income of incomes) {
    const last = groups[groups.length - 1];
    if (last && last.date === income.date) last.items.push(income);
    else groups.push({ date: income.date, items: [income] });
  }
  return groups;
}

const PERIODS: StatsPeriod[] = ['week', 'month', 'year', 'all'];

export default function IncomesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { data: incomes, isLoading } = useIncomes();
  const { data: summary } = useIncomeSummary();
  const deleteIncome = useDeleteIncome();
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('month');

  function handleDelete(income: IncomeWithRelations) {
    showConfirm({
      title: t('incomes.delete.title'),
      message: t('incomes.delete.message'),
      confirmLabel: t('incomes.delete.ok'),
      variant: 'danger',
      onConfirm: () => deleteIncome.mutate(income.id, { onSuccess: () => showToast(t('incomes.toast.deleted')) }),
    });
  }

  const groups = groupByDate(incomes ?? []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText variant="title">{t('incomes.title')}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <SummaryCard label={t('incomes.today')} amount={summary?.today ?? 0} />
          <SummaryCard label={t('incomes.week')} amount={summary?.week ?? 0} />
          <SummaryCard label={t('incomes.month')} amount={summary?.month ?? 0} />
        </View>

        {/* Period selector */}
        <View style={[styles.periodRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, statsPeriod === p && { backgroundColor: colors.primary }]}
              onPress={() => setStatsPeriod(p)}
              activeOpacity={0.8}
            >
              <ThemedText
                variant="caption"
                style={[styles.periodBtnText, { color: statsPeriod === p ? colors.onPrimary : colors.textSecondary }]}
              >
                {t(`incomes.stats.period.${p}`)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <StatsSection period={statsPeriod} />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={48} color={colors.textTertiary} />
            <ThemedText tone="tertiary" style={styles.emptyText}>{t('incomes.empty')}</ThemedText>
          </View>
        ) : (
          groups.map((group) => (
            <ThemedSection key={group.date}>
              <ThemedText variant="sectionTitle">{formatDate(group.date)}</ThemedText>
              {group.items.map((income) => (
                <IncomeRow key={income.id} income={income} onDelete={() => handleDelete(income)} />
              ))}
            </ThemedSection>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  loader: { marginTop: 40 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, gap: 4, alignItems: 'center',
  },
  summaryLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 18 },
  periodRow: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1,
    overflow: 'hidden',
  },
  periodBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  periodBtnText: { fontSize: 12, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12, marginBottom: 12,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statCellBorder: { borderLeftWidth: StyleSheet.hairlineWidth },
  statLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  rankBlock: { gap: 8, marginTop: 4 },
  rankTitle: { textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankName: { width: 100, flexShrink: 0 },
  rankValue: { width: 64, textAlign: 'right', flexShrink: 0 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.12)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  chart: { marginTop: 4, marginBottom: 16 },
  chartTitle: { textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, fontSize: 11 },
  chartLabel: { flex: 1, textAlign: 'center', fontSize: 10 },
  chartMax: { fontSize: 10, textAlign: 'right', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  row: {
    flexDirection: 'row', borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', alignItems: 'stretch',
  },
  rowAccent: { width: 4 },
  rowBody: { flex: 1, padding: 12, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowClient: { flex: 1, marginRight: 8 },
  rowAmount: { fontWeight: '700', fontSize: 16 },
  rowDelete: {
    width: 48, alignItems: 'center', justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'transparent',
  },
});

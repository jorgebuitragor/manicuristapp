import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import { useI18n } from '@/context/I18nContext';
import { toLocalISODate, todayLocalISODate, startOfWeekLocalISODate, fromLocalISODate, capitalize } from '@/lib/dates';
import type { Income } from '@/types/models';
import type { TablesInsert } from '@/types/database.types';

export const INCOMES_KEY = ['incomes'] as const;

const INCOME_WITH_RELATIONS = `
  *,
  appointment:appointments(
    id,
    start_time,
    client:clients(name),
    appointment_services(service:services(name))
  )
` as const;

export type IncomeWithRelations = Income & {
  appointment: {
    id: string;
    start_time: string;
    client: { name: string } | null;
    appointment_services: Array<{ service: { name: string } | null }>;
  } | null;
};

export function useIncomes() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...INCOMES_KEY, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('incomes')
        .select(INCOME_WITH_RELATIONS)
        .eq('organization_id', organizationId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as IncomeWithRelations[];
    },
    enabled: !!organizationId,
  });
}

export function useIncomeByAppointment(appointmentId: string | null | undefined) {
  return useQuery({
    queryKey: [...INCOMES_KEY, 'appointment', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('appointment_id', appointmentId!)
        .maybeSingle();
      if (error) throw error;
      return data as Income | null;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<'incomes'>, 'organization_id'>) => {
      const { data, error } = await supabase
        .from('incomes')
        .insert({ date: todayLocalISODate(), ...payload, organization_id: organizationId })
        .select()
        .single();
      if (error) throw error;
      return data as Income;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INCOMES_KEY }),
  });
}

export function useUpdateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes: string | null }) => {
      const { error } = await supabase.from('incomes').update({ amount, notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INCOMES_KEY }),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INCOMES_KEY }),
  });
}

export type StatsPeriod = 'week' | 'month' | 'year' | 'all';

export function useIncomeStats(period: StatsPeriod) {
  const { organizationId } = useOrganization();
  const { t, locale } = useI18n();
  return useQuery({
    // locale en la key: las etiquetas del gráfico dependen del idioma
    queryKey: [...INCOMES_KEY, 'stats', period, organizationId, locale],
    queryFn: async () => {
      const now = new Date();
      let fromDate: string | null = null;

      if (period === 'week') {
        fromDate = startOfWeekLocalISODate(now);
      } else if (period === 'month') {
        fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      } else if (period === 'year') {
        fromDate = `${now.getFullYear()}-01-01`;
      }

      let query = supabase
        .from('incomes')
        .select(INCOME_WITH_RELATIONS)
        .eq('organization_id', organizationId!)
        .order('date', { ascending: false });
      if (fromDate) query = query.gte('date', fromDate);

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as IncomeWithRelations[];

      const total = rows.reduce((s, r) => s + Number(r.amount), 0);
      const count = rows.length;
      const avg = count > 0 ? total / count : 0;

      const clientTotals: Record<string, { name: string; total: number; count: number }> = {};
      const serviceTotals: Record<string, { name: string; total: number; count: number }> = {};

      for (const row of rows) {
        const clientName = row.appointment?.client?.name ?? '—';
        if (!clientTotals[clientName]) clientTotals[clientName] = { name: clientName, total: 0, count: 0 };
        clientTotals[clientName].total += Number(row.amount);
        clientTotals[clientName].count += 1;

        for (const as of row.appointment?.appointment_services ?? []) {
          const sName = as.service?.name ?? '—';
          if (!serviceTotals[sName]) serviceTotals[sName] = { name: sName, total: 0, count: 0 };
          serviceTotals[sName].total += Number(row.amount);
          serviceTotals[sName].count += 1;
        }
      }

      const topClients = Object.values(clientTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      const topServices = Object.values(serviceTotals)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      type ChartBar = { label: string; amount: number };
      let chartData: ChartBar[] = [];
      const weekdayLabel = (d: Date) => capitalize(d.toLocaleDateString(locale, { weekday: 'short' }).replace('.', ''));
      const monthLabel = (d: Date) => capitalize(d.toLocaleDateString(locale, { month: 'short' }).replace('.', ''));

      if (period === 'week' && fromDate) {
        chartData = Array.from({ length: 7 }, (_, i) => {
          const d = fromLocalISODate(fromDate!);
          d.setDate(d.getDate() + i);
          const dateStr = toLocalISODate(d);
          const amount = rows.filter((r) => r.date === dateStr).reduce((s, r) => s + Number(r.amount), 0);
          return { label: weekdayLabel(d), amount };
        });
      } else if (period === 'month' && fromDate) {
        const weekAmounts: Record<number, number> = {};
        for (const row of rows) {
          const day = parseInt(row.date.slice(8), 10);
          const weekIdx = Math.min(3, Math.floor((day - 1) / 7));
          weekAmounts[weekIdx] = (weekAmounts[weekIdx] ?? 0) + Number(row.amount);
        }
        chartData = [0, 1, 2, 3].map((i) => ({ label: `${t('incomes.chart.weekPrefix')}${i + 1}`, amount: weekAmounts[i] ?? 0 }));
      } else if (period === 'year') {
        const monthAmounts = new Array(12).fill(0);
        for (const row of rows) {
          const month = new Date(`${row.date}T12:00:00`).getMonth();
          monthAmounts[month] += Number(row.amount);
        }
        chartData = monthAmounts.map((amount, i) => ({ label: monthLabel(new Date(now.getFullYear(), i, 15)), amount }));
      } else {
        const monthMap: Record<string, number> = {};
        for (const row of rows) {
          const d = new Date(`${row.date}T12:00:00`);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          monthMap[key] = (monthMap[key] ?? 0) + Number(row.amount);
        }
        const nowAll = new Date();
        chartData = Array.from({ length: 12 }, (_, i) => {
          // Día 1: con setMonth sobre un día 31 los meses cortos se desbordaban
          const d = new Date(nowAll.getFullYear(), nowAll.getMonth() - (11 - i), 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          return { label: monthLabel(d), amount: monthMap[key] ?? 0 };
        });
      }

      return { total, count, avg, topClients, topServices, chartData };
    },
    enabled: !!organizationId,
  });
}

export function useIncomeSummary() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...INCOMES_KEY, 'summary', organizationId],
    queryFn: async () => {
      const now = new Date();
      const todayStr = toLocalISODate(now);
      const weekStartStr = startOfWeekLocalISODate(now);

      const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('incomes')
        .select('amount, date')
        .eq('organization_id', organizationId!)
        .gte('date', monthStartStr);
      if (error) throw error;

      const rows = (data ?? []) as { amount: number; date: string }[];

      let today = 0;
      let week = 0;
      let month = 0;

      for (const row of rows) {
        const amount = Number(row.amount);
        month += amount;
        if (row.date >= weekStartStr) week += amount;
        if (row.date === todayStr) today += amount;
      }

      return { today, week, month };
    },
    enabled: !!organizationId,
  });
}

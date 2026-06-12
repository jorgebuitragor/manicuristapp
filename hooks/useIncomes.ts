import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Income, TablesInsert } from '@/types/database.types';

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
  return useQuery({
    queryKey: INCOMES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incomes')
        .select(INCOME_WITH_RELATIONS)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as IncomeWithRelations[];
    },
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
  return useMutation({
    mutationFn: async (payload: TablesInsert<'incomes'>) => {
      const { data, error } = await supabase
        .from('incomes')
        .insert(payload)
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
  return useQuery({
    queryKey: [...INCOMES_KEY, 'stats', period],
    queryFn: async () => {
      const now = new Date();
      let fromDate: string | null = null;

      if (period === 'week') {
        const d = new Date(now);
        d.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        fromDate = d.toISOString().slice(0, 10);
      } else if (period === 'month') {
        fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      } else if (period === 'year') {
        fromDate = `${now.getFullYear()}-01-01`;
      }

      let query = supabase
        .from('incomes')
        .select(INCOME_WITH_RELATIONS)
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

      return { total, count, avg, topClients, topServices };
    },
  });
}

export function useIncomeSummary() {
  return useQuery({
    queryKey: [...INCOMES_KEY, 'summary'],
    queryFn: async () => {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      const weekStartStr = weekStart.toISOString().slice(0, 10);

      const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('incomes')
        .select('amount, date')
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
  });
}

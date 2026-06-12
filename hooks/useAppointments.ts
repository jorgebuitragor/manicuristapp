import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentWithRelations } from '@/types/database.types';

export const APPOINTMENTS_KEY = ['appointments'] as const;

const APPOINTMENT_WITH_RELATIONS = `
  *,
  client:clients(*),
  appointment_services(service_id, service:services(id, name, price)),
  appointment_polishes(nail_polish_id, nail_polish:nail_polishes(id, color_name, brand, hex_color, polish_code))
` as const;

function mapAppointmentRelations(raw: any): AppointmentWithRelations {
  const fromLinks = Array.isArray(raw?.appointment_services)
    ? raw.appointment_services
        .map((item: any) => item?.service)
        .filter(Boolean)
    : [];

  const services = fromLinks.length > 0
    ? fromLinks
    : raw?.service
      ? [raw.service]
      : [];

  const polishes = Array.isArray(raw?.appointment_polishes)
    ? raw.appointment_polishes.map((item: any) => item?.nail_polish).filter(Boolean)
    : [];

  return {
    ...raw,
    services,
    polishes,
  } as AppointmentWithRelations;
}

function localDayBounds(date: string) {
  return {
    start: new Date(`${date}T00:00:00`).toISOString(),
    end: new Date(`${date}T23:59:59`).toISOString(),
  };
}

export function useAppointmentsByDate(date: string) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'date', date],
    queryFn: async () => {
      const { start, end } = localDayBounds(date);
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_WITH_RELATIONS)
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time');
      if (error) throw error;
      return (data ?? []).map(mapAppointmentRelations);
    },
  });
}

export function useAppointmentsByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'range', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_WITH_RELATIONS)
        .gte('start_time', new Date(`${startDate}T00:00:00`).toISOString())
        .lte('start_time', new Date(`${endDate}T23:59:59`).toISOString())
        .order('start_time');
      if (error) throw error;
      return (data ?? []).map(mapAppointmentRelations);
    },
  });
}

export function useAppointmentsByClient(clientId: string) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_WITH_RELATIONS)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapAppointmentRelations);
    },
    enabled: !!clientId,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_WITH_RELATIONS)
        .eq('id', id)
        .single();
      if (error) throw error;
      return mapAppointmentRelations(data);
    },
    enabled: !!id,
  });
}

export async function findConflictingAppointments(startIso: string, endIso: string, excludeId?: string) {
  let query = supabase
    .from('appointments')
    .select('id, start_time, end_time, client:clients(name)')
    .lt('start_time', endIso)
    .gt('end_time', startIso)
    .neq('status', 'cancelled');

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; start_time: string; end_time: string; client: { name: string } | null }>;
}

type AppointmentInput = {
  client_id: string;
  professional_id?: string | null;
  service_ids?: string[];
  start_time: string;
  end_time: string;
  notes?: string | null;
  status?: 'pending' | 'completed' | 'cancelled';
};

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ service_ids, ...input }: AppointmentInput) => {
      const primaryServiceId = service_ids?.[0] ?? null;
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...input, service_id: primaryServiceId, status: input.status ?? 'pending' })
        .select()
        .single();
      if (error) throw error;

      if (service_ids && service_ids.length > 0) {
        const links = service_ids.map((service_id) => ({
          appointment_id: (data as Appointment).id,
          service_id,
        }));
        const { error: linkError } = await supabase.from('appointment_services').insert(links);
        if (linkError) throw linkError;
      }

      return data as Appointment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'completed' | 'cancelled' }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: [...APPOINTMENTS_KEY, id] });
      const previous = qc.getQueryData<AppointmentWithRelations>([...APPOINTMENTS_KEY, id]);
      qc.setQueryData([...APPOINTMENTS_KEY, id], (old: AppointmentWithRelations | undefined) =>
        old ? { ...old, status } : old
      );
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData([...APPOINTMENTS_KEY, id], context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, start_time, end_time }: { id: string; start_time: string; end_time: string }) => {
      const { error } = await supabase.from('appointments').update({ start_time, end_time }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, start_time, end_time }) => {
      await qc.cancelQueries({ queryKey: [...APPOINTMENTS_KEY, id] });
      const previous = qc.getQueryData<AppointmentWithRelations>([...APPOINTMENTS_KEY, id]);
      qc.setQueryData([...APPOINTMENTS_KEY, id], (old: AppointmentWithRelations | undefined) =>
        old ? { ...old, start_time, end_time } : old
      );
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData([...APPOINTMENTS_KEY, id], context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useAddPolishToAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointment_id, nail_polish_id }: { appointment_id: string; nail_polish_id: string }) => {
      const { error } = await supabase
        .from('appointment_polishes')
        .upsert({ appointment_id, nail_polish_id }, { onConflict: 'appointment_id,nail_polish_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useRemovePolishFromAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointment_id, nail_polish_id }: { appointment_id: string; nail_polish_id: string }) => {
      const { error } = await supabase
        .from('appointment_polishes')
        .delete()
        .eq('appointment_id', appointment_id)
        .eq('nail_polish_id', nail_polish_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
  });
}

export function useSearchAppointments(query: string) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_WITH_RELATIONS)
        .order('start_time', { ascending: false })
        .limit(100);
      if (error) throw error;
      const all = (data ?? []).map(mapAppointmentRelations);
      if (!query.trim()) return all;
      const q = query.toLowerCase();
      return all.filter(
        (apt) =>
          apt.client?.name?.toLowerCase().includes(q) ||
          apt.services.some((s) => s.name?.toLowerCase().includes(q))
      );
    },
    enabled: query.length > 1,
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { NailRack } from '@/types/database.types';

export const NAIL_RACKS_KEY = ['nail-racks'] as const;

export function useNailRacks() {
  return useQuery({
    queryKey: NAIL_RACKS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nail_racks')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as NailRack[];
    },
  });
}

export function useCreateNailRack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, max_capacity }: { name: string; max_capacity?: number | null }) => {
      const trimmed = name.trim();
      const { data: existing, error: selectError } = await supabase
        .from('nail_racks')
        .select('*')
        .ilike('name', trimmed)
        .maybeSingle();
      if (selectError) throw selectError;
      if (existing) return existing as NailRack;
      const { data, error } = await supabase
        .from('nail_racks')
        .insert({ name: trimmed, max_capacity: max_capacity ?? null })
        .select('*')
        .single();
      if (error) throw error;
      return data as NailRack;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NAIL_RACKS_KEY }),
  });
}

export function useUpdateNailRack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, max_capacity }: { id: string; name: string; max_capacity?: number | null }) => {
      const { data, error } = await supabase
        .from('nail_racks')
        .update({ name: name.trim(), max_capacity: max_capacity ?? null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as NailRack;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NAIL_RACKS_KEY }),
  });
}

export function useDeleteNailRack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nail_racks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NAIL_RACKS_KEY }),
  });
}

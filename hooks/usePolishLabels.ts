import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PolishBaseColor, PolishToneFamily } from '@/types/database.types';

export const BASE_COLORS_KEY = ['polish-base-colors'] as const;
export const TONE_FAMILIES_KEY = ['polish-tone-families'] as const;

export function usePolishBaseColors() {
  return useQuery({
    queryKey: BASE_COLORS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polish_base_colors')
        .select('*')
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data as PolishBaseColor[];
    },
  });
}

export function usePolishToneFamilies() {
  return useQuery({
    queryKey: TONE_FAMILIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polish_tone_families')
        .select('*')
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data as PolishToneFamily[];
    },
  });
}

export function useCreatePolishBaseColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, label, sort_order }: { key: string; label: string; sort_order: number }) => {
      const { data, error } = await supabase
        .from('polish_base_colors')
        .insert({ key, label, sort_order })
        .select()
        .single();
      if (error) throw error;
      return data as PolishBaseColor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_COLORS_KEY }),
  });
}

export function useDeletePolishBaseColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('polish_base_colors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_COLORS_KEY }),
  });
}

export function useCreatePolishToneFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, label, sort_order }: { key: string; label: string; sort_order: number }) => {
      const { data, error } = await supabase
        .from('polish_tone_families')
        .insert({ key, label, sort_order })
        .select()
        .single();
      if (error) throw error;
      return data as PolishToneFamily;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TONE_FAMILIES_KEY }),
  });
}

export function useDeletePolishToneFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('polish_tone_families').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TONE_FAMILIES_KEY }),
  });
}

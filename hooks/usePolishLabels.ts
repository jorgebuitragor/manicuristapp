import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import type { PolishBaseColor, PolishToneFamily } from '@/types/database.types';

export const BASE_COLORS_KEY = ['polish-base-colors'] as const;
export const TONE_FAMILIES_KEY = ['polish-tone-families'] as const;

export function usePolishBaseColors() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...BASE_COLORS_KEY, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('polish_base_colors')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data as PolishBaseColor[];
    },
    enabled: !!organizationId,
  });
}

export function usePolishToneFamilies() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...TONE_FAMILIES_KEY, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('polish_tone_families')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data as PolishToneFamily[];
    },
    enabled: !!organizationId,
  });
}

export function useCreatePolishBaseColor() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  return useMutation({
    mutationFn: async ({ key, label, sort_order, hex_color }: { key: string; label: string; sort_order: number; hex_color?: string | null }) => {
      const { data, error } = await supabase
        .from('polish_base_colors')
        .insert({ key, label, sort_order, hex_color: hex_color ?? null, organization_id: organizationId })
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
  const { organizationId } = useOrganization();
  return useMutation({
    mutationFn: async ({ key, label, sort_order }: { key: string; label: string; sort_order: number }) => {
      const { data, error } = await supabase
        .from('polish_tone_families')
        .insert({ key, label, sort_order, organization_id: organizationId })
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

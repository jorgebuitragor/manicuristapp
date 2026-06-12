import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { NailPolish } from '@/types/database.types';

export const POLISHES_KEY = ['polishes'] as const;

export function usePolishes() {
  return useQuery({
    queryKey: POLISHES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nail_polishes')
        .select('*')
        .order('brand')
        .order('color_name');
      if (error) throw error;
      return data as NailPolish[];
    },
  });
}

export function useCreatePolish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<NailPolish, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('nail_polishes').insert(input).select().single();
      if (error) throw error;
      return data as NailPolish;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POLISHES_KEY }),
  });
}

export function useUpdatePolish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<NailPolish> & { id: string }) => {
      const { data, error } = await supabase.from('nail_polishes').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data as NailPolish;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POLISHES_KEY }),
  });
}

export function useDeletePolish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nail_polishes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POLISHES_KEY }),
  });
}

export function usePolish(id: string | undefined) {
  return useQuery({
    queryKey: [...POLISHES_KEY, id] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nail_polishes')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as NailPolish;
    },
    enabled: Boolean(id),
  });
}

export function useMovePolish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      polishId,
      targetPosition,
      rackId,
      occupantId,
      occupantCurrentPosition,
    }: {
      polishId: string;
      targetPosition: number | null;
      rackId: string | null;
      occupantId?: string;
      occupantCurrentPosition?: number | null;
    }) => {
      if (occupantId) {
        // Swap: clear occupant's position first to avoid unique constraint conflict
        const { error: clearErr } = await supabase
          .from('nail_polishes')
          .update({ rack_position: null })
          .eq('id', occupantId);
        if (clearErr) throw clearErr;

        // Move target polish to new position
        const { error: moveErr } = await supabase
          .from('nail_polishes')
          .update({ rack_position: targetPosition, rack_id: rackId })
          .eq('id', polishId);
        if (moveErr) throw moveErr;

        // Give occupant the previous position of the moved polish
        const { error: swapErr } = await supabase
          .from('nail_polishes')
          .update({ rack_position: occupantCurrentPosition ?? null })
          .eq('id', occupantId);
        if (swapErr) throw swapErr;
      } else {
        const { error } = await supabase
          .from('nail_polishes')
          .update({ rack_position: targetPosition, rack_id: rackId })
          .eq('id', polishId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POLISHES_KEY }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import type { NailPolish } from '@/types/database.types';

export const POLISHES_KEY = ['polishes'] as const;

export function usePolishes() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...POLISHES_KEY, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('nail_polishes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('brand')
        .order('color_name');
      if (error) throw error;
      return data as NailPolish[];
    },
    enabled: !!organizationId,
  });
}

export function useCreatePolish() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  return useMutation({
    mutationFn: async (input: Omit<NailPolish, 'id' | 'created_at' | 'organization_id'>) => {
      const { data, error } = await supabase
        .from('nail_polishes')
        .insert({ ...input, organization_id: organizationId })
        .select()
        .single();
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
  const qc = useQueryClient();
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
    initialData: () => qc.getQueryData<NailPolish[]>(POLISHES_KEY)?.find((p) => p.id === id),
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
      occupantRackId,
    }: {
      polishId: string;
      targetPosition: number | null;
      rackId: string | null;
      occupantId?: string;
      occupantCurrentPosition?: number | null;
      occupantRackId?: string | null;
    }) => {
      if (occupantId) {
        const isSwap = occupantCurrentPosition !== undefined;

        if (isSwap) {
          const { error: clearErr } = await supabase
            .from('nail_polishes')
            .update({ rack_position: null })
            .eq('id', occupantId);
          if (clearErr) throw clearErr;
        }

        const { error: moveErr } = await supabase
          .from('nail_polishes')
          .update({ rack_position: targetPosition, rack_id: rackId })
          .eq('id', polishId);
        if (moveErr) throw moveErr;

        if (isSwap) {
          const { error: swapErr } = await supabase
            .from('nail_polishes')
            .update({ rack_position: occupantCurrentPosition!, rack_id: occupantRackId ?? rackId })
            .eq('id', occupantId);
          if (swapErr) throw swapErr;
        } else {
          const { error: displaceErr } = await supabase
            .from('nail_polishes')
            .update({ rack_position: null })
            .eq('id', occupantId);
          if (displaceErr) throw displaceErr;
        }
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import type { Client } from '@/types/database.types';

export const CLIENTS_KEY = ['clients'] as const;

export function useClients() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...CLIENTS_KEY, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!organizationId,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  return useMutation({
    mutationFn: async (input: { name: string; phone?: string; notes?: string; allergies?: string; birthday?: string | null }) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...input, organization_id: organizationId })
        .select()
        .single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase.from('clients').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY });
      qc.invalidateQueries({ queryKey: ['clients', data.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

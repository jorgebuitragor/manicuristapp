import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import type { Service, TablesInsert, TablesUpdate } from '@/types/database.types';

const SERVICES_KEY = ['services'];

export function useServices() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...SERVICES_KEY, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<'services'>, 'organization_id'>) => {
      const { data, error } = await supabase
        .from('services')
        .insert({ ...payload, organization_id: organizationId })
        .select()
        .single();
      if (error) throw error;
      return data as Service;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: TablesUpdate<'services'> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Service;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}

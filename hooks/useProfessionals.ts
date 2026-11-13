import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useOrganization } from '@/context/OrganizationContext';
import type { OrgType } from '@/types/models';

export const PROFESSIONALS_KEY = ['professionals'] as const;

/** Usuario actual + su perfil de profesional (nombre) en la organización. */
export function useCurrentProfessional() {
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: [...PROFESSIONALS_KEY, 'me', organizationId],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return { userId: user.id, email: user.email, professionalId: data?.id ?? null, name: data?.name ?? null };
    },
  });
}

/**
 * Onboarding: crea la organización (RPC atómica, que también siembra los
 * servicios por defecto) y el perfil de profesional del usuario actual.
 * Es seguro reintentarlo: la RPC devuelve la org existente si ya hay una.
 */
export function useCreateOrganization() {
  return useMutation({
    mutationFn: async (input: { orgName: string; orgType: OrgType; lang: string; professionalName: string }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('No user');

      const { data: orgId, error: rpcError } = await supabase.rpc('create_organization', {
        org_name: input.orgName,
        org_type: input.orgType,
        org_lang: input.lang,
      });
      if (rpcError) throw rpcError;

      // Si un intento anterior ya creó el perfil, no se duplica
      const { data: existing, error: selectError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (selectError) throw selectError;

      if (!existing) {
        const { error: profError } = await supabase.from('professionals').insert({
          name: input.professionalName,
          color: '#c084fc', // color por defecto del profesional en el calendario (dato, no estilo)
          user_id: user.id,
          organization_id: orgId,
        });
        if (profError) throw profError;
      }

      return orgId;
    },
  });
}

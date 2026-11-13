import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession, onSessionChange } from '@/lib/auth';
import type { Organization } from '@/types/models';

type OrgContextValue = {
  organization: Organization | null;
  organizationId: string | null;
  isLoading: boolean;
  refetch: () => void;
};

const OrganizationContext = createContext<OrgContextValue>({
  organization: null,
  organizationId: null,
  isLoading: true,
  refetch: () => {},
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrg = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setOrganization(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data } = await supabase
      .from('organization_members')
      .select('organizations(*)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    const org = (data?.organizations as Organization | null) ?? null;
    setOrganization(org);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getSession().then((session) => fetchOrg(session?.user?.id));
    return onSessionChange((session) => fetchOrg(session?.user?.id));
  }, [fetchOrg]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizationId: organization?.id ?? null,
        isLoading,
        refetch: () => {
          getSession().then((session) => fetchOrg(session?.user?.id));
        },
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}

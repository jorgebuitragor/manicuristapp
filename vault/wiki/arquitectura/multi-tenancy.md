---
tipo: concepto
tags: [arquitectura, seguridad, supabase, rls]
actualizado: 2026-11-13
fuentes:
  - supabase/migration.sql
  - context/OrganizationContext.tsx
  - hooks/
---

# Multi-tenancy

Aislamiento de datos por [[organizacion]] en **dos capas**: RLS en Postgres (la garantía real) y filtros explícitos en los hooks (eficiencia y claridad de cache).

## Capa BD (RLS)

- `get_my_org_id()` — `SECURITY DEFINER STABLE`; devuelve el `organization_id` del usuario actual desde `organization_members` (`LIMIT 1`).
- Tablas de datos (`clients, services, appointments, incomes, nail_polishes, nail_polish_brands, nail_racks, polish_base_colors, polish_tone_families, professionals`): política `org_all` → `USING/WITH CHECK (organization_id = get_my_org_id())`.
- Tablas puente (`appointment_services`, `appointment_polishes`): no tienen `organization_id`; la política comprueba con `EXISTS` que la cita padre sea de la org.
- `organizations`: select si es la tuya; insert/update solo si `owner_id = auth.uid()`.
- `organization_members`: select de tu org; insert solo de ti mismo (`user_id = auth.uid()`).
- Unicidad por org: `uq_brand_name_org`, `uq_rack_name_org`.

> [!warning] Huecos conocidos (detalle en [[discrepancias]]):
> - `polish_base_colors` / `polish_tone_families` siguen con `UNIQUE(key)` global.
> - Las políticas de **storage** solo comprueban el bucket, no la org: cualquier usuario autenticado puede subir/sobrescribir en `design-photos`, `polish-photos`, `service-photos`, y la lectura es pública.
> - `member_self_insert` permite a cualquier usuario insertarse en *cualquier* org si conoce su id (relevante para [[roadmap-salon-multi-profesional]]: el join debería ir solo por RPC).

## Capa cliente (hooks)

Patrón que siguen todos los hooks de lista:

```ts
const { organizationId } = useOrganization();
useQuery({
  queryKey: [...KEY, organizationId],         // cache separada por org
  queryFn: async () => {
    if (!organizationId) return [];
    return supabase.from('x').select('*').eq('organization_id', organizationId);
  },
  enabled: !!organizationId,
});
```

Y en los inserts: `.insert({ ...input, organization_id: organizationId })`.

Lecturas por id (`useClient`, `useAppointment`, `usePolish`) no filtran por org: confían en RLS.

## Relacionado

[[organizacion]] · [[esquema-bd]] · [[estado-servidor-y-offline]] · [[roadmap-salon-multi-profesional]]

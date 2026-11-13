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

- `get_my_org_id()` — `SECURITY DEFINER STABLE` con `search_path = public`; devuelve el `organization_id` del usuario actual desde `organization_members` (`LIMIT 1`).
- **Altas solo por RPC**: `organizations` y `organization_members` no tienen política INSERT. Se crean con `create_organization()` (y en el futuro `join_organization()`), ambas SECURITY DEFINER.
- Tablas de datos (`clients, services, appointments, incomes, nail_polishes, nail_polish_brands, nail_racks, polish_base_colors, polish_tone_families, professionals`): política `org_all` → `USING/WITH CHECK (organization_id = get_my_org_id())`.
- Tablas puente (`appointment_services`, `appointment_polishes`): no tienen `organization_id`; la política comprueba con `EXISTS` que la cita padre sea de la org.
- `organizations`: select si es la tuya; update solo el owner.
- `organization_members`: select de tu org.
- Unicidad por org: `uq_brand_name_org`, `uq_rack_name_org`, `uq_base_color_key_org`, `uq_tone_family_key_org`.
- **Storage**: políticas `org_photos_*` (select/insert/update/delete) exigen que la primera carpeta de la ruta sea `get_my_org_id()` → [[fotos-y-storage]].

Verificado el 2026-11-13 con un Postgres local y dos usuarios simulados: nadie puede unirse a una org ajena, ni ver, escribir o borrar fotos de otra org, y dos orgs pueden tener la misma etiqueta.

> [!warning] Pendiente:
> - Los buckets siguen siendo **públicos**: quien tenga una URL puede ver la foto (las rutas llevan UUID, no son adivinables).
> - RLS no distingue `owner` de `member` dentro de la org → [[roadmap-salon-multi-profesional]].
> - Los cambios están en `migration.sql` pero hay que **ejecutarlos en Supabase** → [[discrepancias]].

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

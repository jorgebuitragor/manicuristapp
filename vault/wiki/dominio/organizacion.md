---
tipo: entidad
tags: [dominio, multi-tenancy, auth]
actualizado: 2026-11-13
fuentes:
  - supabase/migration.sql
  - context/OrganizationContext.tsx
  - app/onboarding.tsx
  - types/database.types.ts
---

# Organización (tenant), miembros y profesionales

La **organización** es la raíz de todos los datos. Un usuario de Supabase Auth pertenece a una organización mediante `organization_members`, y tiene un perfil de **profesional** dentro de ella.

## Tablas

| Tabla | Columnas clave | Notas |
| --- | --- | --- |
| `organizations` | `id, name, type, owner_id, created_at` | `type ∈ {'home_studio','salon'}` |
| `organization_members` | `organization_id, user_id, role` | PK compuesta; `role ∈ {'owner','member'}` |
| `professionals` | `id, name, color, user_id, organization_id` | `color` HEX para el calendario (default `#c084fc`) |

> [!warning] `CLAUDE.md` raíz lista `professionals.email`, pero esa columna no existe en la migración ni en los tipos. Ver [[discrepancias]].

## Ciclo de vida

1. Registro email/password (o Google) → sin organización.
2. `AuthGuard` (`app/_layout.tsx`) detecta `session && !organizationId` → redirige a `/onboarding`.
3. Onboarding en 2 pasos: tipo (Home Studio / Salón) → nombre del estudio + nombre propio.
4. `rpc('create_organization', { org_name, org_type })` crea org + membresía `owner` de forma atómica (SECURITY DEFINER) y devuelve el `id`.
5. Insert en `professionals` con `user_id` y `organization_id`.
6. `useOrganization().refetch()` → `AuthGuard` redirige a `/(tabs)`.

> [!warning] La función `create_organization` **no está definida** en `supabase/migration.sql`; existe solo en la BD remota. Ver [[discrepancias]].

## En el cliente

- `OrganizationProvider` (`context/OrganizationContext.tsx`) consulta `organization_members → organizations(*)` con `limit(1)` al iniciar y en cada `onAuthStateChange`.
- `useOrganization()` expone `{ organization, organizationId, isLoading, refetch }`.
- Todos los hooks de datos usan `organizationId` en `queryKey`, filtros y inserts → [[multi-tenancy]].

## Limitaciones actuales

- **Una org por usuario** (`LIMIT 1` en `get_my_org_id()` y en el contexto).
- Un salón solo puede tener al owner: no hay forma de unirse → [[roadmap-salon-multi-profesional]].
- `appointments.professional_id` existe (nullable) pero el formulario de nueva cita no lo asigna hoy.

> [!question] ¿Se asigna `professional_id` en algún flujo? `app/appointments/new.tsx` no lo envía; verificar antes de implementar filtros por profesional.

## Relacionado

[[multi-tenancy]] · [[navegacion-y-auth]] · [[roadmap-salon-multi-profesional]] · [[esquema-bd]]

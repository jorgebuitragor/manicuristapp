---
tipo: concepto
tags: [arquitectura, supabase, base-de-datos]
actualizado: 2026-11-13
fuentes:
  - supabase/migration.sql
  - types/database.types.ts
---

# Esquema de base de datos

Postgres en Supabase. El archivo `supabase/migration.sql` es **un único script acumulativo** que se ejecuta a mano en el SQL Editor; no hay carpeta de migraciones versionadas ni CLI de Supabase en el repo.

**Regla para cambios de esquema:** añadir al final una sección nueva, con fecha e idempotente (`IF NOT EXISTS`, `DROP … IF EXISTS` antes de `CREATE POLICY`), y ejecutar solo esa sección. Las secciones antiguas no se pueden re-ejecutar enteras (`CREATE POLICY` sin guarda). Nunca crear objetos solo desde el dashboard.

**Cómo probar una migración en local:** hay un Postgres 16 disponible en el contenedor. El 2026-11-13 se probó así: cluster temporal con `initdb`, simulaciones mínimas de `auth` (`auth.users`, `auth.uid()` leyendo `request.jwt.claim.sub`) y `storage` (`buckets`, `objects` con RLS, `foldername()`), roles `anon`/`authenticated`, y después `SET ROLE authenticated` + `set_config('request.jwt.claim.sub', …)` para comprobar las políticas como cada usuario.

Los tipos viven en `types/database.types.ts` (exporta `Tables<>`, `TablesInsert<>`, `TablesUpdate<>` y alias como `Client`, `AppointmentWithRelations`).

## Tablas

| Tabla | Página | Relaciones |
| --- | --- | --- |
| `organizations` | [[organizacion]] | `owner_id → auth.users` |
| `organization_members` | [[organizacion]] | `→ organizations`, `→ auth.users` |
| `professionals` | [[organizacion]] | `→ organizations`, `user_id → auth.users` |
| `clients` | [[cliente]] | `→ organizations` |
| `services` | [[servicio]] | `→ organizations` |
| `appointments` | [[cita]] | `→ clients (CASCADE)`, `→ professionals (RESTRICT)`, `→ services (SET NULL)` |
| `appointment_services` | [[cita]] | puente cita ↔ servicio (CASCADE ambos lados) |
| `appointment_polishes` | [[cita]] | puente cita ↔ esmalte (CASCADE ambos lados) |
| `incomes` | [[ingreso]] | `appointment_id UNIQUE → appointments (SET NULL)` |
| `nail_polishes` | [[esmalte]] | `→ nail_polish_brands (SET NULL)`, `→ nail_racks (SET NULL)` |
| `nail_polish_brands` | [[esmalte]] | |
| `nail_racks` | [[esmaltero]] | |
| `polish_base_colors` | [[esmalte]] | |
| `polish_tone_families` | [[esmalte]] | |

Todas las de datos tienen `organization_id → organizations ON DELETE CASCADE` → [[multi-tenancy]].

## Funciones

| Función | Definida en migración | Uso |
| --- | --- | --- |
| `get_my_org_id()` | Sí | Políticas RLS |
| `create_organization(org_name, org_type, org_lang = 'es')` | Sí | Onboarding (`app/onboarding.tsx`); única vía para crear org + membresía + servicios por defecto |
| `seed_default_services(org_id, lang)` | Sí | Interna (sin permiso de ejecución para `anon`/`authenticated`); la llama `create_organization` |

## Storage (buckets públicos)

`design-photos`, `polish-photos`, `service-photos` → [[fotos-y-storage]].

## Realtime

`appointments` está en la publicación `supabase_realtime`; el calendario se suscribe → [[cita]].

## Cómo regenerar tipos

```bash
npx supabase gen types typescript --project-id <id> > types/database.types.ts
```

> [!warning] `database.types.ts` mezcla código generado con alias escritos a mano al final (`Client`, `AppointmentWithRelations`…); regenerarlo los borra. `Functions` ya declara las dos RPC. Ver [[discrepancias]].

## Relacionado

[[multi-tenancy]] · [[discrepancias]] · [[overview]]

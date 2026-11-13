---
tipo: entidad
tags: [dominio, servicios]
actualizado: 2026-11-13
fuentes:
  - hooks/useServices.ts
  - app/settings/services.tsx
  - supabase/migration.sql
---

# Servicio

Catálogo de trabajos que ofrece la organización (manicura, semipermanente, nail art…). Se gestiona en **Ajustes → Servicios** (`app/settings/services.tsx`).

## Tabla `services`

| Columna | Notas |
| --- | --- |
| `name` | requerido |
| `duration` | minutos, default 60 — se usa para calcular `end_time` de la cita |
| `price` | `numeric(10,2)`, nullable — sugiere el monto del [[ingreso]] |
| `photo_url` | bucket `service-photos` → [[fotos-y-storage]] |
| `organization_id` | [[multi-tenancy]] |

> [!warning] `CLAUDE.md` raíz llama a la columna `default_duration_min`; el nombre real es `duration`. Ver [[discrepancias]].

> [!question] La migración incluye un *seed* de 8 servicios **sin** `organization_id` (anterior al multi-tenant). Con RLS por org esas filas no son visibles para nadie. ¿Las nuevas orgs arrancan sin servicios?

## Relación con citas

Muchos-a-muchos vía `appointment_services`. `appointments.service_id` es un campo legacy sincronizado con el primer servicio — ver [[cita]]. Borrar un servicio borra sus filas puente (`CASCADE`) y pone a `NULL` el `service_id` legacy.

## Hooks (`hooks/useServices.ts`)

`useServices`, `useCreateService`, `useUpdateService`, `useDeleteService` — key `['services', orgId]`.

## Relacionado

[[cita]] · [[ingreso]] (top servicios en estadísticas)

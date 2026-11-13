---
tipo: entidad
tags: [dominio, servicios]
actualizado: 2026-11-13
fuentes:
  - hooks/useServices.ts
  - app/settings/services.tsx
  - supabase/migration.sql
  - app/onboarding.tsx
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

## Servicios por defecto

Cada organización nueva arranca con 8 servicios, que crea `seed_default_services(org_id, lang)` dentro de `create_organization` (en la misma transacción):

| Español | Inglés | Min |
| --- | --- | --- |
| Manicura básica | Basic manicure | 30 |
| Semipermanente manos | Gel polish – hands | 60 |
| Semipermanente pies | Gel polish – feet | 60 |
| Nail Art (diseño simple) | Nail art (simple design) | 75 |
| Nail Art (diseño complejo) | Nail art (complex design) | 90 |
| Pedicura básica | Basic pedicure | 45 |
| Retirada de esmalte | Polish removal | 20 |
| Reconstrucción acrílico | Acrylic rebuild | 120 |

- **Idioma**: el onboarding pasa `org_lang` con el idioma activo de la app (`es` por defecto).
- **Sin precio** (`NULL`): el seed original tenía precios en euros, que no sirven con COP, MXN, etc. La usuaria los pone en Ajustes → Servicios.
- Se crean una sola vez: un reintento del onboarding no los duplica.
- Las orgs creadas **antes** de este cambio no reciben servicios automáticamente.

> [!note] Hasta 2026-11-13 el seed era un `INSERT` sin `organization_id` (anterior al multi-tenant): 8 filas invisibles bajo RLS, y las orgs nuevas arrancaban sin servicios. La migración las borra salvo que alguna cita las use.

## Relación con citas

Muchos-a-muchos vía `appointment_services`. `appointments.service_id` es un campo legacy sincronizado con el primer servicio — ver [[cita]]. Borrar un servicio borra sus filas puente (`CASCADE`) y pone a `NULL` el `service_id` legacy.

## Hooks (`hooks/useServices.ts`)

`useServices`, `useCreateService`, `useUpdateService`, `useDeleteService` — key `['services', orgId]`.

## Relacionado

[[cita]] · [[ingreso]] (top servicios en estadísticas)

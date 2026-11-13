---
tipo: pendiente
tags: [pendientes, discrepancias, calidad]
actualizado: 2026-11-13
fuentes:
  - supabase/migration.sql
  - types/database.types.ts
  - CLAUDE.md
  - app/onboarding.tsx
  - hooks/useGoogleCalendar.ts
---

# Discrepancias (código ↔ docs ↔ BD)

Contradicciones verificables. Cuando se resuelva una, marcarla `[x]` con fecha y commit (no borrarla) y anotarlo en [[log]].

## Esquema: `migration.sql` no refleja la BD real

Recrear la BD desde `supabase/migration.sql` produciría una app rota:

- [ ] **RPC `create_organization(org_name, org_type)`** — la usa `app/onboarding.tsx:59`, no está definida en la migración. Sin ella nadie puede completar el onboarding.
- [ ] **`clients.birthday`** (`date`) — en tipos y en el código ([[cliente]]), no en la migración.
- [ ] **`appointments.google_event_id`** (`text`) — en tipos y en `hooks/useGoogleCalendar.ts`, no en la migración ([[google-calendar]]).

> [!question] ¿Hay más objetos creados a mano en el dashboard de Supabase? Conviene comparar con `supabase db dump --schema public` de la BD real.

## Esquema: problemas de multi-tenancy

- [ ] **`polish_base_colors.key` y `polish_tone_families.key` son `UNIQUE` globales** — se crearon antes del multi-tenant y no se migraron a `(key, organization_id)` como sí se hizo con marcas y esmalteros. Una segunda org que cree la misma etiqueta personalizada recibirá un error de unicidad. → [[esmalte]]
- [ ] **Políticas de storage sin org** — subir/actualizar solo comprueba `bucket_id`. → [[fotos-y-storage]]
- [ ] **Seed de `services` sin `organization_id`** — filas invisibles bajo RLS. → [[servicio]]
- [ ] **`organization_members` permite auto-insertarse en cualquier org** (`member_self_insert`: solo valida `user_id = auth.uid()`). Debe cerrarse antes o junto con [[roadmap-salon-multi-profesional]].

## Tipos

- [ ] `types/database.types.ts` dice "generado, no editar" pero tiene comentarios, alias y tipos compuestos escritos a mano al final, y declara `Functions: Record<string, never>` pese a que existe una RPC (por eso onboarding hace `(supabase as any).rpc(...)`). → [[esquema-bd]]

## `CLAUDE.md` raíz desactualizado

- [ ] Tabla resumen del esquema: `professionals.email` no existe; `services.default_duration_min` se llama `duration`; faltan `incomes`, `polish_base_colors`, `polish_tone_families`, columnas `brand` (texto), `base_color`, `tone_family`, `effect`, `photo_url`, `max_capacity`, `birthday`, `google_event_id`.
- [ ] Estructura de archivos: no menciona `incomes.tsx`, `onboarding.tsx`, `auth-callback.tsx`, `app/polishes/*`, `app/settings/*`, ni la mayoría de contextos (`Currency`, `PolishLabels`, `DrawingPad`, `TimeFormat`, `Confirm`, `Error`, `Notification`, `Toast`, `Organization`).
- [ ] Componentes existentes: lista 10 de ~27 (catálogo real en [[ui-y-tema]]).
- [ ] `AGENTS.md` pide leer la doc de Expo **v56**, pero el proyecto usa Expo **54**.

## Relacionado

[[deuda-tecnica]] · [[esquema-bd]] · [[multi-tenancy]]

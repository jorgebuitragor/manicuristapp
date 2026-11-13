---
tipo: pendiente
tags: [pendientes, discrepancias, calidad]
actualizado: 2026-11-13
fuentes:
  - supabase/migration.sql
  - types/database.types.ts
  - CLAUDE.md
  - AGENTS.md
  - app/onboarding.tsx
  - hooks/useGoogleCalendar.ts
---

# Discrepancias (código ↔ docs ↔ BD)

Contradicciones verificables. Cuando se resuelva una, marcarla `[x]` con fecha y commit (no borrarla) y anotarlo en [[log]].

> [!warning] **Aplicar en Supabase.** Lo resuelto en `47f7412` está en `supabase/migration.sql` (sección `2026-11-13 — FIX`), pero **hay que ejecutar esa sección en el SQL Editor** de la BD real. Orden: primero publicar la app nueva (sube fotos a `<org_id>/…`) y después ejecutar el SQL; al revés, las versiones viejas de la app no podrán subir fotos.

## Esquema: `migration.sql` no refleja la BD real

- [x] **RPC `create_organization(org_name, org_type)`** — versionada en la migración. *2026-11-13, `47f7412`.* La versión nueva valida tipo y nombre, fija `search_path` y, si el usuario ya tiene org, devuelve la existente. Hace `DROP` + `CREATE`, así que **reemplaza** la versión remota (que no conocíamos).
- [x] **`clients.birthday`** — añadida a la migración. *`47f7412`*
- [x] **`appointments.google_event_id`** — añadida a la migración. *`47f7412`*

> [!question] ¿Hay más objetos creados a mano en el dashboard de Supabase? Conviene comparar con `supabase db dump --schema public` de la BD real.

## Esquema: problemas de multi-tenancy

- [x] **`UNIQUE(key)` global en `polish_base_colors` / `polish_tone_families`** → ahora único por `(organization_id, key)`. *`47f7412`* → [[esmalte]]
- [x] **Políticas de storage sin org** → carpeta `<organization_id>/` obligatoria para leer, subir, actualizar y borrar. *`47f7412`* → [[fotos-y-storage]]
- [x] **`member_self_insert` permitía unirse a cualquier org** → eliminada (también `org_owner_insert`); las altas solo pasan por RPC. *`47f7412`* → [[multi-tenancy]]
- [ ] **Seed de `services` sin `organization_id`** — filas invisibles bajo RLS; las orgs nuevas arrancan sin servicios. Decidir: borrar el seed o sembrar servicios por defecto dentro de `create_organization`. → [[servicio]]

## Tipos

- [x] `Functions` declaraba `Record<string, never>` pese a usarse una RPC → tipadas `create_organization` y `get_my_org_id`; quitado el `as any` del onboarding. *`47f7412`*
- [ ] `database.types.ts` sigue mezclando código generado con alias escritos a mano al final (`Client`, `AppointmentWithRelations`…): regenerar los tipos los borra. Opción: mover los alias a `types/models.ts`. → [[esquema-bd]]

## `CLAUDE.md` / `AGENTS.md` desactualizados

- [x] Tabla del esquema, estructura de archivos, catálogo de componentes y flujo de onboarding actualizados. *`47f7412`*
- [x] `AGENTS.md` apuntaba a la documentación de Expo **v56** → ahora **v54** (la instalada). *`47f7412`*

## Relacionado

[[deuda-tecnica]] · [[esquema-bd]] · [[multi-tenancy]]

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

## Estado real de Supabase (verificado 2026-11-13 vía conector)

Proyecto `manicuristapp` (`nkispboetijemfpfahbl`). Lectura del esquema, funciones, políticas, storage y asesor de seguridad:

- El esquema coincide con `migration.sql` + la sección FIX: no hay otros objetos creados a mano. `list_migrations` está vacío (todo se aplicó desde el SQL Editor).
- La `create_organization` remota ya tenía `search_path`, pero no validaba ni evitaba duplicados.
- [ ] **`org_owner_insert` remota es `WITH CHECK (true)`** (no `owner_id = auth.uid()` como dice el script): cualquiera podía crear organizaciones a nombre de otro. La sección FIX la elimina. **Pendiente de aplicar.**
- [x] **El bug de reintentos ya había ocurrido**: un usuario tenía 3 orgs "Prueba" creadas en 1 minuto, sin perfil de profesional; con `LIMIT 1` sin orden veía una u otra. Se borraron las 2 vacías. *2026-11-13, a mano con SQL*
- [x] **Datos anteriores al multi-tenant sin `organization_id`** (3–13 de junio: 2 clientes, 6 citas, 6 servicios, 1 ingreso, 4 esmaltes, 2 marcas, 2 esmalteros, 1 etiqueta) eran invisibles bajo RLS → asignados a "Estudio jorge" a petición del usuario. *2026-11-13, a mano con SQL*
- [ ] El asesor marca `get_my_org_id` ejecutable sin sesión → la sección FIX ahora la revoca a `anon`. **Pendiente de aplicar.**
- [ ] El asesor marca **protección de contraseñas filtradas desactivada** → se activa en el dashboard (Authentication → Passwords), no por SQL.
- Las 108 fotos del storage están en rutas antiguas (sin carpeta de org) → [[fotos-y-storage]].

## Esquema: `migration.sql` no refleja la BD real

- [x] **RPC `create_organization(org_name, org_type)`** — versionada en la migración. *2026-11-13, `47f7412`.* La versión nueva valida tipo y nombre, fija `search_path` y, si el usuario ya tiene org, devuelve la existente. Hace `DROP` + `CREATE`, así que **reemplaza** la versión remota (que no conocíamos).
- [x] **`clients.birthday`** — añadida a la migración. *`47f7412`*
- [x] **`appointments.google_event_id`** — añadida a la migración. *`47f7412`*

> [!question] ¿Hay más objetos creados a mano en el dashboard de Supabase? Conviene comparar con `supabase db dump --schema public` de la BD real.

## Esquema: problemas de multi-tenancy

- [x] **`UNIQUE(key)` global en `polish_base_colors` / `polish_tone_families`** → ahora único por `(organization_id, key)`. *`47f7412`* → [[esmalte]]
- [x] **Políticas de storage sin org** → carpeta `<organization_id>/` obligatoria para leer, subir, actualizar y borrar. *`47f7412`* → [[fotos-y-storage]]
- [x] **`member_self_insert` permitía unirse a cualquier org** → eliminada (también `org_owner_insert`); las altas solo pasan por RPC. *`47f7412`* → [[multi-tenancy]]
- [x] **Seed de `services` sin `organization_id`** → `create_organization` siembra 8 servicios por org (según idioma, sin precio) y la migración borra las filas huérfanas que no usa ninguna cita. *`61ea96f`* → [[servicio]]

## Tipos

- [x] `Functions` declaraba `Record<string, never>` pese a usarse una RPC → tipadas `create_organization` y `get_my_org_id`; quitado el `as any` del onboarding. *`47f7412`*
- [ ] `database.types.ts` sigue mezclando código generado con alias escritos a mano al final (`Client`, `AppointmentWithRelations`…): regenerar los tipos los borra. Opción: mover los alias a `types/models.ts`. → [[esquema-bd]]

## `CLAUDE.md` / `AGENTS.md` desactualizados

- [x] Tabla del esquema, estructura de archivos, catálogo de componentes y flujo de onboarding actualizados. *`47f7412`*
- [x] `AGENTS.md` apuntaba a la documentación de Expo **v56** → ahora **v54** (la instalada). *`47f7412`*

## Relacionado

[[deuda-tecnica]] · [[esquema-bd]] · [[multi-tenancy]]

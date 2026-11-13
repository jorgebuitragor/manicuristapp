---
tipo: overview
tags: [log]
actualizado: 2026-11-13
---

# Log

Registro append-only. Entradas nuevas **al final**. Formato: `## [YYYY-MM-DD] operación | título`.

```bash
grep "^## \[" vault/wiki/log.md | tail -5        # últimas 5 operaciones
grep "^## \[.*sync" vault/wiki/log.md | tail -1  # último sync de código
```

## [2026-11-13] init | Creación del vault

- Estructura `raw/` + `wiki/` + schema `vault/CLAUDE.md`, basada en el patrón LLM Wiki.
- 24 páginas iniciales: overview, 7 de dominio, 7 de arquitectura, 3 de integraciones, 3 de pendientes, 1 de fuente, index y log.
- Puntero añadido en `CLAUDE.md` raíz.

## [2026-11-13] ingest | LLM Wiki pattern

- Fuente: `raw/2026-11-13-llm-wiki-pattern.md` → [[llm-wiki-pattern]].
- Define la metodología del vault; no toca páginas de producto.

## [2026-11-13] sync | Código hasta d63ae09

- Lectura del esquema, hooks, contextos, lib y pantallas principales en el commit `d63ae09` ("Mejoras en pantalla de esmaltes").
- Hallazgos clave registrados en [[discrepancias]]: `migration.sql` no incluye `create_organization`, `clients.birthday` ni `appointments.google_event_id`; `UNIQUE(key)` global en etiquetas de esmalte; storage sin aislamiento por org; `CLAUDE.md` raíz desactualizado.
- Deuda nueva en [[deuda-tecnica]]: supabase fuera de hooks, textos sin i18n, operaciones no transaccionales, pantallas muy grandes.

## [2026-11-13] sync | Correcciones de esquema, seguridad y docs (47f7412)

- Commit `47f7412`. Nueva sección `2026-11-13 — FIX` en `supabase/migration.sql`: `clients.birthday`, `appointments.google_event_id`, RPC `create_organization` versionada, `search_path` en `get_my_org_id`, etiquetas únicas por org, sin políticas INSERT en `organizations`/`organization_members`, storage aislado por carpeta `<org_id>/`.
- Probado en un Postgres 16 local con simulaciones de `auth`/`storage`: BD existente y BD nueva, ambas re-ejecutadas (idempotente); 19 comprobaciones de RLS con dos usuarios.
- App: `hooks/usePhotoStorage.ts` (nuevo), `PhotoPickerField` lo usa; RPC tipadas; corregido el `ReferenceError` de `movePolish` en el modo mover. `tsc --noEmit` sin errores.
- `CLAUDE.md` raíz y `AGENTS.md` actualizados.
- Páginas tocadas: [[discrepancias]], [[multi-tenancy]], [[fotos-y-storage]], [[esquema-bd]], [[organizacion]], [[cliente]], [[cita]], [[esmalte]], [[estado-servidor-y-offline]], [[ui-y-tema]], [[deuda-tecnica]], [[roadmap-salon-multi-profesional]].
- **Pendiente fuera del repo:** ejecutar la sección SQL en Supabase, después de publicar la app.

## [2026-11-13] sync | Servicios por defecto por organización (61ea96f)

- Commit `61ea96f`. `create_organization` acepta `org_lang` y siembra 8 servicios (es/en, sin precio) mediante `seed_default_services` (interna). Se quitó el seed sin org del inicio de `migration.sql` y la sección FIX borra esas filas si ninguna cita las usa.
- Se modificó la sección `2026-11-13 — FIX` en lugar de añadir otra, porque aún no se había aplicado en Supabase.
- Probado en Postgres local: BD existente (7 de 8 filas huérfanas borradas, la usada por una cita se conserva) y BD nueva; idempotente; 7 comprobaciones de servicios (idioma, sin duplicados en reintentos, aislamiento, sin acceso a la función interna) + las 19 de seguridad sobre una BD limpia. `tsc --noEmit` sin errores.
- Páginas tocadas: [[servicio]], [[organizacion]], [[esquema-bd]], [[discrepancias]].

## [2026-11-13] ingest | Estado real de Supabase vía conector + correcciones de datos

- Primera conexión al proyecto `manicuristapp` (`nkispboetijemfpfahbl`) con el conector de Supabase. Lectura completa: esquema, funciones, políticas, constraints, storage, conteos por org y asesor de seguridad. Detalle en [[discrepancias]].
- Cambios de **datos** aplicados en producción a petición del usuario (un bloque `DO` atómico con conteos esperados):
  - Datos sin `organization_id` (24 filas, anteriores al multi-tenant) → asignados a "Estudio jorge".
  - 2 organizaciones "Prueba" duplicadas y vacías (bug de reintentos del onboarding) → borradas.
  - Verificado después: 0 filas sin org, 0 usuarios en varias orgs, 0 membresías huérfanas.
- `migration.sql`: la sección FIX ahora también revoca `get_my_org_id` a `anon` (aviso del asesor). Re-probado en local: idempotente, 19/19 comprobaciones de RLS.
- **La sección FIX sigue sin aplicarse en Supabase**: espera a que se publique la app.
- Páginas tocadas: [[discrepancias]], [[fotos-y-storage]], [[servicio]].

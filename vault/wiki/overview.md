---
tipo: overview
tags: [overview]
actualizado: 2026-11-13
fuentes:
  - CLAUDE.md
  - package.json
  - app/_layout.tsx
  - supabase/migration.sql
---

# ManicuristApp — Visión general

App móvil (iOS/Android, también corre en web) para **manicuristas y salones de uñas**: gestiona [[cliente|clientes]], [[cita|citas]], el inventario de [[esmalte|esmaltes]] organizado en [[esmaltero|esmalteros]], el catálogo de [[servicio|servicios]] y los [[ingreso|ingresos]]. Es **multi-tenant**: todo dato pertenece a una [[organizacion|organización]] (home studio o salón).

## Stack

| Pieza | Versión / detalle |
| --- | --- |
| Expo + expo-router | `~54.0.35` / `~6.0.24` (rutas por archivos) |
| React Native / React | `0.81.5` / `19.1.0` |
| Backend | Supabase (auth, Postgres con RLS, storage, realtime) |
| Estado servidor | TanStack Query v5 + persistencia en AsyncStorage → ver [[estado-servidor-y-offline]] |
| Lenguaje | TypeScript strict |
| Paquetes | `pnpm` 10.25.0 (nunca npm/yarn) |

## Mapa mental

```text
Usuario (auth.users)
  └─ organization_members ─→ organizations  (tenant)
                                 ├─ professionals
                                 ├─ clients ──────────┐
                                 ├─ services          │
                                 ├─ appointments ─────┘ ←→ appointment_services / appointment_polishes
                                 │     └─ incomes (1:1 opcional)
                                 ├─ nail_polishes ─→ nail_polish_brands, nail_racks
                                 └─ polish_base_colors, polish_tone_families
```

Detalle en [[esquema-bd]] y [[multi-tenancy]].

## Áreas funcionales (tabs)

| Tab | Pantalla | Página |
| --- | --- | --- |
| Inicio | `app/(tabs)/index.tsx` — citas del día, resumen | [[cita]] |
| Calendario | `app/(tabs)/calendar.tsx` — semana, búsqueda, bloc de notas/dibujo, realtime | [[cita]], [[preferencias-locales]] |
| Clientes | `app/(tabs)/clients/` — lista y ficha con historial | [[cliente]] |
| Esmaltes | `app/(tabs)/polishes/index.tsx` — inventario, filtros, mapa de esmaltero | [[esmalte]], [[esmaltero]] |
| Ingresos | `app/(tabs)/incomes.tsx` — totales, estadísticas, gráfico | [[ingreso]] |
| Ajustes | `app/(tabs)/settings.tsx` + `app/settings/*` | [[preferencias-locales]], [[google-calendar]] |

## Principios de arquitectura

- **Pantallas solo componen** componentes de `components/ui/` → [[ui-y-tema]].
- **Todo acceso a Supabase vive en `hooks/`** → [[estado-servidor-y-offline]] (hay excepciones, ver [[deuda-tecnica]]).
- **Todo texto visible pasa por `useI18n()`** → [[i18n]].
- **Aislamiento por `organization_id`** en queries, inserts y RLS → [[multi-tenancy]].

## Estado actual (2026-11-13)

- Funcional para un único usuario por organización.
- Siguiente gran pieza: [[roadmap-salon-multi-profesional]] (invitaciones por código).
- El esquema en `supabase/migration.sql` está desfasado respecto a la BD real → [[discrepancias]].

## Relacionado

[[index]] · [[log]] · [[navegacion-y-auth]] · [[deuda-tecnica]]

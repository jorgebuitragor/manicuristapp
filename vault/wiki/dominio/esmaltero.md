---
tipo: entidad
tags: [dominio, esmaltes, inventario]
actualizado: 2026-11-13
fuentes:
  - hooks/useNailRacks.ts
  - hooks/usePolishes.ts
  - app/settings/racks.tsx
  - app/(tabs)/polishes/index.tsx
  - supabase/migration.sql
---

# Esmaltero (rack)

Estante físico donde se guardan los [[esmalte|esmaltes]]. Cada esmalte puede ocupar una posición numerada en un esmaltero.

## Tabla `nail_racks`

| Columna | Notas |
| --- | --- |
| `name` | único por organización (`uq_rack_name_org`) |
| `max_capacity` | nullable; número de posiciones |
| `organization_id` | [[multi-tenancy]] |

## Reglas de posición

- `nail_polishes.rack_id` + `rack_position` (entero).
- Índice único parcial `uq_nail_polish_rack_position (rack_id, rack_position)` cuando ambos no son NULL → **dos esmaltes no pueden ocupar la misma posición**.
- Borrar un esmaltero pone `rack_id = NULL` en sus esmaltes (`ON DELETE SET NULL`).

## Mover esmaltes — `useMovePolish()`

Por la restricción única, el movimiento se hace en varios updates secuenciales (no transaccionales):

| Caso | Pasos |
| --- | --- |
| Destino libre | `polish → (rack, target)` |
| Intercambio (el origen tenía posición) | `ocupante → NULL` · `polish → target` · `ocupante → posición anterior del polish` |
| Desplazamiento (origen sin posición) | `polish → target` · `ocupante → NULL` (queda "sin posición") |

> [!question] Si falla un paso intermedio, el ocupante puede quedar con `rack_position = NULL`. ¿Conviene moverlo a una RPC transaccional? Anotado en [[deuda-tecnica]].

## Gestión

`app/settings/racks.tsx` — CRUD. `useCreateNailRack` reutiliza un esmaltero existente con el mismo nombre (sin distinguir mayúsculas) en lugar de fallar.

## Relacionado

[[esmalte]] · [[esquema-bd]]

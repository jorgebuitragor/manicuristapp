---
tipo: entidad
tags: [dominio, clientes]
actualizado: 2026-11-13
fuentes:
  - hooks/useClients.ts
  - app/clients/new.tsx
  - app/(tabs)/clients/index.tsx
  - app/(tabs)/clients/[id].tsx
  - lib/notifications.ts
---

# Cliente

Persona atendida por la organización. Es compartida por toda la [[organizacion]] (en un salón, todas las profesionales verán los mismos clientes).

## Tabla `clients`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | |
| `name` | text, requerido | |
| `phone` | text | |
| `allergies` | text | Visible en la ficha y relevante al atender |
| `notes` | text | |
| `birthday` | date `YYYY-MM-DD` | Dispara notificación de cumpleaños → [[notificaciones]] |
| `organization_id` | uuid | [[multi-tenancy]] |

> [!warning] `birthday` existe en los tipos y se usa en el código, pero no está en `supabase/migration.sql`. Ver [[discrepancias]].

Borrar un cliente **borra en cascada sus citas** (`appointments.client_id ON DELETE CASCADE`).

## Hooks (`hooks/useClients.ts`)

| Hook | Qué hace |
| --- | --- |
| `useClients()` | Lista de la org, orden por `name`. Key `['clients', orgId]` |
| `useClient(id)` | Uno por id. Key `['clients', id]` |
| `useCreateClient()` | Insert con `organization_id` |
| `useUpdateClient()` | Update + invalida lista y detalle |
| `useDeleteClient()` | Delete |

## Pantallas

- `app/(tabs)/clients/index.tsx` — lista con búsqueda.
- `app/(tabs)/clients/[id].tsx` — ficha: edición, historial de citas (`useAppointmentsByClient`), borrado con confirmación, reprograma/cancela la notificación de cumpleaños.
- `app/clients/new.tsx` — modal de alta; programa la notificación de cumpleaños si está activada.

## Relacionado

[[cita]] · [[notificaciones]] · [[ingreso]] (top clientes en estadísticas)

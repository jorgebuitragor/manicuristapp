---
tipo: entidad
tags: [dominio, citas, calendario]
actualizado: 2026-11-13
fuentes:
  - hooks/useAppointments.ts
  - lib/appointmentStateMachine.ts
  - app/appointments/new.tsx
  - app/appointments/[id].tsx
  - app/(tabs)/calendar.tsx
  - app/(tabs)/index.tsx
  - supabase/migration.sql
---

# Cita

Entidad central de la app: un [[cliente]] recibe uno o más [[servicio|servicios]] en una franja horaria, opcionalmente con [[esmalte|esmaltes]] usados y una foto del diseño. Al completarse puede generar un [[ingreso]].

## Tabla `appointments`

| Columna | Notas |
| --- | --- |
| `client_id` | requerido, `ON DELETE CASCADE` |
| `professional_id` | nullable, `ON DELETE RESTRICT` (ver [[organizacion]]) |
| `service_id` | **legacy**: se mantiene sincronizado con el *primer* servicio |
| `start_time`, `end_time` | timestamptz; CHECK `end_time > start_time` |
| `status` | `'pending' \| 'completed' \| 'cancelled'` (default `pending`) |
| `notes`, `design_photo_url` | foto en bucket `design-photos` → [[fotos-y-storage]] |
| `google_event_id` | id del evento sincronizado → [[google-calendar]] |
| `organization_id` | [[multi-tenancy]] |

Tablas puente:
- `appointment_services (appointment_id, service_id)` — fuente real de los servicios (muchos-a-muchos).
- `appointment_polishes (appointment_id, nail_polish_id)` — esmaltes usados.

> [!warning] `google_event_id` no está en `supabase/migration.sql`. Ver [[discrepancias]].

## Máquina de estados (`lib/appointmentStateMachine.ts`)

```text
pending ──→ completed   (solo si start_time ya pasó)
pending ──→ cancelled
completed ─→ pending    (deshacer, p.ej. ingreso registrado por error)
cancelled ─→ pending    (reactivar)
completed ↔ cancelled   PROHIBIDO
```

- `canTransitionTo(from, to, startTime)` devuelve `{ allowed, reason }` con `reason ∈ {'invalidTransition','futureAppointment'}`.
- `canReschedule(status)` → solo `pending` se puede reprogramar.
- Al pasar a `completed` sin ingreso previo, el detalle abre `IncomeConfirmModal` → [[ingreso]].

## Lectura (`hooks/useAppointments.ts`)

Todas las lecturas usan el select `APPOINTMENT_WITH_RELATIONS` (cliente + servicios + esmaltes) y `mapAppointmentRelations()`, que produce el tipo `AppointmentWithRelations` con `services[]` y `polishes[]` aplanados. Si no hay filas en `appointment_services`, cae al `service` legacy.

| Hook | Uso |
| --- | --- |
| `useAppointmentsByDate(date)` | Inicio; límites del día en hora local |
| `useAppointmentsByDateRange(start, end)` | Vista semanal del calendario |
| `useAppointmentsByClient(clientId)` | Historial en ficha de cliente |
| `useAppointment(id)` | Detalle |
| `useSearchAppointments(q)` | Trae las 100 más recientes y filtra **en el cliente** por nombre de cliente o servicio |
| `findConflictingAppointments(...)` | Función async (no hook): solapamientos no cancelados en la org |

## Escritura

| Hook | Notas |
| --- | --- |
| `useCreateAppointment` | Insert + filas en `appointment_services`; `service_id` = primer servicio |
| `useUpdateAppointmentStatus` | **Optimista** sobre la key del detalle |
| `useRescheduleAppointment` | **Optimista**; cambia `start_time`/`end_time` |
| `useDeleteAppointment` | |
| `useAdd/RemoveServiceToAppointment` | Upsert/delete en puente + resync de `service_id` legacy |
| `useAdd/RemovePolishToAppointment` | Upsert/delete en `appointment_polishes` |

Todas invalidan `['appointments']`.

## Flujos de pantalla

- **Nueva cita** (`app/appointments/new.tsx`, modal): valida conflictos → crea → añade esmaltes → programa recordatorio ([[notificaciones]]) → sincroniza con [[google-calendar]] (best-effort).
- **Detalle** (`app/appointments/[id].tsx`, ~760 líneas): cambio de estado, reprogramación con chequeo de conflictos y re-programación del recordatorio, servicios/esmaltes, foto de diseño, ingreso, borrado (también borra el evento de Google).
- **Calendario** (`app/(tabs)/calendar.tsx`): vista semanal, búsqueda, bloc de notas/dibujo por día ([[preferencias-locales]]) y **suscripción realtime** a `appointments` que invalida la cache.

> [!warning] El detalle actualiza `design_photo_url` con `supabase` directamente en la pantalla (líneas ~294 y ~300), saltándose la regla de hooks. Ver [[deuda-tecnica]].

## Relacionado

[[cliente]] · [[servicio]] · [[esmalte]] · [[ingreso]] · [[estado-servidor-y-offline]] · [[notificaciones]] · [[google-calendar]]

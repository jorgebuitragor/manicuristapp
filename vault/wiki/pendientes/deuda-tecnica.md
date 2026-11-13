---
tipo: pendiente
tags: [pendientes, deuda-tecnica]
actualizado: 2026-11-13
fuentes:
  - TECH_DEBT.md
  - app/
  - hooks/
  - components/ui/
---

# Deuda técnica

Síntesis de `TECH_DEBT.md` más lo encontrado al crear el vault. `TECH_DEBT.md` sigue siendo el registro "oficial" que el equipo mantiene a mano; esta página lo amplía y lo enlaza con el resto del wiki. Las contradicciones puras están en [[discrepancias]].

## Registrada en `TECH_DEBT.md`

| Ítem | Prioridad | Página |
| --- | --- | --- |
| OAuth de Google Calendar no completa en Expo Go iOS (funciona en build nativo) | Baja | [[google-calendar]] |

## Detectada al crear el vault (2026-11-13)

### Convenciones no cumplidas

- **Supabase fuera de `hooks/`**:
  - `app/onboarding.tsx` — `rpc('create_organization')` + insert en `professionals`.
  - `app/appointments/[id].tsx` ~294/300 — update de `design_photo_url`.
  - `app/(tabs)/calendar.tsx` — canal realtime (aceptable, pero podría ser un hook `useAppointmentsRealtime`).
  - `app/(tabs)/settings.tsx` — `getUser`, `signOut`.
  - `hooks/useGoogleCalendar.ts` escribe `google_event_id` fuera de una mutación (no invalida cache).
- **Textos sin i18n**: etiquetas de gráfico en `hooks/useIncomes.ts`; textos de `lib/notifications.ts`. → [[i18n]]
- **Colores HEX literales**: ~34 líneas en `app/` + `components/` (revisar cuáles son paletas legítimas). → [[ui-y-tema]]

### Robustez

- `useMovePolish` hace 2–3 updates secuenciales no transaccionales; un fallo intermedio deja un esmalte sin posición. Candidato a RPC. → [[esmaltero]]
- `useCreateAppointment` inserta la cita y luego los servicios en dos llamadas; si falla la segunda, queda la cita sin servicios.
- `useSearchAppointments` busca solo entre las **100 citas más recientes** y filtra en el cliente.
- `useIncomeStats` / `useIncomeSummary` agregan en el cliente y calculan fechas en UTC. → [[ingreso]]
- Fotos huérfanas en storage (`tempId`, cambio de foto, rutas anteriores a la carpeta por org). → [[fotos-y-storage]]

### Resuelto

- ~~`PhotoPickerField` llamaba a `supabase.storage` directamente~~ → `hooks/usePhotoStorage.ts`. *`47f7412`*
- ~~`SwatchSection` usaba `movePolish` sin recibirlo (ReferenceError en el modo mover)~~. *`47f7412`*

### Mantenibilidad

- Pantallas muy grandes: `app/(tabs)/polishes/index.tsx` (~1300 líneas), `app/appointments/[id].tsx` (~760), `app/(tabs)/calendar.tsx` (~600), `app/(tabs)/settings.tsx` (~570).
- Campos legacy duplicados: `appointments.service_id` (vs `appointment_services`), `nail_polishes.brand` texto (vs `brand_id`).
- No hay tests, linter ni CI configurados (`package.json` sin scripts de test/lint).

## Relacionado

[[discrepancias]] · [[roadmap-salon-multi-profesional]] · [[overview]]

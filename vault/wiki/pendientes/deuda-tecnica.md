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

- Quedan colores literales que son **excepciones aceptadas** (paletas del selector, efectos sobre el swatch, logos de marca, visor de fotos, splash) — documentadas en `CLAUDE.md` y [[ui-y-tema]]. No es deuda.
- `context/OrganizationContext.tsx` todavía consulta `organization_members` directamente (no es una pantalla, pero tampoco un hook). Candidato a `useMyOrganization` con TanStack Query.

### Robustez

- `useMovePolish` hace 2–3 updates secuenciales no transaccionales; un fallo intermedio deja un esmalte sin posición. Candidato a RPC. → [[esmaltero]]
- `useCreateAppointment` inserta la cita y luego los servicios en dos llamadas; si falla la segunda, queda la cita sin servicios.
- `useSearchAppointments` busca solo entre las **100 citas más recientes** y filtra en el cliente.
- `useIncomeStats` / `useIncomeSummary` agregan en el cliente (bien a esta escala; revisar con muchos ingresos). → [[ingreso]]
- Fotos huérfanas en storage (`tempId`, cambio de foto, rutas anteriores a la carpeta por org). → [[fotos-y-storage]]

### Resuelto

- ~~`PhotoPickerField` llamaba a `supabase.storage` directamente~~ → `hooks/usePhotoStorage.ts`. *`47f7412`*
- ~~`SwatchSection` usaba `movePolish` sin recibirlo (ReferenceError en el modo mover)~~. *`47f7412`*
- ~~Supabase fuera de `hooks/`~~: onboarding → `useCreateOrganization`; foto de diseño → `useUpdateAppointmentDesignPhoto`; realtime → `useAppointmentsRealtime`; ajustes → `useCurrentProfessional`; **todo Auth** → `lib/auth.ts`. Ninguna pantalla, componente ni contexto llama a `supabase.auth`. *2026-11-13*
- ~~`google_event_id` se guardaba sin invalidar la cache~~ → **creaba eventos duplicados** en Google Calendar si se reprogramaba la cita poco después de crearla. Ahora invalida. *2026-11-13* → [[google-calendar]]
- ~~Textos sin i18n~~: gráfico de ingresos (Intl según idioma), notificaciones (`translate()`), errores del registro, y fechas con `'es-ES'` fijo en 6 pantallas → `locale` de `useI18n()`. *2026-11-13* → [[i18n]]
- ~~Fechas en UTC~~ (`toISOString().slice(0,10)`): resumen/estadísticas de ingresos, fecha del ingreso (el DEFAULT de la BD es UTC) y cumpleaños (se guardaba un día antes en UTC+). → `lib/dates.ts`. Verificado con TZ Bogotá y Madrid. *2026-11-13* → [[ingreso]], [[cliente]]
- ~~Vista "todo" de ingresos repetía meses los días 29–31~~ (`setMonth` desbordaba). *2026-11-13*
- ~~Colores del tema~~: cumpleaños en calendario (rosa claro fijo en modo oscuro), banner de conexión, fondos de modales y sombras → tokens `birthday`, `birthdayMuted`, `dangerStrong`, `warning`, `success`, `backdrop`, `shadow`. *2026-11-13* → [[ui-y-tema]]

### Mantenibilidad

- Pantallas muy grandes: `app/(tabs)/polishes/index.tsx` (~1300 líneas), `app/appointments/[id].tsx` (~760), `app/(tabs)/calendar.tsx` (~600), `app/(tabs)/settings.tsx` (~570).
- Campos legacy duplicados: `appointments.service_id` (vs `appointment_services`), `nail_polishes.brand` texto (vs `brand_id`).
- No hay tests, linter ni CI configurados (`package.json` sin scripts de test/lint).

## Relacionado

[[discrepancias]] · [[roadmap-salon-multi-profesional]] · [[overview]]

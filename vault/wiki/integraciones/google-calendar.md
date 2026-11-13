---
tipo: integracion
tags: [integraciones, google, calendario, oauth]
actualizado: 2026-11-13
fuentes:
  - hooks/useGoogleCalendar.ts
  - lib/googleCalendar.ts
  - app/(tabs)/settings.tsx
  - TECH_DEBT.md
---

# Google Calendar

Sincronización **unidireccional** (app → Google) de las [[cita|citas]] con el calendario de Google de la usuaria. Es opcional y *best-effort*: nunca bloquea ni lanza errores.

## Conexión

- `useGoogleCalendarConnection()` en Ajustes: OAuth con `expo-auth-session` (scope `calendar.events`, `access_type: offline`, PKCE) y luego `exchangeCodeAsync`.
- Client IDs: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.
- Tokens (access, refresh, expiresAt) en **SecureStore**. `getValidAccessToken()` refresca si faltan menos de 5 minutos para que expire.

## Sincronización

| Función | Cuándo | Qué hace |
| --- | --- | --- |
| `syncAppointmentToCalendar` | Crear / reprogramar cita | Si hay `google_event_id` → update; si no → create y guarda el id en `appointments.google_event_id` |
| `deleteAppointmentFromCalendar` | Borrar cita | Borra el evento |

> [!note] Hasta 2026-11-13 guardar `google_event_id` no invalidaba la cache: si se reprogramaba la cita poco después de crearla, la app no veía el id y **creaba un segundo evento**. Corregido.

> [!warning] Los tokens se guardan **por dispositivo**, pero `google_event_id` se guarda en la cita (compartida por la org). En un salón, si otra profesional reprograma la cita desde su dispositivo, intentaría actualizar un evento de un calendario ajeno. Relevante para [[roadmap-salon-multi-profesional]].

## Estado conocido (de `TECH_DEBT.md`)

En **Expo Go en iOS** el redirect OAuth con esquema personalizado no vuelve a la app: el botón "Conectar" abre Google pero no completa el flujo. En builds nativos (`pnpm ios`, TestFlight) debería funcionar sin cambios de código. Prioridad baja. → [[deuda-tecnica]]

## Relacionado

[[cita]] · [[preferencias-locales]] · [[deuda-tecnica]]

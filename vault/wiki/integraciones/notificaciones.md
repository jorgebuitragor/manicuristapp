---
tipo: integracion
tags: [integraciones, notificaciones, expo-notifications]
actualizado: 2026-11-13
fuentes:
  - lib/notifications.ts
  - context/NotificationContext.tsx
  - app/appointments/new.tsx
  - app/appointments/[id].tsx
  - app/clients/new.tsx
  - app/(tabs)/clients/[id].tsx
---

# Notificaciones locales

Notificaciones **locales** programadas en el dispositivo con `expo-notifications` (no hay push desde servidor).

## Soporte

`isNotificationsSupported()` devuelve `false` en **Android dentro de Expo Go** (el módulo se importa de forma dinámica para no romper ahí). En iOS siempre `true`.

Al arrancar (`app/_layout.tsx`): `setupNotifications()` (handler + canal Android `default` con color `#c084fc`) y `requestNotificationPermissions()`.

## Tipos

| Tipo | Identificador | Disparo | Programada desde |
| --- | --- | --- | --- |
| Recordatorio de cita | `apt-<appointmentId>` | Fecha concreta: `start_time − N min` (N = 5/10/15/30/60, default 15). No se programa si ya pasó. | Nueva cita; reprogramación en detalle (cancela y vuelve a programar); se cancela al cancelar/borrar |
| Cumpleaños de cliente | `birthday-<clientId>` | Anual, día/mes de `birthday`, 09:00 | Alta y edición de [[cliente]] |

Preferencias (activar recordatorios, minutos, activar cumpleaños) en `NotificationContext` → [[preferencias-locales]].

> [!warning] Los textos (`'📅 Cita próxima'`, `'En N min: …'`, `'🎂 ¡Cumpleaños!'`) están en español fijo, sin [[i18n]].

> [!question] Al ser locales, las notificaciones solo existen en el dispositivo donde se creó/editó la cita. En un salón con varias profesionales ([[roadmap-salon-multi-profesional]]) o al reinstalar la app, no se replican.

## Relacionado

[[cita]] · [[cliente]] · [[preferencias-locales]]

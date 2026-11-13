---
tipo: concepto
tags: [arquitectura, ajustes, asyncstorage]
actualizado: 2026-11-13
fuentes:
  - context/ThemeContext.tsx
  - context/I18nContext.tsx
  - context/CurrencyContext.tsx
  - context/TimeFormatContext.tsx
  - context/DrawingPadContext.tsx
  - context/NotificationContext.tsx
  - components/ui/CalendarNotesPad.tsx
  - lib/queryClient.ts
  - lib/googleCalendar.ts
---

# Preferencias y datos locales del dispositivo

Datos que **no** van a Supabase: viven en el dispositivo y **no se sincronizan** entre dispositivos ni entre miembros de una org.

## AsyncStorage

| Key | Contexto / dueño | Valores |
| --- | --- | --- |
| `@app_color_scheme` | `ThemeContext` | `light \| dark \| system` |
| `@app_lang` | `I18nContext` | `es \| en \| system` |
| `@app_currency` | `CurrencyContext` | `€, $, £, COP, MXN, ARS, CLP, PEN` |
| `@app_time_format` | `TimeFormatContext` | `12h \| 24h` |
| `@app_drawing_pad_enabled` | `DrawingPadContext` | booleano — activa el bloc de dibujo del calendario |
| `@app_show_empty_positions` | `DrawingPadContext` | booleano (default `true`) — mostrar posiciones vacías del [[esmaltero]] |
| `notif_reminder_enabled` | `NotificationContext` | booleano (default `true`) |
| `notif_reminder_minutes` | `NotificationContext` | `5, 10, 15, 30, 60` (default 15) |
| `notif_birthday_enabled` | `NotificationContext` | booleano (default `true`) |
| `@calendar_notes:<fecha>` | `CalendarNotesPad` | texto de la nota del día |
| `@calendar_notes_drawing:<fecha>` | `CalendarNotesPad` | trazos del dibujo (JSON) |
| `manicurist-rq-cache-v1` | `lib/queryClient.ts` | cache persistida de TanStack Query |

> [!note] Las keys de notificaciones no usan el prefijo `@app_` como las demás.

## SecureStore

- Sesión de Supabase (`lib/supabase.ts`).
- Tokens OAuth de Google Calendar (`lib/googleCalendar.ts`) → [[google-calendar]].

> [!question] Las notas y dibujos del calendario son solo locales: se pierden al cambiar de dispositivo y no se comparten en un salón. ¿Es intencional?

## Relacionado

[[ui-y-tema]] · [[i18n]] · [[notificaciones]] · [[estado-servidor-y-offline]]

---
tipo: concepto
tags: [arquitectura, tanstack-query, offline, cache]
actualizado: 2026-11-13
fuentes:
  - lib/queryClient.ts
  - lib/networkConfig.ts
  - lib/supabase.ts
  - app/_layout.tsx
  - components/ui/OfflineBanner.tsx
  - hooks/
---

# Estado de servidor y modo offline

Todo dato de Supabase pasa por **TanStack Query v5**. La cache se persiste en el dispositivo para que la app funcione sin red.

## Configuración (`lib/queryClient.ts`)

| Opción | Valor | Motivo |
| --- | --- | --- |
| `staleTime` | 5 min | |
| `gcTime` | 24 h | necesario para que la persistencia tenga qué guardar |
| `queries.networkMode` | `offlineFirst` | sin red usa la cache en lugar de fallar |
| `mutations.networkMode` | `online` | sin red la mutación se **pausa** y se reanuda al reconectar |
| `retry` | 2 | queries y mutaciones |

- Persistencia: `PersistQueryClientProvider` + `createAsyncStoragePersister` con key `manicurist-rq-cache-v1` (throttle 1 s).
- `configureNetworkManager()` (`lib/networkConfig.ts`) conecta el `onlineManager` de TanStack con NetInfo.
- `OfflineBanner` muestra el estado sin conexión.

## Cliente Supabase (`lib/supabase.ts`)

- `createClient<Database>` tipado.
- Sesión guardada en **SecureStore** con fallback a AsyncStorage; `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`.
- Variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`.env.local`).

## Convenciones de hooks

- Un archivo por entidad en `hooks/`, exporta una constante `XXX_KEY` (`APPOINTMENTS_KEY`, `CLIENTS_KEY`…).
- Query keys: `[...KEY, ...params, organizationId]`.
- Mutaciones invalidan la key raíz en `onSuccess`/`onSettled`.
- Mutaciones **optimistas** (con rollback en `onError`) solo en estado y reprogramación de [[cita]].
- Errores: se lanza el `error` de Supabase; la UI lo muestra con `useError()` / `useToast()`.

> [!warning] Hay llamadas a `supabase` fuera de `hooks/` (onboarding, detalle de cita, ajustes, calendario, `PhotoPickerField`, `useGoogleCalendar` escribe en `appointments`). Ver [[deuda-tecnica]].

## Relacionado

[[multi-tenancy]] · [[cita]] · [[navegacion-y-auth]] · [[preferencias-locales]]

---
tipo: concepto
tags: [arquitectura, navegacion, auth, expo-router]
actualizado: 2026-11-13
fuentes:
  - app/_layout.tsx
  - app/(tabs)/_layout.tsx
  - app/(auth)/login.tsx
  - app/auth-callback.tsx
  - app/onboarding.tsx
---

# Navegación, auth y árbol de providers

## Rutas (expo-router)

```text
app/
  _layout.tsx            Stack raíz + AuthGuard + providers
  (auth)/login, register Públicas
  auth-callback.tsx      Recibe el redirect OAuth (tokens en el fragmento #)
  onboarding.tsx         Crear organización (2 pasos)
  (tabs)/                index · calendar · clients/index · clients/[id] (oculta) · polishes/index · incomes · settings
  appointments/new       modal
  appointments/[id]      detalle
  clients/new            modal
  polishes/new, [id]     modal
  polishes/edit          fade_from_bottom
  settings/services, brands, racks, labels
```

Modales: `presentation: 'modal'`, `animation: 'slide_from_bottom'`, gestos de cierre activos.

El layout de tabs (`app/(tabs)/_layout.tsx`) se adapta a **tablet** (iconos más grandes, barra lateral; existe `TabletQuickActionFab`).

## AuthGuard (`app/_layout.tsx`)

Espera a que carguen sesión y organización y luego:

| Estado | Redirige a |
| --- | --- |
| Sin sesión, fuera de `(auth)` | `/(auth)/login` |
| Con sesión, dentro de `(auth)` | `/(tabs)` o `/onboarding` |
| Con sesión, sin org, fuera de onboarding | `/onboarding` |
| Con sesión y org, en onboarding | `/(tabs)` |

## Login

- Email + password (`signInWithPassword`).
- Google vía Supabase OAuth con `redirectTo: 'manicuristapp://auth-callback'`; los tokens se leen del fragmento de la URL y se llama a `setSession` (en `auth-callback.tsx` y también en el listener de deep links del layout raíz).

## Árbol de providers (de fuera a dentro)

```text
PersistQueryClientProvider
  ThemeProvider → I18nProvider → CurrencyProvider → OrganizationProvider
    → PolishLabelsProvider → TimeFormatProvider → DrawingPadProvider
      → ToastProvider → ConfirmProvider → ErrorProvider → NotificationProvider
        → AppContent (AuthGuard + StatusBar + ToastRenderer + OfflineBanner + SplashAnimation)
```

`PolishLabelsProvider` va **dentro** de `OrganizationProvider` porque consulta etiquetas por org.

Contextos de UI transversales: `useToast()`, `useConfirm()` (diálogo de confirmación), `useError()` (diálogo de error).

## Arranque

`SplashScreen.preventAutoHideAsync()` → se oculta el splash nativo → `SplashAnimation` propia se muestra hasta que termina la animación **y** cargan sesión y org. También se configuran notificaciones y permisos ([[notificaciones]]).

## Relacionado

[[organizacion]] · [[estado-servidor-y-offline]] · [[ui-y-tema]] · [[preferencias-locales]]

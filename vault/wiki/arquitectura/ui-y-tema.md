---
tipo: concepto
tags: [arquitectura, ui, tema, componentes]
actualizado: 2026-11-13
fuentes:
  - CLAUDE.md
  - lib/theme.ts
  - context/ThemeContext.tsx
  - components/ui/
---

# UI, componentes y tema

## Regla de oro

Toda pieza de UI reutilizable vive en `components/ui/` con sus propios estilos. **Las pantallas solo componen** — no definen colores, tipografía ni layout primitivo inline. El patrón completo (estilos estáticos en `StyleSheet.create`, colores inline desde el tema, props `variant`/`tone`/`style`, `forwardRef` en inputs) está documentado en `CLAUDE.md` raíz.

## Tema (`lib/theme.ts`, `context/ThemeContext.tsx`)

- `ColorScheme = 'light' | 'dark' | 'system'`, guardado en AsyncStorage (`@app_color_scheme`).
- `useTheme()` → `{ colors, isDark, colorScheme, setColorScheme }`.
- Color de marca: `primary = #c084fc` (lila) en ambos modos.
- Tokens: `primary, onPrimary, primaryMuted, background, card, text, textSecondary, textTertiary, border, inputBackground, tabBar, shadow, overlay, statusPending/Text, statusCompleted/Text, statusCancelled/Text, danger, dangerMuted, dangerBorder`.
- El provider no renderiza nada hasta leer la preferencia guardada (evita parpadeo).

## Catálogo de componentes (`components/ui/`)

| Grupo | Componentes |
| --- | --- |
| Base temática | `ThemedText`, `ThemedButton`, `ThemedInput`, `ThemedView`, `ThemedIcon`, `ThemedField`, `ThemedSection`, `ThemedDropdown`, `ThemedCalendar`, `ScreenHeader`, `SelectableChip`, `PasswordInput` |
| Fechas | `AppDatePicker` |
| Color | `ColorPickerField`, `CompactColorPicker` |
| Fotos | `PhotoPickerField`, `PhotoPreviewModal` → [[fotos-y-storage]] |
| Esmaltes | `PolishFormModal`, `PolishDetailModal`, `PolishEffectOverlay` → [[esmalte]] |
| Citas / ingresos | `IncomeConfirmModal` → [[ingreso]] |
| Calendario | `CalendarNotesPad` (notas + dibujo por día) |
| Infraestructura | `Toast`, `OfflineBanner`, `SplashAnimation`, `SwipeToDismissModal`, `TabletQuickActionFab` |

> [!note] Desde `47f7412` `CLAUDE.md` raíz lista todo el catálogo.

> [!warning] Hay ~34 líneas con colores HEX literales en `app/` y `components/` (algunas son paletas legítimas del selector de color). Ver [[deuda-tecnica]].

## Relacionado

[[i18n]] · [[navegacion-y-auth]] · [[preferencias-locales]]

---
tipo: entidad
tags: [dominio, esmaltes, inventario]
actualizado: 2026-11-13
fuentes:
  - hooks/usePolishes.ts
  - hooks/usePolishBrands.ts
  - hooks/usePolishLabels.ts
  - context/PolishLabelsContext.tsx
  - app/(tabs)/polishes/index.tsx
  - app/polishes/[id].tsx
  - components/ui/PolishFormModal.tsx
  - components/ui/PolishEffectOverlay.tsx
  - supabase/migration.sql
---

# Esmalte (inventario)

Cada frasco de esmalte de la organización, con su color, marca, ubicación física en un [[esmaltero]] y stock. Es el área con más código de la app (la pantalla de inventario tiene ~1300 líneas).

## Tabla `nail_polishes`

| Columna | Notas |
| --- | --- |
| `brand` | **texto legacy**, requerido; aún se usa para ordenar |
| `brand_id` | FK a `nail_polish_brands`, `ON DELETE SET NULL` |
| `polish_code` | código del fabricante, requerido |
| `color_name`, `hex_color` | nombre y color HEX |
| `base_color` | clave de *color base* (red, pink, nude…) |
| `tone_family` | clave de *familia de tono* (classic, pastel, neon…) |
| `effect` | `matte, shimmer, glitter, cat_eye, holographic, duochrome, translucent, nude` o `NULL` |
| `rack_id`, `rack_position` | ubicación → [[esmaltero]] |
| `stock` | entero, default 1 |
| `photo_url`, `notes` | foto en bucket `polish-photos` → [[fotos-y-storage]] |

## Etiquetas: colores base y familias de tono

- Tablas `polish_base_colors` y `polish_tone_families` (`key, label, sort_order`, y `hex_color` en colores base), editables en **Ajustes → Etiquetas** (`app/settings/labels.tsx`).
- `PolishLabelsContext` combina las **claves integradas** (traducidas por i18n) con las personalizadas de la BD:
  - Base: `red, orange, yellow, green, mint, turquoise, blue, navy, purple, pink, brown, gray`
  - Tono: `classic, pastel, neon, nude, deep`
- `labelToKey(label)` genera la clave a partir del texto.
- La `key` es única **por organización** (`uq_base_color_key_org`, `uq_tone_family_key_org`). Hasta `47f7412` era única global y una segunda org no podía repetir una etiqueta, ni siquiera sobrescribir el texto de una integrada.

## Marcas

Tabla `nail_polish_brands (name, organization_id)`, único por `(name, organization_id)`. Gestión en `app/settings/brands.tsx`; hooks en `hooks/usePolishBrands.ts` (el create reutiliza una marca existente con el mismo nombre, sin distinguir mayúsculas).

## Hooks (`hooks/usePolishes.ts`)

| Hook | Notas |
| --- | --- |
| `usePolishes()` | Lista de la org ordenada por `brand`, `color_name` |
| `usePolish(id)` | Detalle con `initialData` tomado de la lista en cache |
| `useCreate/Update/DeletePolish` | |
| `useMovePolish()` | Mover/intercambiar/desplazar en el esmaltero → [[esmaltero]] |

## Pantalla de inventario (`app/(tabs)/polishes/index.tsx`)

- Vistas: `grid`, `list`, `swatch`.
- Filtros: marca, esmaltero, stock (todos / con / sin), color base, familia de tono.
- Orden: `recent, color, brand, code, position` + asc/desc.
- Modo mover: mapa de posiciones del esmaltero para recolocar esmaltes. (Hasta `47f7412` fallaba con un `ReferenceError`: `SwatchSection` no desestructuraba la prop `movePolish`.)
- `PolishEffectOverlay` dibuja el efecto (glitter, cat eye…) sobre el swatch.
- Alta/edición en `PolishFormModal`; detalle en `app/polishes/[id].tsx` / `PolishDetailModal`.

## Relación con citas

`appointment_polishes` registra qué esmaltes se usaron en cada [[cita]]. El stock **no** se descuenta automáticamente.

## Relacionado

[[esmaltero]] · [[cita]] · [[ui-y-tema]] · [[i18n]]

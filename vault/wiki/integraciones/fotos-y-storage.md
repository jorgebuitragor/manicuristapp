---
tipo: integracion
tags: [integraciones, supabase-storage, fotos]
actualizado: 2026-11-13
fuentes:
  - hooks/usePhotoStorage.ts
  - components/ui/PhotoPickerField.tsx
  - components/ui/PhotoPreviewModal.tsx
  - supabase/migration.sql
---

# Fotos y Supabase Storage

## Buckets (públicos)

| Bucket | Ruta del objeto | Columna | Entidad |
| --- | --- | --- | --- |
| `design-photos` | `<orgId>/designs/<appointmentId>.webp` | `appointments.design_photo_url` | [[cita]] |
| `polish-photos` | `<orgId>/polishes/<polishId \| tempId>.webp` | `nail_polishes.photo_url` | [[esmalte]] |
| `service-photos` | `<orgId>/services/<serviceId \| tempId>.webp` | `services.photo_url` | [[servicio]] |

**La primera carpeta tiene que ser el `organization_id`**: las políticas `org_photos_select/insert/update/delete` rechazan cualquier otra ruta → [[multi-tenancy]]. Los callers pasan solo `designs/<id>`; el prefijo de la org lo pone el hook.

## `usePhotoStorage(bucket)` (`hooks/usePhotoStorage.ts`)

- `upload(storagePath, arrayBuffer)` → sube `<orgId>/<storagePath>.webp` con `upsert` y devuelve la URL pública.
- `remove(publicUrl)` → saca la ruta de la URL guardada en la BD (`storagePathFromPublicUrl`) y la borra. Borrar a partir de la URL, en vez de reconstruir la ruta, también limpia las fotos subidas con un `tempId`.

## `PhotoPickerField`

1. Elige la imagen (cámara o galería, `expo-image-picker`).
2. La redimensiona (ancho 500 px por defecto) y la convierte a **WEBP** con `expo-image-manipulator`.
3. `usePhotoStorage.upload` → `onUploadComplete(url)`.
4. Quitar foto → `usePhotoStorage.remove(currentUrl)` (best-effort) → `onRemove()`.

`PhotoPreviewModal` muestra la foto en grande y permite guardarla o compartirla (`expo-media-library` / `expo-sharing`).

## Fotos antiguas (antes de `47f7412`)

Las fotos subidas antes del cambio (en producción, **las 108** a 2026-11-13: 104 de esmaltes, 3 de diseños, 1 de servicio) están en rutas sin carpeta de org (`designs/<id>.webp`). Se siguen **viendo** (bucket público), pero la app ya no puede sobrescribirlas ni borrarlas: al cambiar o quitar una se sube la nueva a la ruta con org y la antigua queda huérfana en el bucket.

> [!question] ¿Migrar las fotos antiguas a la carpeta de su org (con un script contra la API de Storage) o limpiar los huérfanos a mano?

## Huérfanos conocidos

- Las fotos de esmaltes y servicios nuevos se suben con un `tempId` antes de existir el registro; si se cancela el formulario, el archivo queda huérfano.
- En los formularios (esmalte, servicio) la URL nueva se guarda al pulsar "Guardar". Por eso **no** se borra la foto anterior al subir otra: si la usuaria cancelara, el registro apuntaría a un archivo borrado. A cambio, cambiar la foto puede dejar la anterior huérfana cuando las rutas difieren.

→ Candidato a una limpieza periódica. Ver [[deuda-tecnica]].

## Relacionado

[[cita]] · [[esmalte]] · [[servicio]] · [[multi-tenancy]]

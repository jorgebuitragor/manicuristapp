---
tipo: integracion
tags: [integraciones, supabase-storage, fotos]
actualizado: 2026-11-13
fuentes:
  - components/ui/PhotoPickerField.tsx
  - components/ui/PhotoPreviewModal.tsx
  - supabase/migration.sql
---

# Fotos y Supabase Storage

## Buckets (públicos)

| Bucket | Ruta del objeto | Columna | Entidad |
| --- | --- | --- | --- |
| `design-photos` | `designs/<appointmentId>.webp` | `appointments.design_photo_url` | [[cita]] |
| `polish-photos` | `polishes/<polishId \| tempId>.webp` | `nail_polishes.photo_url` | [[esmalte]] |
| `service-photos` | `services/<serviceId \| tempId>.webp` | `services.photo_url` | [[servicio]] |

## `PhotoPickerField`

1. Elige imagen (`expo-image-picker`).
2. Redimensiona (ancho 500 px por defecto) y convierte a **WEBP** comprimido con `expo-image-manipulator`.
3. `upload(path, …, { upsert: true })` y obtiene `getPublicUrl`.
4. Quitar foto → `remove([path])`.

`PhotoPreviewModal` muestra la foto en grande (con opción de guardar/compartir vía `expo-media-library` / `expo-sharing`).

> [!question] Al crear un esmalte o servicio nuevo se sube con un `tempId`; el objeto queda con ese nombre aunque luego se cree el registro con otro id. ¿Se renombra o quedan huérfanos? Verificar.

> [!warning] Las rutas **no incluyen el `organization_id`** y las políticas de storage solo comprueban el bucket: cualquier usuario autenticado podría sobrescribir fotos de otra org si conoce el id; la lectura es pública. Ver [[multi-tenancy]] y [[discrepancias]].

> [!warning] `PhotoPickerField` llama a `supabase.storage` directamente desde un componente de UI. Ver [[deuda-tecnica]].

## Relacionado

[[cita]] · [[esmalte]] · [[servicio]] · [[multi-tenancy]]

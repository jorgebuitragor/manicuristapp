---
tipo: pendiente
tags: [pendientes, roadmap, multi-tenancy, salon]
actualizado: 2026-11-13
fuentes:
  - CLAUDE.md
  - supabase/migration.sql
---

# Roadmap: salón con varias profesionales

Hoy una organización de tipo `salon` solo puede tener a su owner. El diseño propuesto (en `CLAUDE.md` raíz) es un **sistema de invitaciones por código**.

## Flujo propuesto

```text
Owner crea el salón
  → genera un código (ej. GLOW-4821) en Ajustes
  → la profesional instala la app y en el onboarding elige "Unirme a un salón"
  → introduce el código → queda en la misma org con role 'member'
  → entra con su propio correo y ve los datos compartidos
```

## Piezas a implementar

| Pieza | Descripción |
| --- | --- |
| Tabla `org_invites` | `id, organization_id, code UNIQUE, expires_at, max_uses, uses_count` |
| RPC `join_organization(code)` | Valida el código e inserta en `organization_members` (SECURITY DEFINER) |
| Onboarding paso 1 | Tercera opción "Unirme a un salón existente" |
| Ajustes → "Invitar profesional" | Solo para owners de salón; genera y comparte el código |
| RLS `org_invites` | El owner crea y ve; cualquier autenticado puede validar |

## Consideraciones detectadas en el vault

Cosas a resolver junto con esta funcionalidad (vienen de otras páginas):

1. **Cerrar `member_self_insert`**: hoy cualquiera puede insertarse en una org conociendo su id. El join solo debería ser posible vía `join_organization`. → [[multi-tenancy]]
2. **RLS de `org_invites`**: "cualquier autenticado puede leer" expone todos los códigos; mejor validar solo dentro de la RPC y no dar SELECT.
3. **`create_organization` y `join_organization` versionadas en la migración** → [[discrepancias]].
4. **Profesional en la cita**: `appointments.professional_id` existe pero no se asigna al crear. Hace falta para filtrar "mis citas" y para colorear por profesional. → [[organizacion]], [[cita]]
5. **Google Calendar por profesional**: los tokens son por dispositivo, pero `google_event_id` es de la cita. → [[google-calendar]]
6. **Notificaciones locales**: el recordatorio solo se programa en el dispositivo que crea la cita. → [[notificaciones]]
7. **Notas del calendario** solo locales. → [[preferencias-locales]]
8. **Permisos owner vs member**: ¿puede un member borrar clientes, ver ingresos o editar servicios? Hoy RLS no distingue por rol.
9. **Una org por usuario** (`LIMIT 1` en `get_my_org_id()`): mantener o rediseñar.

## Relacionado

[[organizacion]] · [[multi-tenancy]] · [[deuda-tecnica]]

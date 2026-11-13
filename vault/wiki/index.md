---
tipo: overview
tags: [indice]
actualizado: 2026-11-13
---

# Índice del vault

Catálogo de todas las páginas. **Leer primero** en cualquier consulta. Reglas de mantenimiento en `vault/CLAUDE.md`.

## Visión general

- [[overview]] — Qué es la app, stack, mapa de entidades, tabs y estado actual
- [[log]] — Registro cronológico de operaciones sobre el vault

## Dominio

- [[organizacion]] — Tenant, miembros, profesionales y flujo de onboarding
- [[cliente]] — Tabla `clients`, cumpleaños, ficha e historial
- [[cita]] — Entidad central: estados, servicios/esmaltes N:M, conflictos, realtime, flujos
- [[servicio]] — Catálogo con duración, precio y foto
- [[esmalte]] — Inventario: color, marca, efectos, etiquetas base/tono, filtros y vistas
- [[esmaltero]] — Racks físicos, posiciones únicas, mover/intercambiar
- [[ingreso]] — Cobros por cita, resumen y estadísticas, moneda

## Arquitectura

- [[multi-tenancy]] — RLS con `get_my_org_id()` + filtros en hooks; huecos conocidos
- [[esquema-bd]] — Tablas, relaciones, funciones, buckets, realtime, tipos
- [[estado-servidor-y-offline]] — TanStack Query, persistencia, offline, convenciones de hooks
- [[navegacion-y-auth]] — Rutas, AuthGuard, login/OAuth, árbol de providers, arranque
- [[ui-y-tema]] — Regla de componentes, tokens de tema, catálogo de `components/ui/`
- [[i18n]] — Diccionarios es/en, `useI18n`, espacios de claves
- [[preferencias-locales]] — Todo lo guardado en AsyncStorage / SecureStore

## Integraciones

- [[notificaciones]] — Recordatorios de cita y cumpleaños (locales)
- [[google-calendar]] — Sync unidireccional, OAuth y tokens
- [[fotos-y-storage]] — Buckets, rutas, compresión WEBP

## Pendientes

- [[roadmap-salon-multi-profesional]] — Invitaciones por código + consideraciones abiertas
- [[deuda-tecnica]] — `TECH_DEBT.md` + hallazgos del vault
- [[discrepancias]] — Contradicciones código ↔ docs ↔ BD (checklist)

## Fuentes

- [[llm-wiki-pattern]] — El patrón LLM Wiki y cómo se adaptó aquí

## Consultas archivadas

_(ninguna todavía — se guardan en `wiki/consultas/`)_

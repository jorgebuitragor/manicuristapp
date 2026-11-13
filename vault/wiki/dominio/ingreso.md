---
tipo: entidad
tags: [dominio, ingresos, finanzas]
actualizado: 2026-11-13
fuentes:
  - lib/dates.ts
  - hooks/useIncomes.ts
  - app/(tabs)/incomes.tsx
  - components/ui/IncomeConfirmModal.tsx
  - context/CurrencyContext.tsx
  - supabase/migration.sql
---

# Ingreso

Dinero cobrado, normalmente asociado a una [[cita]] completada.

## Tabla `incomes`

| Columna | Notas |
| --- | --- |
| `appointment_id` | **UNIQUE**, nullable, `ON DELETE SET NULL` → como mucho un ingreso por cita; sobrevive si se borra la cita |
| `amount` | `numeric(10,2)` |
| `notes` | |
| `date` | `date`, default hoy |
| `organization_id` | [[multi-tenancy]] |

## Flujo

1. En el detalle de la cita, el estado pasa a `completed`.
2. Si no existe ingreso (`useIncomeByAppointment`), se abre `IncomeConfirmModal` para confirmar monto y notas.
3. `useCreateIncome` inserta con `organization_id`.

## Hooks (`hooks/useIncomes.ts`)

| Hook | Qué calcula |
| --- | --- |
| `useIncomes()` | Lista con cita, cliente y servicios relacionados |
| `useIncomeByAppointment(id)` | Ingreso de una cita |
| `useCreate/Update/DeleteIncome` | |
| `useIncomeSummary()` | Totales de hoy / semana / mes (semana empieza en lunes) |
| `useIncomeStats(period)` | `period ∈ week, month, year, all`: total, nº, media, top 5 clientes (por monto), top 5 servicios (por conteo) y datos del gráfico |

Toda la agregación se hace **en el cliente** sobre las filas descargadas.

- Etiquetas del gráfico con `Intl` según el idioma (`locale` va en la query key para que cambien al cambiar de idioma); semanas del mes con `incomes.chart.weekPrefix` (S/W).

- "Hoy", "inicio de semana" y la **fecha del ingreso** se calculan en la zona del dispositivo con `lib/dates.ts`. Antes se usaba UTC: en Colombia, un cobro después de las 19:00 quedaba con fecha de mañana (y el `DEFAULT CURRENT_DATE` de la BD también es UTC, por eso ahora la app envía `date`).

## Moneda

`CurrencyContext` guarda el símbolo elegido (`€, $, £, COP, MXN, ARS, CLP, PEN`) en el dispositivo; algunas monedas no usan decimales. Ver [[preferencias-locales]].

## Relacionado

[[cita]] · [[servicio]] · [[cliente]] · [[preferencias-locales]]

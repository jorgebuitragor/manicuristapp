---
tipo: entidad
tags: [dominio, ingresos, finanzas]
actualizado: 2026-11-13
fuentes:
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

> [!warning] Las etiquetas del gráfico (`'Lun'…'Dom'`, `'Ene'…'Dic'`, `S1…S4`) están en español dentro del hook, sin pasar por [[i18n]]. Ver [[deuda-tecnica]].

> [!question] Las fechas "hoy"/"inicio de semana" se calculan con `toISOString().slice(0,10)` (UTC). Cerca de medianoche en zonas como América (UTC-5) el día puede desfasarse. Verificar.

## Moneda

`CurrencyContext` guarda el símbolo elegido (`€, $, £, COP, MXN, ARS, CLP, PEN`) en el dispositivo; algunas monedas no usan decimales. Ver [[preferencias-locales]].

## Relacionado

[[cita]] · [[servicio]] · [[cliente]] · [[preferencias-locales]]

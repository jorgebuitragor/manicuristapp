/**
 * Fechas de calendario (YYYY-MM-DD) en la zona horaria del dispositivo.
 *
 * No usar `toISOString().slice(0, 10)` para esto: devuelve la fecha en UTC,
 * que en América (UTC-5…) ya es "mañana" por la noche y en Europa (UTC+1…)
 * es "ayer" a medianoche.
 */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Hoy en la zona del dispositivo, `YYYY-MM-DD`. */
export function todayLocalISODate(): string {
  return toLocalISODate(new Date());
}

/** Lunes de la semana de `d` (semana de lunes a domingo), `YYYY-MM-DD`. */
export function startOfWeekLocalISODate(d: Date): string {
  const monday = new Date(d);
  const offset = (d.getDay() + 6) % 7; // lunes = 0 … domingo = 6
  monday.setDate(d.getDate() - offset);
  return toLocalISODate(monday);
}

/** Convierte `YYYY-MM-DD` en un Date a mediodía local (seguro ante cambios de hora). */
export function fromLocalISODate(s: string): Date {
  return new Date(`${s}T12:00:00`);
}

/** Primera letra en mayúscula (Intl devuelve "lun", "ene"… en español). */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

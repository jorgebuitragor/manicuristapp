import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toLocalISODate,
  todayLocalISODate,
  startOfWeekLocalISODate,
  fromLocalISODate,
  capitalize,
} from '../lib/dates.ts';

// CI corre este archivo con varias TZ (ver package.json → test:tz).

test('toLocalISODate usa la fecha local, no la UTC', () => {
  // 22:30 local: en UTC-5 ya es el día siguiente en UTC
  assert.equal(toLocalISODate(new Date(2026, 10, 13, 22, 30)), '2026-11-13');
  // 00:05 local: en UTC+1 todavía es el día anterior en UTC
  assert.equal(toLocalISODate(new Date(2026, 10, 13, 0, 5)), '2026-11-13');
  assert.equal(toLocalISODate(new Date(2026, 0, 1, 23, 59)), '2026-01-01');
});

test('todayLocalISODate coincide con toLocalISODate(new Date())', () => {
  assert.equal(todayLocalISODate(), toLocalISODate(new Date()));
});

test('startOfWeekLocalISODate devuelve el lunes de esa semana', () => {
  const cases: Array<[string, string]> = [
    ['2026-11-09', '2026-11-09'], // lunes → sí mismo
    ['2026-11-13', '2026-11-09'], // viernes
    ['2026-11-15', '2026-11-09'], // domingo → lunes anterior (semana lunes-domingo)
    ['2026-03-01', '2026-02-23'], // cruza de mes
    ['2027-01-02', '2026-12-28'], // cruza de año
  ];
  for (const [day, monday] of cases) {
    assert.equal(startOfWeekLocalISODate(fromLocalISODate(day)), monday, day);
  }
});

test('fromLocalISODate → toLocalISODate es ida y vuelta', () => {
  for (const d of ['2026-03-29', '2026-10-25', '2026-11-02', '2026-12-31']) {
    assert.equal(toLocalISODate(fromLocalISODate(d)), d);
  }
});

test('capitalize', () => {
  assert.equal(capitalize('lun'), 'Lun');
  assert.equal(capitalize(''), '');
});

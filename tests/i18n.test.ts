import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translations, interpolate, translate, localeFor } from '../lib/i18n.ts';

const es = translations.es;
const en = translations.en;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('español e inglés tienen exactamente las mismas claves', () => {
  const soloEs = Object.keys(es).filter((k) => !(k in en));
  const soloEn = Object.keys(en).filter((k) => !(k in es));
  assert.deepEqual(soloEs, [], `Claves sin traducir al inglés: ${soloEs.join(', ')}`);
  assert.deepEqual(soloEn, [], `Claves sin traducir al español: ${soloEn.join(', ')}`);
});

test('ninguna traducción está vacía', () => {
  for (const [lang, dict] of Object.entries(translations)) {
    const vacias = Object.entries(dict).filter(([, v]) => v.trim() === '').map(([k]) => k);
    assert.deepEqual(vacias, [], `${lang}: traducciones vacías: ${vacias.join(', ')}`);
  }
});

test('cada clave usa los mismos {placeholders} en ambos idiomas', () => {
  const distintos = Object.keys(es)
    .filter((k) => k in en)
    .filter((k) => placeholders(es[k]).join() !== placeholders(en[k]).join());
  assert.deepEqual(distintos, [], `Placeholders distintos en: ${distintos.join(', ')}`);
});

test('interpolate reemplaza variables y deja intactas las desconocidas', () => {
  assert.equal(interpolate('En {minutes} min: {client}', { minutes: 15, client: 'Ana' }), 'En 15 min: Ana');
  assert.equal(interpolate('Hola {x}', {}), 'Hola {x}');
});

test('translate traduce, interpola y cae a la clave si no existe', () => {
  assert.equal(
    translate('en', 'notifications.reminder.body', { minutes: 10, client: 'Ana' }),
    'In 10 min: Ana',
  );
  assert.equal(translate('es', 'clave.que.no.existe'), 'clave.que.no.existe');
});

test('localeFor', () => {
  assert.equal(localeFor('es'), 'es-ES');
  assert.equal(localeFor('en'), 'en-US');
});

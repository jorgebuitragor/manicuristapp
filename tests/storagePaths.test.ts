import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storagePathFromPublicUrl, orgStoragePath } from '../lib/storagePaths.ts';

const BASE = 'https://abc.supabase.co/storage/v1/object/public';
const ORG = '3f2a0000-0000-0000-0000-000000000001';

test('orgStoragePath pone la carpeta de la organización y la extensión', () => {
  assert.equal(orgStoragePath(ORG, 'designs/apt-1'), `${ORG}/designs/apt-1.webp`);
});

test('storagePathFromPublicUrl recupera la ruta (ida y vuelta)', () => {
  const path = orgStoragePath(ORG, 'polishes/p-1');
  assert.equal(storagePathFromPublicUrl('polish-photos', `${BASE}/polish-photos/${path}`), path);
});

test('ignora query string y decodifica', () => {
  assert.equal(
    storagePathFromPublicUrl('design-photos', `${BASE}/design-photos/${ORG}/designs/a%20b.webp?t=123`),
    `${ORG}/designs/a b.webp`,
  );
});

test('rutas antiguas (sin carpeta de org) también se reconocen', () => {
  assert.equal(storagePathFromPublicUrl('service-photos', `${BASE}/service-photos/services/s-1.webp`), 'services/s-1.webp');
});

test('URL de otro bucket o ajena → null', () => {
  assert.equal(storagePathFromPublicUrl('design-photos', `${BASE}/polish-photos/${ORG}/x.webp`), null);
  assert.equal(storagePathFromPublicUrl('design-photos', 'https://example.com/foto.webp'), null);
});

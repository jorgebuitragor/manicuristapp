export type PhotoBucket = 'design-photos' | 'polish-photos' | 'service-photos';

/**
 * Extrae la ruta del objeto (`<orgId>/designs/<id>.webp`) a partir de la URL
 * pública que se guarda en la BD. Devuelve null si la URL no es de ese bucket.
 */
export function storagePathFromPublicUrl(bucket: PhotoBucket, url: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
}

/** Ruta de un objeto dentro de la carpeta de la organización (la exigen las políticas de storage). */
export function orgStoragePath(organizationId: string, storagePath: string): string {
  return `${organizationId}/${storagePath}.webp`;
}

import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';

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

/**
 * Subida y borrado de fotos en Supabase Storage.
 * Todas las rutas van bajo la carpeta de la organización (`<orgId>/…`):
 * las políticas de storage rechazan cualquier otra ruta.
 */
export function usePhotoStorage(bucket: PhotoBucket) {
  const { organizationId } = useOrganization();

  /** Sube `<orgId>/<storagePath>.webp` y devuelve su URL pública. */
  async function upload(storagePath: string, data: ArrayBuffer): Promise<string> {
    if (!organizationId) throw new Error('No organization');
    const path = `${organizationId}/${storagePath}.webp`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, data, { contentType: 'image/webp', upsert: true });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  /** Borra el objeto al que apunta una URL pública guardada en la BD. */
  async function remove(publicUrl: string): Promise<void> {
    const path = storagePathFromPublicUrl(bucket, publicUrl);
    if (!path) return;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }

  return { upload, remove };
}

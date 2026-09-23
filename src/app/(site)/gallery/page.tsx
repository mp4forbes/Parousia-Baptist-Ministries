import { Suspense } from 'react';
import GalleryClient from '@/components/GalleryClient';
import { getSettings } from '@/lib/actions';
import { canManageGallery } from '@/lib/coordinator-session';
import { listGalleryPhotos } from '@/lib/gallery-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GalleryPage() {
  const [settings, photos, canPost] = await Promise.all([
    getSettings(),
    listGalleryPhotos(),
    canManageGallery(),
  ]);

  return (
    <Suspense fallback={null}>
      <GalleryClient settings={settings} initialPhotos={photos} canPost={canPost} />
    </Suspense>
  );
}

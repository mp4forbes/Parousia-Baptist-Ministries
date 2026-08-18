import { notFound } from 'next/navigation';
import { getAdministrativeCareCategory, getSettings } from '@/lib/actions';
import AdministrativeCareCategoryClient from '@/components/AdministrativeCareCategoryClient';
import { isAdministrativeCareSlug } from '@/lib/site-nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdministrativeCareCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isAdministrativeCareSlug(slug)) {
    notFound();
  }

  const [category, settings] = await Promise.all([
    getAdministrativeCareCategory(slug),
    getSettings(),
  ]);

  if (!category) {
    notFound();
  }

  return <AdministrativeCareCategoryClient category={category} settings={settings} />;
}

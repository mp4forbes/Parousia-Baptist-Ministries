import { getAdministrativeCareCategories, getSettings } from '@/lib/actions';
import AdministrativeCareHubClient from '@/components/AdministrativeCareHubClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdministrativeCareHubPage() {
  const [categories, settings] = await Promise.all([
    getAdministrativeCareCategories(),
    getSettings(),
  ]);

  return <AdministrativeCareHubClient categories={categories} settings={settings} />;
}

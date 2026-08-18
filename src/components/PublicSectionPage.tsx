import PublicHome from '@/components/PublicHome';
import { loadPublicSiteData } from '@/lib/public-site-data';
import type { AboutTab, MinistryNavSlug, PublicSiteSection } from '@/lib/site-nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicSectionPage({
  section,
  aboutTab,
  ministrySlug,
}: {
  section: PublicSiteSection;
  aboutTab?: AboutTab;
  ministrySlug?: MinistryNavSlug;
}) {
  const data = await loadPublicSiteData();
  return (
    <PublicHome
      {...data}
      section={section}
      initialAboutTab={aboutTab}
      initialMinistrySlug={ministrySlug}
    />
  );
}

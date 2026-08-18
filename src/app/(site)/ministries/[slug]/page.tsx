import { notFound } from 'next/navigation';
import PublicSectionPage from '@/components/PublicSectionPage';
import { MINISTRY_NAV_SLUGS, parseMinistrySlug } from '@/lib/site-nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MinistryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(MINISTRY_NAV_SLUGS as readonly string[]).includes(slug)) {
    notFound();
  }
  return <PublicSectionPage section="ministries" ministrySlug={parseMinistrySlug(slug)} />;
}

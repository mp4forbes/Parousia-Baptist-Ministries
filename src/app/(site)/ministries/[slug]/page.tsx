import { notFound } from 'next/navigation';
import PublicSectionPage from '@/components/PublicSectionPage';
import { getMinistries } from '@/lib/actions';
import { parseMinistrySlugFromList } from '@/lib/ministries-nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MinistryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ministries = await getMinistries();
  if (!ministries.some((ministry) => ministry.slug === slug)) {
    notFound();
  }
  return (
    <PublicSectionPage
      section="ministries"
      ministrySlug={parseMinistrySlugFromList(slug, ministries)}
    />
  );
}

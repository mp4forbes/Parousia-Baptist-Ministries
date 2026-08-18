import { notFound } from 'next/navigation';
import PublicSectionPage from '@/components/PublicSectionPage';
import { parseAboutTab, ABOUT_TABS } from '@/lib/site-nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AboutTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!(ABOUT_TABS as readonly string[]).includes(tab) || tab === 'aboutUs') {
    notFound();
  }
  return <PublicSectionPage section="about" aboutTab={parseAboutTab(tab)} />;
}

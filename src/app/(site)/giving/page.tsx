import PublicSectionPage from '@/components/PublicSectionPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GivingPage() {
  return <PublicSectionPage section="giving" />;
}

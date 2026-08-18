import PublicSectionPage from '@/components/PublicSectionPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SermonsPage() {
  return <PublicSectionPage section="sermons" />;
}

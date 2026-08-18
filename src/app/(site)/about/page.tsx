import PublicSectionPage from '@/components/PublicSectionPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AboutPage() {
  return <PublicSectionPage section="about" aboutTab="aboutUs" />;
}

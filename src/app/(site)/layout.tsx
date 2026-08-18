import { getSettings } from '@/lib/actions';
import SiteChrome from '@/components/SiteChrome';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  return <SiteChrome settings={settings}>{children}</SiteChrome>;
}

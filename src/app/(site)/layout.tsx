import { getMinistries, getSettings } from '@/lib/actions';
import SiteChrome from '@/components/SiteChrome';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, ministries] = await Promise.all([getSettings(), getMinistries()]);
  return (
    <SiteChrome settings={settings} ministries={ministries}>
      {children}
    </SiteChrome>
  );
}

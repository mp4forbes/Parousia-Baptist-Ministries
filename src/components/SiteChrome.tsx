'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CoordinatorAccessBanner from '@/components/CoordinatorAccessBanner';
import CoordinatorLoginModal from '@/components/CoordinatorLoginModal';
import { HASH_REDIRECTS } from '@/lib/site-nav';
import { getSiteTheme, siteThemeCssVars } from '@/lib/site-theme';

interface SiteChromeProps {
  settings: Record<string, string>;
  children: React.ReactNode;
}

export default function SiteChrome({ settings, children }: SiteChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = getSiteTheme(settings);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && HASH_REDIRECTS[hash]) {
      router.replace(HASH_REDIRECTS[hash]);
    }
  }, [pathname, router]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={`flex flex-col min-h-screen ${theme.bgMain} font-sans selection:bg-amber-500 selection:text-slate-950`}>
      <style dangerouslySetInnerHTML={{ __html: siteThemeCssVars(theme) }} />
      <SiteHeader settings={settings} />
      <CoordinatorAccessBanner settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <CoordinatorLoginModal isLight={theme.isLight} />
    </div>
  );
}

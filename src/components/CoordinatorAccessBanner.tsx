'use client';

import React from 'react';
import Link from 'next/link';
import { FileSpreadsheet } from 'lucide-react';
import { useCoordinatorSession } from '@/lib/CoordinatorSessionContext';
import { useLanguage } from '@/lib/LanguageContext';
import { hasAnyRegistrantListAccess, registrantAccessLinks } from '@/lib/registrant-scope';
import { getSiteTheme } from '@/lib/site-theme';

const MINISTRY_LABELS: Record<string, { en: string; fr_ht: string }> = {
  women: { en: 'Women', fr_ht: 'Femmes' },
  men: { en: 'Men', fr_ht: 'Hommes' },
  children: { en: 'Children', fr_ht: 'Enfants' },
  missions: { en: 'Missions', fr_ht: 'Missions' },
};

const CARE_LABELS: Record<string, { en: string; fr_ht: string }> = {
  weddings: { en: 'Weddings', fr_ht: 'Mariages' },
  funerals: { en: 'Funerals', fr_ht: 'Funérailles' },
  baptisms: { en: 'Baptisms', fr_ht: 'Baptêmes' },
  'childrens-dedications': { en: 'Children’s dedications', fr_ht: 'Dédicaces d’enfants' },
  'hospice-support': { en: 'Hospice support', fr_ht: 'Soutien hospice' },
};

export default function CoordinatorAccessBanner({ settings }: { settings: Record<string, string> }) {
  const { language, t } = useLanguage();
  const { access, setLoginOpen } = useCoordinatorSession();
  const theme = getSiteTheme(settings);

  if (access.source !== 'coordinator' || !access.email) return null;

  const links = registrantAccessLinks(access);
  const hasLists = hasAnyRegistrantListAccess(access);
  const isHt = language === 'fr_ht';

  const labelFor = (link: (typeof links)[number]) => {
    if (link.kind === 'events') return t.navEvents;
    if (link.kind === 'contact') return t.contactTitle;
    if (link.kind === 'prayer') return t.navPrayerWall;
    if (link.kind === 'gift') return t.coordinatorListGift;
    if (link.kind === 'ministry' && link.slug) {
      return (isHt ? MINISTRY_LABELS[link.slug]?.fr_ht : MINISTRY_LABELS[link.slug]?.en) || link.slug;
    }
    if (link.kind === 'care' && link.slug) {
      return (isHt ? CARE_LABELS[link.slug]?.fr_ht : CARE_LABELS[link.slug]?.en) || link.slug;
    }
    return link.slug || '';
  };

  const panel = theme.isLight
    ? 'bg-amber-50 border-amber-200 text-slate-900'
    : 'bg-amber-500/10 border-amber-500/30 text-amber-100';

  return (
    <div className={`border-b ${panel}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <FileSpreadsheet className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold">
              {t.coordinatorSignedInAs} {access.email}
            </p>
            {access.needsPasswordSetup ? (
              <p className="text-xs mt-1 opacity-80">{t.coordinatorFinishPassword}</p>
            ) : hasLists ? (
              <p className="text-xs mt-1 opacity-80">{t.coordinatorManageTheseLists}</p>
            ) : (
              <p className="text-xs mt-1 opacity-80">{t.coordinatorNoListsAssigned}</p>
            )}
          </div>
        </div>
        {access.needsPasswordSetup ? (
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer shrink-0"
          >
            {t.coordinatorCreatePasswordTitle}
          </button>
        ) : hasLists ? (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={`${link.kind}-${link.slug || link.href}`}
                href={link.href}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                {labelFor(link)}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

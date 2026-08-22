'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, HeartHandshake } from 'lucide-react';
import { pickLocalizedField } from '@/lib/french-content';
import { useLanguage } from '@/lib/LanguageContext';
import type { AdministrativeCareCategory } from '@/lib/db';
import { isAdministrativeCareSlug } from '@/lib/site-nav';
import { getSiteTheme } from '@/lib/site-theme';
import { siteShellClass } from '@/lib/site-layout';
import { parseEventImages } from '@/lib/event-images';
import { AdministrativeCareDefaultArt } from '@/components/AdministrativeCareIcon';
import RegistrantManagerButton from '@/components/RegistrantManagerButton';

interface AdministrativeCareHubClientProps {
  categories: AdministrativeCareCategory[];
  settings: Record<string, string>;
}

export default function AdministrativeCareHubClient({
  categories,
  settings,
}: AdministrativeCareHubClientProps) {
  const { language, t } = useLanguage();
  const theme = getSiteTheme(settings);
  const { isLight, textTitle, textBody, textMuted, bgCard, borderMain } = theme;

  return (
    <section className={`py-24 ${isLight ? 'bg-slate-50' : 'bg-slate-950'} relative`}>
      <div className={siteShellClass}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isLight ? 'bg-slate-200/80 text-amber-800' : 'bg-slate-900 text-amber-400'} text-xs font-semibold mb-6`}>
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{t.careTagline}</span>
          </div>
          <h1 className={`text-3xl sm:text-5xl font-extrabold font-serif ${textTitle} mb-4`}>{t.careHubTitle}</h1>
          <p className={`${textMuted} text-base leading-relaxed`}>{t.careHubSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const title = pickLocalizedField(language, category.title_kreyol, category.title_english);
            const description = pickLocalizedField(language, category.description_kreyol, category.description_english);
            const images = parseEventImages(category.images_json);
            const cover = images[0];
            const slug = isAdministrativeCareSlug(category.slug) ? category.slug : 'weddings';
            return (
              <div
                key={category.slug}
                className={`rounded-3xl ${bgCard} overflow-hidden group hover:border-amber-500/40 transition-all`}
              >
                <Link href={`/administrative-care/${category.slug}`} className="block">
                  {cover ? (
                    <div className={`flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'} min-h-52`}>
                      <img
                        src={cover}
                        alt=""
                        className="w-full max-h-[28rem] object-contain group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <AdministrativeCareDefaultArt
                      slug={slug}
                      isLight={isLight}
                      className={`h-40 border-b ${borderMain} group-hover:scale-[1.02] transition-transform duration-500`}
                      iconClassName="w-20 h-20"
                    />
                  )}
                  <div className="p-6 pb-0">
                    <h2 className={`text-xl font-bold font-serif ${textTitle} mb-3`}>{title}</h2>
                    <p className={`${textBody} text-sm leading-relaxed line-clamp-4 mb-5`}>{description}</p>
                  </div>
                </Link>
                <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
                  <RegistrantManagerButton
                    scope={{ kind: 'care', slug: category.slug }}
                    isLight={isLight}
                  />
                  <Link
                    href={`/administrative-care/${category.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-amber-500"
                  >
                    {language === 'fr_ht' ? 'Voir la page' : 'View page'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

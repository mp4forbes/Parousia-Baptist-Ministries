'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { AdministrativeCareCategory } from '@/lib/db';
import { getSiteTheme } from '@/lib/site-theme';
import { parseEventImages } from '@/lib/event-images';
import AdministrativeCareForm from '@/components/AdministrativeCareForm';
import type { AdministrativeCareSlug } from '@/lib/site-nav';

interface AdministrativeCareCategoryClientProps {
  category: AdministrativeCareCategory;
  settings: Record<string, string>;
}

export default function AdministrativeCareCategoryClient({
  category,
  settings,
}: AdministrativeCareCategoryClientProps) {
  const { language, t } = useLanguage();
  const theme = getSiteTheme(settings);
  const { isLight, textTitle, textBody, textMuted, bgCard, bgInput, borderMain } = theme;
  const title = language === 'fr_ht' ? category.title_kreyol : category.title_english;
  const description = language === 'fr_ht' ? category.description_kreyol : category.description_english;
  const images = parseEventImages(category.images_json);
  const [activeImage, setActiveImage] = useState(0);

  return (
    <section className={`py-16 sm:py-24 ${isLight ? 'bg-slate-50' : 'bg-slate-950'} relative`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/administrative-care"
          className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 ${isLight ? 'text-slate-600 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`}
        >
          <ChevronLeft className="w-4 h-4" />
          {t.navAdministrativeCare}
        </Link>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isLight ? 'bg-slate-200/80 text-amber-800' : 'bg-slate-900 text-amber-400'} text-xs font-semibold mb-6`}>
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{t.careTagline}</span>
          </div>
          <h1 className={`text-3xl sm:text-5xl font-extrabold font-serif ${textTitle} mb-4`}>{title}</h1>
          <p className={`${textBody} text-base leading-relaxed whitespace-pre-wrap`}>{description}</p>
        </div>

        {images.length > 0 && (
          <div className={`mb-12 rounded-3xl ${bgCard} overflow-hidden`}>
            <div className={`flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
              <img
                src={images[activeImage] || images[0]}
                alt=""
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className={`flex gap-3 p-4 overflow-x-auto border-t ${borderMain}`}>
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-auto max-w-24 rounded-lg overflow-hidden border-2 shrink-0 ${isLight ? 'bg-slate-100' : 'bg-slate-950'} ${index === activeImage ? 'border-amber-500' : 'border-transparent'}`}
                  >
                    <img src={image} alt="" className="h-full w-auto max-w-24 object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`rounded-3xl ${bgCard} p-6 sm:p-10`}>
          <AdministrativeCareForm
            slug={category.slug as AdministrativeCareSlug}
            categoryTitle={title}
            language={language}
            isLight={isLight}
            textTitle={textTitle}
            textBody={textBody}
            textMuted={textMuted}
            bgInput={bgInput}
          />
        </div>
      </div>
    </section>
  );
}

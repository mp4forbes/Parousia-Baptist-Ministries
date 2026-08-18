'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAdminUi } from '@/lib/AdminUiContext';
import { getSiteTheme } from '@/lib/site-theme';

interface SiteFooterProps {
  settings: Record<string, string>;
}

export default function SiteFooter({ settings }: SiteFooterProps) {
  const { language, t } = useLanguage();
  const showAdminNav = useAdminUi();
  const theme = getSiteTheme(settings);
  const { isLight, logoUrl, bgFooter, borderMain, borderDivider, textTitle } = theme;

  return (
    <footer className={`${bgFooter} border-t ${borderMain} pt-20 pb-8 relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 cursor-pointer group">
              <div className={`w-8 h-8 rounded bg-white border ${isLight ? 'border-slate-200' : 'border-slate-800'} overflow-hidden flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-300`}>
                <img src={logoUrl} alt="Eglise Baptiste de la Parousie Logo" className="w-full h-full object-contain" />
              </div>
              <h5 className={`font-bold font-serif text-lg ${textTitle} group-hover:text-amber-500 transition-colors duration-300`}>{t.churchName}</h5>
            </Link>
            <p className={`text-sm leading-relaxed mb-6 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {language === 'fr_ht' ? settings.pastor_message_kreyol : settings.pastor_message_english}
            </p>
          </div>

          <div>
            <h5 className={`font-bold uppercase text-xs tracking-widest mb-4 ${textTitle}`}>{t.contactTitle}</h5>
            <ul className={`space-y-4 text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <li className="flex gap-2.5 items-start">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{settings.church_phone || '+1 (954) 555-1234'}</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <Mail className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{settings.church_email || 'info@eglizparousie.org'}</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{settings.church_address || '789 Community Blvd, Fort Lauderdale, FL 33311'}</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className={`font-bold uppercase text-xs tracking-widest mb-4 ${textTitle}`}>Portals & Links</h5>
            <div className="flex flex-col gap-3 text-sm">
              {!showAdminNav && (
                <a href="/admin?from=site" className={`inline-flex items-center gap-1.5 transition-colors font-semibold ${isLight ? 'text-slate-600 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`}>
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.navAdmin}</span>
                </a>
              )}
              <Link href="/administrative-care" className={`inline-flex items-center gap-1.5 transition-colors font-semibold ${isLight ? 'text-slate-600 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`}>
                {t.navAdministrativeCare}
              </Link>
              <Link href="/contact" className={`inline-flex items-center gap-1.5 transition-colors font-semibold ${isLight ? 'text-slate-600 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`}>
                {t.contactTitle}
              </Link>
            </div>
          </div>
        </div>

        <div className={`pt-8 border-t ${borderDivider} flex flex-col sm:flex-row justify-between items-center text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <p>&copy; {new Date().getFullYear()} {t.churchName}. {t.rightsReserved}</p>
          <p className="mt-2 sm:mt-0 text-slate-500">Français &amp; English</p>
        </div>
      </div>
    </footer>
  );
}

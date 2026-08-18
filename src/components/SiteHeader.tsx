'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Globe2, HeartHandshake, Menu, Settings, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAdminUi } from '@/lib/AdminUiContext';
import { markAdminEntryFromSite } from '@/lib/actions';
import { setAdminUiClient } from '@/lib/admin-cookies';
import { frenchSetting } from '@/lib/french-content';
import {
  ADMINISTRATIVE_CARE_SLUGS,
  aboutTabHref,
  isHomeNavActive,
  isNavActive,
  ministryHref,
} from '@/lib/site-nav';
import { getSiteTheme } from '@/lib/site-theme';

interface SiteHeaderProps {
  settings: Record<string, string>;
}

const CARE_TITLE_KEYS: Record<(typeof ADMINISTRATIVE_CARE_SLUGS)[number], 'careWeddings' | 'careFunerals' | 'careBaptisms' | 'careDedications' | 'careHospice'> = {
  weddings: 'careWeddings',
  funerals: 'careFunerals',
  baptisms: 'careBaptisms',
  'childrens-dedications': 'careDedications',
  'hospice-support': 'careHospice',
};

export default function SiteHeader({ settings }: SiteHeaderProps) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const showAdminNav = useAdminUi();
  const theme = getSiteTheme(settings);
  const { isLight, logoUrl, bgHeader, borderMain, textNav } = theme;

  const [activeDropdown, setActiveDropdown] = useState<'home' | 'ministries' | 'care' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileHomeExpanded, setMobileHomeExpanded] = useState(false);
  const [mobileMinistriesExpanded, setMobileMinistriesExpanded] = useState(false);
  const [mobileCareExpanded, setMobileCareExpanded] = useState(false);

  const isHt = language === 'fr_ht';
  const dAboutUsTitle = isHt
    ? frenchSetting(settings, 'about_us_title_ht', 'about_us_title_en')
    : (settings.about_us_title_en || t.tabAboutUs || 'About Us');
  const dBeliefsTitle = isHt
    ? frenchSetting(settings, 'beliefs_title_ht', 'beliefs_title_en')
    : (settings.beliefs_title_en || t.tabBeliefs || 'Our Beliefs');
  const dTeamTitle = isHt
    ? frenchSetting(settings, 'team_title_ht', 'team_title_en')
    : (settings.team_title_en || 'Our Team');
  const dExpectTitle = isHt
    ? frenchSetting(settings, 'expect_title_ht', 'expect_title_en')
    : (settings.expect_title_en || t.tabExpect || 'What to Expect');

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const openAdminPortal = () => {
    startTransition(async () => {
      setAdminUiClient();
      await markAdminEntryFromSite();
      window.location.href = showAdminNav ? '/admin/dashboard' : '/admin?from=site';
    });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr_ht' ? 'en' : 'fr_ht');
  };

  const navLinkClass = (href: string, extra = '') => {
    const active = isNavActive(pathname, href);
    return `text-sm font-semibold transition-colors ${textNav} ${active ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''} ${extra}`;
  };

  const dropdownPanel = `absolute top-full left-0 w-64 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50'} py-2 transition-all duration-300`;
  const dropdownItem = `w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors`;

  return (
    <>
      <header className={`sticky top-0 z-50 ${bgHeader} backdrop-blur-md border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl bg-white border ${isLight ? 'border-slate-200' : 'border-slate-800'} overflow-hidden shadow-lg shadow-blue-500/10 p-0.5 group-hover:scale-105 transition-transform duration-300`}>
              <img src={logoUrl} alt="Eglise Baptiste de la Parousie Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className={`text-lg md:text-xl font-bold font-serif ${isLight ? 'text-slate-900 group-hover:text-amber-600' : 'bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-amber-400 group-hover:from-amber-400 group-hover:to-amber-500'} leading-tight transition-all duration-300`}>
                {t.churchName}
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'} hidden sm:block font-medium`}>
                1 Th 4:16-17
              </p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('home')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href="/"
                className={`flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer ${textNav} ${isHomeNavActive(pathname) ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''}`}
              >
                <span>{t.navHome}</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
              </Link>
              <div className={`${dropdownPanel} ${activeDropdown === 'home' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <Link href={aboutTabHref('aboutUs')} className={dropdownItem}>{dAboutUsTitle}</Link>
                <Link href={aboutTabHref('beliefs')} className={dropdownItem}>{dBeliefsTitle}</Link>
                <Link href={aboutTabHref('team')} className={dropdownItem}>{dTeamTitle}</Link>
                <Link href={aboutTabHref('expect')} className={dropdownItem}>{dExpectTitle}</Link>
              </div>
            </div>

            <Link href="/prayer-wall" className={navLinkClass('/prayer-wall')}>{t.navPrayerWall}</Link>
            <Link href="/schedules" className={navLinkClass('/schedules')}>{t.navSchedules}</Link>
            <Link href="/sermons" className={navLinkClass('/sermons')}>{t.navSermons}</Link>
            <Link href="/blog" className={navLinkClass('/blog')}>{t.navBlog}</Link>

            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('ministries')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href="/ministries"
                className={`flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer ${textNav} ${isNavActive(pathname, '/ministries') ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''}`}
              >
                <span>{t.navMinistries}</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
              </Link>
              <div className={`${dropdownPanel} ${activeDropdown === 'ministries' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <Link href={ministryHref('women')} className={dropdownItem}>{t.ministryWomen}</Link>
                <Link href={ministryHref('men')} className={dropdownItem}>{t.ministryMen}</Link>
                <Link href={ministryHref('children')} className={dropdownItem}>{t.ministryChildren}</Link>
                <Link href={ministryHref('missions')} className={dropdownItem}>{t.ministryMissions}</Link>
              </div>
            </div>

            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('care')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href="/administrative-care"
                className={`flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer ${textNav} ${isNavActive(pathname, '/administrative-care') ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''}`}
              >
                <span>{t.navAdministrativeCare}</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
              </Link>
              <div className={`${dropdownPanel} ${activeDropdown === 'care' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                {ADMINISTRATIVE_CARE_SLUGS.map((slug) => (
                  <Link key={slug} href={`/administrative-care/${slug}`} className={dropdownItem}>
                    {t[CARE_TITLE_KEYS[slug]]}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/events" className={navLinkClass('/events')}>{t.navEvents}</Link>
            <Link href="/giving" className={navLinkClass('/giving')}>{t.navGiving}</Link>
          </nav>

          <div className="hidden xl:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'} border text-sm font-semibold transition-all duration-300 cursor-pointer hover:scale-105`}
            >
              <Globe2 className="w-4 h-4" />
              <span>{t.btnToggleLanguage}</span>
            </button>

            {showAdminNav && (
              <button
                type="button"
                onClick={openAdminPortal}
                disabled={isPending}
                title={t.navAdmin}
                className={`flex items-center justify-center p-2 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'} border transition-all duration-300 cursor-pointer hover:scale-105`}
              >
                <Settings className="w-5 h-5 text-blue-500 animate-[spin_8s_linear_infinite]" />
              </button>
            )}

            <Link
              href="/contact"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300"
            >
              {t.contactTitle}
            </Link>
          </div>

          <div className="flex xl:hidden items-center gap-2">
            {showAdminNav && (
              <button
                type="button"
                onClick={openAdminPortal}
                title={t.navAdmin}
                className={`flex items-center justify-center p-2 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}
              >
                <Settings className="w-5 h-5 text-blue-500" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleLanguage}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-amber-400'} text-xs font-semibold cursor-pointer`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{t.btnToggleLanguageShort}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className={`xl:hidden fixed inset-0 top-20 z-40 ${isLight ? 'bg-white/95' : 'bg-slate-950/95'} backdrop-blur-lg border-t ${borderMain} flex flex-col p-6 overflow-y-auto animate-fade-in`}>
          <nav className={`flex flex-col gap-5 text-lg font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <div>
              <div className="w-full flex items-center justify-between py-1">
                <Link href="/" className="hover:text-amber-500 transition-colors">{t.navHome}</Link>
                <button
                  type="button"
                  onClick={() => setMobileHomeExpanded(!mobileHomeExpanded)}
                  className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                  aria-label={t.navHome}
                >
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileHomeExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className={`pl-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${mobileHomeExpanded ? 'max-h-56 mt-3 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <Link href={aboutTabHref('aboutUs')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{dAboutUsTitle}</Link>
                <Link href={aboutTabHref('beliefs')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{dBeliefsTitle}</Link>
                <Link href={aboutTabHref('team')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{dTeamTitle}</Link>
                <Link href={aboutTabHref('expect')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{dExpectTitle}</Link>
              </div>
            </div>

            <Link href="/prayer-wall" className="hover:text-amber-500 transition-colors">{t.navPrayerWall}</Link>
            <Link href="/schedules" className="hover:text-amber-500 transition-colors">{t.navSchedules}</Link>
            <Link href="/sermons" className="hover:text-amber-500 transition-colors">{t.navSermons}</Link>
            <Link href="/blog" className="hover:text-amber-500 transition-colors">{t.navBlog}</Link>

            <div>
              <div className="w-full flex items-center justify-between py-1">
                <Link href="/ministries" className="hover:text-amber-500 transition-colors">{t.navMinistries}</Link>
                <button
                  type="button"
                  onClick={() => setMobileMinistriesExpanded(!mobileMinistriesExpanded)}
                  className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                  aria-label={t.navMinistries}
                >
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileMinistriesExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className={`pl-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${mobileMinistriesExpanded ? 'max-h-56 mt-3 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <Link href={ministryHref('women')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{t.ministryWomen}</Link>
                <Link href={ministryHref('men')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{t.ministryMen}</Link>
                <Link href={ministryHref('children')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{t.ministryChildren}</Link>
                <Link href={ministryHref('missions')} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">{t.ministryMissions}</Link>
              </div>
            </div>

            <div>
              <div className="w-full flex items-center justify-between py-1">
                <Link href="/administrative-care" className="hover:text-amber-500 inline-flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4" />
                  {t.navAdministrativeCare}
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileCareExpanded(!mobileCareExpanded)}
                  className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                  aria-label={t.navAdministrativeCare}
                >
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileCareExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className={`pl-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${mobileCareExpanded ? 'max-h-72 mt-3 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                {ADMINISTRATIVE_CARE_SLUGS.map((slug) => (
                  <Link key={slug} href={`/administrative-care/${slug}`} className="text-left text-base font-semibold hover:text-amber-500 transition-colors">
                    {t[CARE_TITLE_KEYS[slug]]}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/events" className="hover:text-amber-500 transition-colors">{t.navEvents}</Link>
            <Link href="/giving" className="hover:text-amber-500 transition-colors">{t.navGiving}</Link>

            {showAdminNav && (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); openAdminPortal(); }}
                className="hover:text-amber-500 transition-colors flex items-center gap-2 text-blue-500 text-left cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>{t.navAdmin}</span>
              </button>
            )}
          </nav>
          <div className={`mt-8 pt-8 border-t ${borderMain} flex flex-col gap-4`}>
            <Link
              href="/contact"
              className="w-full text-center py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
            >
              {t.contactTitle}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Globe2, HeartHandshake, LogIn, LogOut, Menu, Settings, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAdminUi } from '@/lib/AdminUiContext';
import { useCoordinatorSession } from '@/lib/CoordinatorSessionContext';
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
import { siteShellClass } from '@/lib/site-layout';
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
  const { access, setLoginOpen, signOut } = useCoordinatorSession();
  const theme = getSiteTheme(settings);
  const { isLight, logoUrl, bgHeader, borderMain, textNav } = theme;

  const [activeDropdown, setActiveDropdown] = useState<'home' | 'ministries' | 'care' | null>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<{ top: number; left: number } | null>(null);
  const dropdownCloseTimer = useRef<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileHomeExpanded, setMobileHomeExpanded] = useState(false);
  const [mobileMinistriesExpanded, setMobileMinistriesExpanded] = useState(false);
  const [mobileCareExpanded, setMobileCareExpanded] = useState(false);
  const [useDesktopScrollNav, setUseDesktopScrollNav] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const headerRowRef = useRef<HTMLDivElement>(null);
  const desktopActionsRef = useRef<HTMLDivElement>(null);
  const compactActionsRef = useRef<HTMLDivElement>(null);
  const navScrollWidthRef = useRef(0);

  const NAV_MIN_CLIENT_WIDTH = 96;

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
    setDropdownAnchor(null);
  }, [pathname]);

  useEffect(() => {
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const evaluateNavMode = () => {
      if (!finePointerQuery.matches) {
        setUseDesktopScrollNav(false);
        return;
      }

      const row = headerRowRef.current;
      const nav = navRef.current;
      if (!row) return;

      if (nav) {
        const navWrap = nav.parentElement;
        const navIsVisible = navWrap
          && getComputedStyle(navWrap).display !== 'none'
          && getComputedStyle(navWrap).visibility !== 'hidden';

        if (navIsVisible) {
          navScrollWidthRef.current = nav.scrollWidth;
          setUseDesktopScrollNav(nav.clientWidth >= NAV_MIN_CLIENT_WIDTH);
          return;
        }
      }

      const rowGap = Number.parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap || '0') || 0;
      const children = Array.from(row.children) as HTMLElement[];
      const logoWidth = children[0]?.offsetWidth ?? 0;
      const desktopActionsWidth = desktopActionsRef.current?.offsetWidth ?? 0;
      const compactActionsWidth = compactActionsRef.current?.offsetWidth ?? 0;
      const actionsWidth = Math.max(desktopActionsWidth, compactActionsWidth);
      const availableForNav = row.clientWidth - logoWidth - actionsWidth - rowGap * 2;

      setUseDesktopScrollNav(availableForNav >= NAV_MIN_CLIENT_WIDTH);
    };

    const closeMobileMenuIfDesktopScroll = () => {
      if (!finePointerQuery.matches) return;
      requestAnimationFrame(() => {
        const nav = navRef.current;
        const canUseScrollNav = nav ? nav.clientWidth >= NAV_MIN_CLIENT_WIDTH : false;
        if (!canUseScrollNav) return;
        setMobileMenuOpen(false);
        setMobileHomeExpanded(false);
        setMobileMinistriesExpanded(false);
        setMobileCareExpanded(false);
        setActiveDropdown(null);
        setDropdownAnchor(null);
      });
    };

    const onLayoutChange = () => {
      evaluateNavMode();
      closeMobileMenuIfDesktopScroll();
    };

    onLayoutChange();
    finePointerQuery.addEventListener('change', onLayoutChange);
    window.addEventListener('resize', onLayoutChange);

    const row = headerRowRef.current;
    const nav = navRef.current;
    const observer = new ResizeObserver(onLayoutChange);
    if (row) observer.observe(row);
    if (nav) observer.observe(nav);

    return () => {
      finePointerQuery.removeEventListener('change', onLayoutChange);
      window.removeEventListener('resize', onLayoutChange);
      observer.disconnect();
    };
  }, []);

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
    return `font-semibold transition-colors ${textNav} ${active ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''} ${extra}`;
  };

  const navLabelClass = 'inline-block max-w-[4.25rem] px-0.5 text-center text-[12px] leading-[1.15] xl:max-w-[5rem] xl:text-[13px] shrink-0';
  const navDropdownClass = (active: boolean) =>
    `flex items-start gap-0.5 font-semibold transition-colors cursor-pointer ${textNav} ${active ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''}`;

  const dropdownPanel = `w-64 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50'} py-2`;
  const dropdownItem = `w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors`;

  const openDropdown = (key: 'home' | 'ministries' | 'care', target: HTMLElement) => {
    if (dropdownCloseTimer.current !== null) {
      window.clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    const rect = target.getBoundingClientRect();
    setActiveDropdown(key);
    setDropdownAnchor({ top: rect.bottom, left: rect.left });
  };

  const closeDropdown = () => {
    if (dropdownCloseTimer.current !== null) {
      window.clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    setActiveDropdown(null);
    setDropdownAnchor(null);
  };

  const scheduleCloseDropdown = () => {
    if (dropdownCloseTimer.current !== null) {
      window.clearTimeout(dropdownCloseTimer.current);
    }
    dropdownCloseTimer.current = window.setTimeout(closeDropdown, 120);
  };

  useEffect(() => {
    if (!activeDropdown) return;
    const onScroll = () => closeDropdown();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeDropdown]);

  const renderFixedDropdown = (key: 'home' | 'ministries' | 'care', children: ReactNode) => {
    if (activeDropdown !== key || !dropdownAnchor) return null;
    return (
      <div
        className="fixed z-[60] pt-2"
        style={{ top: dropdownAnchor.top - 8, left: dropdownAnchor.left }}
        onMouseEnter={() => {
          if (dropdownCloseTimer.current !== null) {
            window.clearTimeout(dropdownCloseTimer.current);
            dropdownCloseTimer.current = null;
          }
          setActiveDropdown(key);
        }}
        onMouseLeave={closeDropdown}
      >
        <div className={dropdownPanel}>{children}</div>
      </div>
    );
  };

  const renderCoordinatorAuthButton = (className: string) => {
    if (access.source === 'coordinator') {
      return (
        <button
          type="button"
          onClick={() => void signOut()}
          title={t.coordinatorSignOut}
          className={className}
        >
          <LogOut className="w-5 h-5 text-amber-500" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setLoginOpen(true)}
        title={t.coordinatorSignIn}
        className={className}
      >
        <LogIn className="w-5 h-5 text-amber-500" />
      </button>
    );
  };

  const desktopNavWrapClass = useDesktopScrollNav
    ? 'hidden pointer-fine:flex flex-1 min-w-0'
    : 'hidden pointer-fine:flex pointer-fine:invisible pointer-fine:absolute pointer-fine:pointer-events-none flex-1 min-w-0';

  const desktopActionsClass = useDesktopScrollNav
    ? 'hidden pointer-fine:flex shrink-0 items-center gap-1.5'
    : 'hidden';

  const iconButtonClass = `flex items-center justify-center p-2 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'} border transition-all duration-300 cursor-pointer hover:scale-105`;
  const compactIconButtonClass = `flex items-center justify-center p-2 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`;

  return (
    <>
      <header className={`sticky top-0 z-50 overflow-visible ${bgHeader} backdrop-blur-md border-b`}>
        <div ref={headerRowRef} className={`${siteShellClass} h-20 flex items-center gap-3 min-w-0`}>
          <Link href="/" className="flex items-center gap-3 cursor-pointer group shrink-0">
            <div className={`relative flex items-center justify-center h-16 w-20 shrink-0 rounded-xl bg-white border ${isLight ? 'border-slate-200' : 'border-slate-800'} overflow-hidden shadow-lg shadow-blue-500/10 p-0.5 group-hover:scale-105 transition-transform duration-300`}>
              <img src={logoUrl} alt="Eglise Baptiste de la Parousie Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden xl:block">
              <h1 className={`text-lg md:text-xl font-bold font-serif ${isLight ? 'text-slate-900 group-hover:text-amber-600' : 'bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-amber-400 group-hover:from-amber-400 group-hover:to-amber-500'} leading-tight transition-all duration-300`}>
                {t.churchName}
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'} hidden sm:block font-medium`}>
                1 Th 4:16-17
              </p>
            </div>
          </Link>

          <div className={desktopNavWrapClass} aria-hidden={!useDesktopScrollNav}>
            <nav
              ref={navRef}
              aria-label="Main navigation"
              onScroll={() => {
                if (activeDropdown) closeDropdown();
              }}
              className="flex w-full min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain flex-nowrap [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] xl:gap-1.5"
            >
            <div
              className="relative group shrink-0 py-1"
              onMouseEnter={(e) => openDropdown('home', e.currentTarget)}
              onMouseLeave={scheduleCloseDropdown}
            >
              <Link
                href="/"
                className={navDropdownClass(isHomeNavActive(pathname))}
              >
                <span className={navLabelClass}>{t.navHome}</span>
                <ChevronDown className="w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform group-hover:rotate-180 duration-300" />
              </Link>
            </div>

            <Link href="/prayer-wall" className={navLinkClass('/prayer-wall', navLabelClass)}>{t.navPrayerWall}</Link>
            <Link href="/schedules" className={navLinkClass('/schedules', navLabelClass)}>{t.navSchedules}</Link>
            <Link href="/sermons" className={navLinkClass('/sermons', navLabelClass)}>{t.navSermons}</Link>
            <Link href="/blog" className={navLinkClass('/blog', navLabelClass)}>{t.navBlog}</Link>

            <div
              className="relative group shrink-0 py-1"
              onMouseEnter={(e) => openDropdown('ministries', e.currentTarget)}
              onMouseLeave={scheduleCloseDropdown}
            >
              <Link
                href="/ministries"
                className={navDropdownClass(isNavActive(pathname, '/ministries'))}
              >
                <span className={navLabelClass}>{t.navMinistries}</span>
                <ChevronDown className="w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform group-hover:rotate-180 duration-300" />
              </Link>
            </div>

            <div
              className="relative group shrink-0 py-1"
              onMouseEnter={(e) => openDropdown('care', e.currentTarget)}
              onMouseLeave={scheduleCloseDropdown}
            >
              <Link
                href="/administrative-care"
                className={navDropdownClass(isNavActive(pathname, '/administrative-care'))}
              >
                <span className={navLabelClass}>{t.navAdministrativeCare}</span>
                <ChevronDown className="w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform group-hover:rotate-180 duration-300" />
              </Link>
            </div>

            <Link href="/events" className={navLinkClass('/events', navLabelClass)}>{t.navEvents}</Link>
            <Link href="/giving" className={navLinkClass('/giving', navLabelClass)}>{t.navGiving}</Link>
            </nav>
          </div>

          <div ref={desktopActionsRef} className={`${desktopActionsClass} border-l ${borderMain} pl-1.5`}>
            <button
              type="button"
              onClick={toggleLanguage}
              className={`flex items-start gap-1 px-2 py-1.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'} border font-semibold transition-all duration-300 cursor-pointer hover:scale-105`}
            >
              <Globe2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className={navLabelClass}>{t.btnToggleLanguage}</span>
            </button>

            {renderCoordinatorAuthButton(iconButtonClass)}

            {showAdminNav && (
              <button
                type="button"
                onClick={openAdminPortal}
                disabled={isPending}
                title={t.navAdmin}
                className={iconButtonClass}
              >
                <Settings className="w-5 h-5 text-blue-500 animate-[spin_8s_linear_infinite]" />
              </button>
            )}

            <Link
              href="/contact"
              className="px-3 xl:px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300 whitespace-nowrap"
            >
              {t.contactTitle}
            </Link>
          </div>

          <div ref={compactActionsRef} className={`ml-auto flex items-center gap-2 ${useDesktopScrollNav ? 'pointer-fine:hidden' : ''}`}>
            {renderCoordinatorAuthButton(compactIconButtonClass)}
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
              className={`flex items-start gap-1 px-2 py-1.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-amber-400'} font-semibold cursor-pointer`}
            >
              <Globe2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className={navLabelClass}>{t.btnToggleLanguage}</span>
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

      {renderFixedDropdown('home', (
        <>
          <Link href={aboutTabHref('aboutUs')} className={dropdownItem}>{dAboutUsTitle}</Link>
          <Link href={aboutTabHref('beliefs')} className={dropdownItem}>{dBeliefsTitle}</Link>
          <Link href={aboutTabHref('team')} className={dropdownItem}>{dTeamTitle}</Link>
          <Link href={aboutTabHref('expect')} className={dropdownItem}>{dExpectTitle}</Link>
        </>
      ))}

      {renderFixedDropdown('ministries', (
        <>
          <Link href={ministryHref('women')} className={dropdownItem}>{t.ministryWomen}</Link>
          <Link href={ministryHref('men')} className={dropdownItem}>{t.ministryMen}</Link>
          <Link href={ministryHref('children')} className={dropdownItem}>{t.ministryChildren}</Link>
          <Link href={ministryHref('missions')} className={dropdownItem}>{t.ministryMissions}</Link>
        </>
      ))}

      {renderFixedDropdown('care', (
        <>
          {ADMINISTRATIVE_CARE_SLUGS.map((slug) => (
            <Link key={slug} href={`/administrative-care/${slug}`} className={dropdownItem}>
              {t[CARE_TITLE_KEYS[slug]]}
            </Link>
          ))}
        </>
      ))}

      {mobileMenuOpen && (
        <div className={`fixed inset-0 top-20 z-40 ${isLight ? 'bg-white/95' : 'bg-slate-950/95'} backdrop-blur-lg border-t ${borderMain} flex flex-col p-6 overflow-y-auto animate-fade-in`}>
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

            {access.source === 'coordinator' ? (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); void signOut(); }}
                className="hover:text-amber-500 transition-colors flex items-center gap-2 text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.coordinatorSignOut}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setLoginOpen(true); }}
                className="hover:text-amber-500 transition-colors flex items-center gap-2 text-left cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.coordinatorSignIn}</span>
              </button>
            )}

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

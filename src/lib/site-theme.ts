export type SiteTheme = {
  logoUrl: string;
  isLight: boolean;
  themePrimary: string;
  themeHover: string;
  themeAccent: string;
  bgMain: string;
  bgHeader: string;
  bgCard: string;
  bgInput: string;
  borderMain: string;
  borderDivider: string;
  textTitle: string;
  textBody: string;
  textMuted: string;
  textNav: string;
  bgFooter: string;
};

export function getSiteTheme(settings: Record<string, string>): SiteTheme {
  const themePrimary = settings.theme_primary || '#f59e0b';
  const themeHover = settings.theme_hover || '#d97706';
  const themeAccent = settings.theme_accent || '#3b82f6';
  const isLight = (settings.theme_mode || 'dark') === 'light';

  return {
    logoUrl: settings.logo_url || '/logo.png',
    isLight,
    themePrimary,
    themeHover,
    themeAccent,
    bgMain: isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100',
    bgHeader: isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-950/80 border-slate-900',
    bgCard: isLight
      ? 'bg-white border border-slate-200/80 shadow-md shadow-slate-100'
      : 'bg-slate-900 border border-slate-800 shadow-xl shadow-black/20',
    bgInput: isLight
      ? 'bg-slate-50 border border-slate-250 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/10'
      : 'bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/10',
    borderMain: isLight ? 'border-slate-200' : 'border-slate-900',
    borderDivider: isLight ? 'border-slate-200' : 'border-slate-800',
    textTitle: isLight ? 'text-slate-900' : 'text-white',
    textBody: isLight ? 'text-slate-700' : 'text-slate-300',
    textMuted: isLight ? 'text-slate-500' : 'text-slate-400',
    textNav: isLight ? 'text-slate-600 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400',
    bgFooter: isLight
      ? 'bg-slate-100 border-slate-200/60 text-slate-600'
      : 'bg-slate-950 border-slate-900 text-slate-400',
  };
}

export function siteThemeCssVars(theme: SiteTheme): string {
  return `
        :root {
          --primary-color: ${theme.themePrimary};
          --primary-hover: ${theme.themeHover};
          --accent-color: ${theme.themeAccent};
          --background: ${theme.isLight ? '#f8fafc' : '#090d16'};
          --foreground: ${theme.isLight ? '#0f172a' : '#f8fafc'};
        }
      `;
}

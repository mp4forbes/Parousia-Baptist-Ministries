import type { ReactElement, SVGProps } from 'react';
import type { AdministrativeCareSlug } from '@/lib/site-nav';

type IconProps = SVGProps<SVGSVGElement>;

function ChurchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M31 2h2v4h4v2h-4v4h-2V8h-4V6h4z" />
      <polygon points="32,10 18,26 46,26" />
      <path fillRule="evenodd" d="M22 26h20v32H22zM29 42a3 3 0 0 1 6 0v16h-6z" />
      <polygon points="4,34 14,24 24,34" />
      <rect x="4" y="34" width="20" height="24" />
      <polygon points="40,34 50,24 60,34" />
      <rect x="40" y="34" width="20" height="24" />
    </svg>
  );
}

function CandleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M32 4c6 6 8 12 4 18-6-2-10-8-8-16 8 2 10 8 4 14-8-4-8-10 0-16z" />
      <rect x="26" y="22" width="12" height="28" rx="1.5" />
      <path d="M18 50h28v4H18zm8 4h12v6H26z" />
    </svg>
  );
}

function BaptismIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M31 2h2v5h5v2h-5v5h-2V9h-5V7h5z" />
      <path d="M32 16c-8 12-14 20-14 28a14 14 0 0 0 28 0c0-8-6-16-14-28z" />
    </svg>
  );
}

function BabyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="32" cy="16" r="8" />
      <path d="M8 22c8-12 18-10 22-4-10 0-16 6-16 12-4-2-7-5-6-8zm48 0c-8-12-18-10-22-4 10 0 16 6 16 12 4-2 7-5 6-8z" />
      <path d="M20 28c0-6 5.5-10 12-10s12 4 12 10c0 4-2 7-2 7l5 21H17l5-21s-2-3-2-7z" />
    </svg>
  );
}

function HospiceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 38h6v18H6zm46 0h6v18h-6z" />
      <path d="M6 42h52v8H6z" />
      <rect x="16" y="30" width="32" height="12" rx="2" />
      <circle cx="21" cy="24" r="6" />
      <path d="M30 14h3l3 8 5-14 5 12h8v3H44l-3-8-5 14-4-11-2 5h-1z" />
    </svg>
  );
}

const ICONS: Record<AdministrativeCareSlug, (props: IconProps) => ReactElement> = {
  weddings: ChurchIcon,
  funerals: CandleIcon,
  baptisms: BaptismIcon,
  'childrens-dedications': BabyIcon,
  'hospice-support': HospiceIcon,
};

interface AdministrativeCareIconProps extends IconProps {
  slug: AdministrativeCareSlug;
}

export default function AdministrativeCareIcon({ slug, className, ...props }: AdministrativeCareIconProps) {
  const Icon = ICONS[slug] || ChurchIcon;
  return <Icon className={className} {...props} />;
}

interface AdministrativeCareDefaultArtProps {
  slug: AdministrativeCareSlug;
  isLight: boolean;
  className?: string;
  iconClassName?: string;
}

export function AdministrativeCareDefaultArt({
  slug,
  isLight,
  className = '',
  iconClassName = 'w-16 h-16',
}: AdministrativeCareDefaultArtProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-amber-400'
      } ${className}`}
    >
      <AdministrativeCareIcon slug={slug} className={iconClassName} />
    </div>
  );
}

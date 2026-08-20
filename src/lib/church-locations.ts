export type ChurchLocation = {
  nameEn: string;
  nameFr: string;
  addressEn: string;
  addressFr: string;
};

export const DEFAULT_CHURCH_LOCATIONS: ChurchLocation[] = [
  {
    nameEn: 'Queens, NY',
    nameFr: 'Queens, NY',
    addressEn: '227-10 Merrick Blvd, Laurelton, NY 11413',
    addressFr: '227-10 Merrick Blvd, Laurelton, NY 11413',
  },
  {
    nameEn: 'Lebanon, Pennsylvania',
    nameFr: 'Lebanon, Pennsylvanie',
    addressEn: '515 Cumberland Street, Lebanon, PA 17042',
    addressFr: '515, rue Cumberland, Lebanon, PA 17042',
  },
  {
    nameEn: 'West, Haiti',
    nameFr: 'Ouest, Ayiti',
    addressEn: '1 Parousie Lane, Morne à Cadillac 9, Bon-Repos, Haiti',
    addressFr: '1, Impasse Parousie, Moleard 9, Bon-Repos',
  },
  {
    nameEn: 'Nippes, Haiti',
    nameFr: 'Nippes, Ayiti',
    addressEn: 'Baradères, Gourdette, Village of the Parousie, Haiti',
    addressFr: 'Baradères, nan Gourdette, Village de la Parousie',
  },
];

function normalizeLocation(raw: Partial<ChurchLocation>): ChurchLocation {
  return {
    nameEn: raw.nameEn?.trim() || '',
    nameFr: raw.nameFr?.trim() || '',
    addressEn: raw.addressEn?.trim() || '',
    addressFr: raw.addressFr?.trim() || '',
  };
}

export function blankChurchLocation(): ChurchLocation {
  return { nameEn: '', nameFr: '', addressEn: '', addressFr: '' };
}

export function parseChurchLocations(settings: Record<string, string>): ChurchLocation[] {
  try {
    if (settings.church_locations_json) {
      const parsed = JSON.parse(settings.church_locations_json) as Partial<ChurchLocation>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeLocation).filter((location) =>
          location.nameEn || location.nameFr || location.addressEn || location.addressFr
        );
      }
    }
  } catch (error) {
    console.error('Error parsing church_locations_json:', error);
  }

  if (settings.church_address?.trim()) {
    return [
      {
        nameEn: 'Queens, NY',
        nameFr: 'Queens, NY',
        addressEn: settings.church_address.trim(),
        addressFr: settings.church_address_ht?.trim() || settings.church_address.trim(),
      },
      ...DEFAULT_CHURCH_LOCATIONS.slice(1),
    ];
  }

  return DEFAULT_CHURCH_LOCATIONS.map((location) => ({ ...location }));
}

export function churchLocationLabel(location: ChurchLocation, language: 'en' | 'fr_ht'): string {
  return language === 'fr_ht' ? location.nameFr || location.nameEn : location.nameEn || location.nameFr;
}

export function churchLocationAddress(location: ChurchLocation, language: 'en' | 'fr_ht'): string {
  return language === 'fr_ht' ? location.addressFr || location.addressEn : location.addressEn || location.addressFr;
}

export function churchLocationMapsQuery(location: ChurchLocation, language: 'en' | 'fr_ht'): string {
  const address = churchLocationAddress(location, language);
  const label = churchLocationLabel(location, language);
  return label ? `${label}, ${address}` : address;
}

export function primaryChurchAddress(settings: Record<string, string>, language: 'en' | 'fr_ht'): string {
  const locations = parseChurchLocations(settings);
  if (locations.length > 0) {
    return churchLocationAddress(locations[0], language);
  }
  if (language === 'fr_ht') {
    return settings.church_address_ht?.trim() || settings.church_address?.trim() || DEFAULT_CHURCH_LOCATIONS[0].addressFr;
  }
  return settings.church_address?.trim() || DEFAULT_CHURCH_LOCATIONS[0].addressEn;
}

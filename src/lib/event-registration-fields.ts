export type EventRegistrationFieldType = 'text' | 'textarea' | 'number' | 'select';

export interface EventRegistrationField {
  key: string;
  type: EventRegistrationFieldType;
  label_en: string;
  label_ht: string;
  placeholder_en?: string;
  placeholder_ht?: string;
  required?: boolean;
  min?: number;
  options?: { value: string; label_en: string; label_ht: string }[];
}

export const EVENT_REGISTRATION_TYPES = ['general', 'picnic', 'conference', 'youth'] as const;
export type EventRegistrationType = (typeof EVENT_REGISTRATION_TYPES)[number];

export const EVENT_REGISTRATION_TYPE_LABELS: Record<
  EventRegistrationType,
  { en: string; ht: string; description_en: string; description_ht: string }
> = {
  general: {
    en: 'General',
    ht: 'Général',
    description_en: 'Headcount and optional notes.',
    description_ht: 'Nombre de participants et remarques facultatives.',
  },
  picnic: {
    en: 'Picnic / Fellowship',
    ht: 'Pique-nique / Communion fraternelle',
    description_en: 'Adults & children, food allergies, and potluck details.',
    description_ht: 'Adultes et enfants, allergies alimentaires et détails du repas partagé.',
  },
  conference: {
    en: 'Conference',
    ht: 'Conférence',
    description_en: 'Attendee count, organization, dietary needs, and session interests.',
    description_ht: 'Nombre de participants, organisation, régime alimentaire et ateliers souhaités.',
  },
  youth: {
    en: 'Youth Event',
    ht: 'Événement jeunesse',
    description_en: 'Youth and adult counts, ages, and medical or allergy information.',
    description_ht: 'Nombre de jeunes et d’adultes, âges, et informations médicales ou allergies.',
  },
};

export const EVENT_REGISTRATION_FIELDS: Record<EventRegistrationType, EventRegistrationField[]> = {
  general: [
    {
      key: 'total_attendees',
      type: 'number',
      label_en: 'Number of people attending',
      label_ht: 'Nombre de personnes présentes',
      placeholder_en: 'e.g. 4',
      placeholder_ht: 'par ex. 4',
      required: true,
      min: 1,
    },
    {
      key: 'notes',
      type: 'textarea',
      label_en: 'Notes / special requests',
      label_ht: 'Remarques / demandes particulières',
      placeholder_en: 'Optional',
      placeholder_ht: 'Facultatif',
    },
  ],
  picnic: [
    {
      key: 'adults',
      type: 'number',
      label_en: 'Number of adults',
      label_ht: "Nombre d'adultes",
      placeholder_en: 'e.g. 2',
      placeholder_ht: 'par ex. 2',
      required: true,
      min: 1,
    },
    {
      key: 'children',
      type: 'number',
      label_en: 'Number of children',
      label_ht: "Nombre d'enfants",
      placeholder_en: 'e.g. 2',
      placeholder_ht: 'par ex. 2',
      min: 0,
    },
    {
      key: 'food_allergies',
      type: 'textarea',
      label_en: 'Food allergies or dietary restrictions',
      label_ht: 'Allergies alimentaires ou restrictions alimentaires',
      placeholder_en: 'List any allergies for your family (or write "None")',
      placeholder_ht: 'Indiquez les allergies de votre famille (ou écrivez « Aucune »)',
    },
    {
      key: 'dish_bringing',
      type: 'text',
      label_en: 'Dish you plan to bring (optional)',
      label_ht: 'Plat que vous prévoyez apporter (facultatif)',
      placeholder_en: 'e.g. Mac & cheese, fruit salad',
      placeholder_ht: 'par ex. macaroni au fromage, salade de fruits',
    },
    {
      key: 'notes',
      type: 'textarea',
      label_en: 'Other notes',
      label_ht: 'Autres remarques',
      placeholder_en: 'Accessibility needs, arrival time, etc.',
      placeholder_ht: "Besoins d'accessibilité, heure d'arrivée, etc.",
    },
  ],
  conference: [
    {
      key: 'adults',
      type: 'number',
      label_en: 'Number of attendees',
      label_ht: 'Nombre de participants',
      placeholder_en: 'e.g. 1',
      placeholder_ht: 'par ex. 1',
      required: true,
      min: 1,
    },
    {
      key: 'organization',
      type: 'text',
      label_en: 'Church / organization (optional)',
      label_ht: 'Église / organisation (facultatif)',
      placeholder_en: 'e.g. Parousia Baptist Church',
      placeholder_ht: 'par ex. Église Baptiste Parousie',
    },
    {
      key: 'dietary_restrictions',
      type: 'textarea',
      label_en: 'Dietary restrictions',
      label_ht: 'Restrictions alimentaires',
      placeholder_en: 'Vegetarian, gluten-free, allergies...',
      placeholder_ht: 'Végétarien, sans gluten, allergies...',
    },
    {
      key: 'workshop_interest',
      type: 'textarea',
      label_en: 'Sessions or workshops of interest',
      label_ht: 'Sessions ou ateliers qui vous intéressent',
      placeholder_en: 'Which breakout sessions would you like to attend?',
      placeholder_ht: 'Quels ateliers souhaitez-vous suivre ?',
    },
    {
      key: 'notes',
      type: 'textarea',
      label_en: 'Other notes',
      label_ht: 'Autres remarques',
    },
  ],
  youth: [
    {
      key: 'youth_count',
      type: 'number',
      label_en: 'Number of youth attending',
      label_ht: 'Nombre de jeunes présents',
      placeholder_en: 'e.g. 1',
      placeholder_ht: 'par ex. 1',
      required: true,
      min: 1,
    },
    {
      key: 'adult_count',
      type: 'number',
      label_en: 'Number of adults/chaperones',
      label_ht: "Nombre d'adultes / accompagnateurs",
      placeholder_en: 'e.g. 1',
      placeholder_ht: 'par ex. 1',
      min: 0,
    },
    {
      key: 'youth_ages',
      type: 'text',
      label_en: 'Ages of youth attending',
      label_ht: 'Âges des jeunes présents',
      placeholder_en: 'e.g. 14, 16',
      placeholder_ht: 'par ex. 14, 16',
      required: true,
    },
    {
      key: 'medical_allergies',
      type: 'textarea',
      label_en: 'Medical conditions, medications, or allergies',
      label_ht: 'Conditions médicales, médicaments ou allergies',
      placeholder_en: 'Include anything leaders should know (or write "None")',
      placeholder_ht: 'Tout ce que les responsables doivent savoir (ou écrivez « Aucune »)',
    },
    {
      key: 'emergency_contact',
      type: 'text',
      label_en: 'Emergency contact name & phone',
      label_ht: "Contact d'urgence (nom et téléphone)",
      placeholder_en: 'e.g. Marie Baptiste — (954) 555-0199',
      placeholder_ht: 'par ex. Marie Baptiste — (954) 555-0199',
      required: true,
    },
    {
      key: 'notes',
      type: 'textarea',
      label_en: 'Other notes',
      label_ht: 'Autres remarques',
    },
  ],
};

export function resolveEventRegistrationType(value?: string | null): EventRegistrationType {
  if (value && EVENT_REGISTRATION_TYPES.includes(value as EventRegistrationType)) {
    return value as EventRegistrationType;
  }
  return 'general';
}

export function getEventRegistrationFields(type?: string | null): EventRegistrationField[] {
  return EVENT_REGISTRATION_FIELDS[resolveEventRegistrationType(type)];
}

export function parseEventRegistrationResponses(json?: string | null): Record<string, string> {
  if (!json?.trim()) return {};
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, value == null ? '' : String(value)])
    );
  } catch {
    return {};
  }
}

export function formatEventRegistrationResponses(
  type: string | null | undefined,
  responses: Record<string, string>,
  language: 'en' | 'fr_ht'
): string {
  const resolvedType = resolveEventRegistrationType(type);
  const lines = getEventRegistrationFields(resolvedType)
    .map((field) => {
      const value = responses[field.key]?.trim();
      if (!value) return null;
      const label = language === 'fr_ht' ? field.label_ht : field.label_en;
      return `${label}: ${value}`;
    })
    .filter(Boolean);

  return lines.join('\n');
}

export function summarizeEventHeadcount(
  type: string | null | undefined,
  responses: Record<string, string>
): string {
  const resolvedType = resolveEventRegistrationType(type);
  const adults = Number(responses.adults || 0);
  const children = Number(responses.children || 0);
  const total = Number(responses.total_attendees || 0);
  const youth = Number(responses.youth_count || 0);
  const adultChaperones = Number(responses.adult_count || 0);

  switch (resolvedType) {
    case 'picnic': {
      const sum = adults + children;
      return children > 0 ? `${adults} adult(s), ${children} child(ren) (${sum} total)` : `${adults} adult(s)`;
    }
    case 'conference':
      return `${adults} attendee(s)`;
    case 'youth': {
      const sum = youth + adultChaperones;
      return adultChaperones > 0
        ? `${youth} youth, ${adultChaperones} adult(s) (${sum} total)`
        : `${youth} youth`;
    }
    default:
      return total > 0 ? `${total} attendee(s)` : '';
  }
}

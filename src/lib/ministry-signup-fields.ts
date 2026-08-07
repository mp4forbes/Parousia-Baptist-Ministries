export type MinistrySignupFieldType = 'text' | 'textarea' | 'number' | 'select';

export interface MinistrySignupField {
  key: string;
  type: MinistrySignupFieldType;
  label_en: string;
  label_ht: string;
  placeholder_en?: string;
  placeholder_ht?: string;
  required?: boolean;
  options?: { value: string; label_en: string; label_ht: string }[];
}

export const MINISTRY_SIGNUP_SLUGS = ['women', 'men', 'children', 'missions'] as const;
export type MinistrySignupSlug = (typeof MINISTRY_SIGNUP_SLUGS)[number];

export const MINISTRY_SIGNUP_FIELDS: Record<MinistrySignupSlug, MinistrySignupField[]> = {
  women: [
    {
      key: 'interests',
      type: 'textarea',
      label_en: 'What areas interest you most?',
      label_ht: 'Quels domaines vous intéressent le plus ?',
      placeholder_en: 'Prayer, Bible study, outreach, mentoring...',
      placeholder_ht: 'Prière, étude biblique, évangélisation, mentorat...',
    },
    {
      key: 'availability',
      type: 'text',
      label_en: 'When are you usually available?',
      label_ht: 'Quand êtes-vous généralement disponible ?',
      placeholder_en: 'e.g. Saturday mornings',
      placeholder_ht: 'par exemple : le samedi matin',
    },
  ],
  men: [
    {
      key: 'interests',
      type: 'textarea',
      label_en: 'What areas interest you most?',
      label_ht: 'Quels domaines vous intéressent le plus ?',
      placeholder_en: 'Discipleship, service projects, leadership...',
      placeholder_ht: 'Formation de disciples, projets de service, leadership...',
    },
    {
      key: 'availability',
      type: 'text',
      label_en: 'When are you usually available?',
      label_ht: 'Quand êtes-vous généralement disponible ?',
    },
  ],
  children: [
    {
      key: 'child_name',
      type: 'text',
      label_en: "Child's full name",
      label_ht: "Nom complet de l'enfant",
      required: true,
    },
    {
      key: 'child_age',
      type: 'number',
      label_en: "Child's age",
      label_ht: "Âge de l'enfant",
      required: true,
    },
    {
      key: 'parent_guardian',
      type: 'text',
      label_en: 'Parent / guardian name',
      label_ht: 'Nom du parent ou du tuteur',
      required: true,
    },
    {
      key: 'notes',
      type: 'textarea',
      label_en: 'Allergies, special needs, or notes',
      label_ht: 'Allergies, besoins particuliers ou remarques',
      placeholder_en: 'Optional',
      placeholder_ht: 'Facultatif',
    },
  ],
  missions: [
    {
      key: 'interest_area',
      type: 'text',
      label_en: 'Mission area of interest',
      label_ht: 'Domaine missionnaire qui vous intéresse',
      placeholder_en: 'Haiti outreach, local service, fundraising...',
      placeholder_ht: 'Mission en Haïti, service local, collecte de fonds...',
    },
    {
      key: 'skills',
      type: 'textarea',
      label_en: 'Skills or experience you can offer',
      label_ht: 'Compétences ou expérience que vous pouvez apporter',
    },
    {
      key: 'availability',
      type: 'text',
      label_en: 'Availability',
      label_ht: 'Disponibilité',
    },
  ],
};

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
      label_ht: 'Ki domèn ki enterese w plis?',
      placeholder_en: 'Prayer, Bible study, outreach, mentoring...',
      placeholder_ht: 'Lapriyè, etid biblik, evanjelizasyon, konsey...',
    },
    {
      key: 'availability',
      type: 'text',
      label_en: 'When are you usually available?',
      label_ht: 'Ki lè ou disponib anjeneral?',
      placeholder_en: 'e.g. Saturday mornings',
      placeholder_ht: 'egzanp: Samdi maten',
    },
  ],
  men: [
    {
      key: 'interests',
      type: 'textarea',
      label_en: 'What areas interest you most?',
      label_ht: 'Ki domèn ki enterese w plis?',
      placeholder_en: 'Discipleship, service projects, leadership...',
      placeholder_ht: 'Disipil, pwojè sèvis, lidèchip...',
    },
    {
      key: 'availability',
      type: 'text',
      label_en: 'When are you usually available?',
      label_ht: 'Ki lè ou disponib anjeneral?',
    },
  ],
  children: [
    {
      key: 'child_name',
      type: 'text',
      label_en: "Child's full name",
      label_ht: 'Non konplè timoun nan',
      required: true,
    },
    {
      key: 'child_age',
      type: 'number',
      label_en: "Child's age",
      label_ht: 'Laj timoun nan',
      required: true,
    },
    {
      key: 'parent_guardian',
      type: 'text',
      label_en: 'Parent / guardian name',
      label_ht: 'Non paran / responsab la',
      required: true,
    },
    {
      key: 'notes',
      type: 'textarea',
      label_en: 'Allergies, special needs, or notes',
      label_ht: 'Alèji, bezwen espesyal, oswa nòt',
      placeholder_en: 'Optional',
      placeholder_ht: 'Opsyonèl',
    },
  ],
  missions: [
    {
      key: 'interest_area',
      type: 'text',
      label_en: 'Mission area of interest',
      label_ht: 'Domèn misyon ou enterese a',
      placeholder_en: 'Haiti outreach, local service, fundraising...',
      placeholder_ht: 'Evanjelizasyon Ayiti, sèvis lokal, koleksyon fon...',
    },
    {
      key: 'skills',
      type: 'textarea',
      label_en: 'Skills or experience you can offer',
      label_ht: 'Konpetans oswa eksperyans ou ka pote',
    },
    {
      key: 'availability',
      type: 'text',
      label_en: 'Availability',
      label_ht: 'Disponibilite',
    },
  ],
};

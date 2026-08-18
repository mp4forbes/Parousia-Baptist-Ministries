import { ADMINISTRATIVE_CARE_SLUGS, type AdministrativeCareSlug } from './site-nav';

export type AdministrativeCareFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox';

export interface AdministrativeCareField {
  key: string;
  type: AdministrativeCareFieldType;
  label_en: string;
  label_ht: string;
  required?: boolean;
  options?: { value: string; label_en: string; label_ht: string }[];
}

export const ADMINISTRATIVE_CARE_BASE_FIELDS: AdministrativeCareField[] = [
  {
    key: 'requester_name',
    type: 'text',
    label_en: 'Your full name',
    label_ht: 'Votre nom complet',
    required: true,
  },
  {
    key: 'requester_email',
    type: 'text',
    label_en: 'Email',
    label_ht: 'Adresse e-mail',
    required: true,
  },
  {
    key: 'requester_phone',
    type: 'text',
    label_en: 'Phone',
    label_ht: 'Téléphone',
  },
  {
    key: 'is_church_member',
    type: 'select',
    label_en: 'Are you a church member?',
    label_ht: 'Êtes-vous membre de l’église ?',
    required: true,
    options: [
      { value: 'yes', label_en: 'Yes', label_ht: 'Oui' },
      { value: 'no', label_en: 'No', label_ht: 'Non' },
      { value: 'not_sure', label_en: 'Not sure', label_ht: 'Je ne sais pas' },
    ],
  },
];

export const ADMINISTRATIVE_CARE_FIELDS: Record<AdministrativeCareSlug, AdministrativeCareField[]> = {
  weddings: [
    {
      key: 'partner_one_name',
      type: 'text',
      label_en: 'Partner 1 full name',
      label_ht: 'Nom complet du partenaire 1',
      required: true,
    },
    {
      key: 'partner_two_name',
      type: 'text',
      label_en: 'Partner 2 full name',
      label_ht: 'Nom complet du partenaire 2',
      required: true,
    },
    {
      key: 'preferred_wedding_date',
      type: 'text',
      label_en: 'Preferred wedding date',
      label_ht: 'Date de mariage souhaitée',
    },
    {
      key: 'ceremony_location',
      type: 'select',
      label_en: 'Ceremony location',
      label_ht: 'Lieu de la cérémonie',
      options: [
        { value: 'church_sanctuary', label_en: 'Church sanctuary', label_ht: 'Sanctuaire de l’église' },
        { value: 'other_venue', label_en: 'Other venue', label_ht: 'Autre lieu' },
        { value: 'undecided', label_en: 'Undecided', label_ht: 'Non décidé' },
      ],
    },
    {
      key: 'prior_marriage',
      type: 'select',
      label_en: 'Has either partner been married before?',
      label_ht: 'L’un des partenaires a-t-il déjà été marié ?',
      options: [
        { value: 'yes', label_en: 'Yes', label_ht: 'Oui' },
        { value: 'no', label_en: 'No', label_ht: 'Non' },
      ],
    },
    {
      key: 'premarital_counseling_ack',
      type: 'checkbox',
      label_en: 'I understand premarital counseling is required before an ordained minister may officiate.',
      label_ht: 'Je comprends que le counseling prénuptial est requis avant qu’un ministre ordonné puisse célébrer le mariage.',
      required: true,
    },
    {
      key: 'additional_notes',
      type: 'textarea',
      label_en: 'Additional details or questions',
      label_ht: 'Détails ou questions supplémentaires',
    },
  ],
  funerals: [
    {
      key: 'deceased_full_name',
      type: 'text',
      label_en: 'Full name of deceased',
      label_ht: 'Nom complet du défunt',
      required: true,
    },
    {
      key: 'date_of_passing',
      type: 'text',
      label_en: 'Date of passing',
      label_ht: 'Date du décès',
    },
    {
      key: 'relationship_to_deceased',
      type: 'text',
      label_en: 'Your relationship to the deceased',
      label_ht: 'Votre lien avec le défunt',
    },
    {
      key: 'service_date_preference',
      type: 'text',
      label_en: 'Preferred funeral / memorial date',
      label_ht: 'Date souhaitée pour les funérailles ou commémoration',
    },
    {
      key: 'service_location_preference',
      type: 'select',
      label_en: 'Service location',
      label_ht: 'Lieu du service',
      options: [
        { value: 'church', label_en: 'Church', label_ht: 'Église' },
        { value: 'cemetery', label_en: 'Cemetery', label_ht: 'Cimetière' },
        { value: 'funeral_home', label_en: 'Funeral home', label_ht: 'Funérarium' },
        { value: 'other', label_en: 'Other', label_ht: 'Autre' },
      ],
    },
    {
      key: 'family_contact_name',
      type: 'text',
      label_en: 'Primary family contact name',
      label_ht: 'Nom du contact familial principal',
    },
    {
      key: 'family_contact_phone',
      type: 'text',
      label_en: 'Primary family contact phone',
      label_ht: 'Téléphone du contact familial',
    },
    {
      key: 'support_needed',
      type: 'textarea',
      label_en: 'How can our pastoral team support you at this time?',
      label_ht: 'Comment notre équipe pastorale peut-elle vous soutenir en ce moment ?',
    },
    {
      key: 'bereavement_group_interest',
      type: 'checkbox',
      label_en: 'I am interested in ongoing bereavement support / grief care.',
      label_ht: 'Je souhaite recevoir un soutien continu dans le deuil.',
    },
  ],
  baptisms: [
    {
      key: 'candidate_full_name',
      type: 'text',
      label_en: 'Candidate full name',
      label_ht: 'Nom complet du candidat',
      required: true,
    },
    {
      key: 'candidate_age',
      type: 'number',
      label_en: 'Candidate age',
      label_ht: 'Âge du candidat',
    },
    {
      key: 'baptism_date_preference',
      type: 'text',
      label_en: 'Preferred baptism date',
      label_ht: 'Date de baptême souhaitée',
    },
    {
      key: 'previously_baptized',
      type: 'select',
      label_en: 'Have you been baptized before?',
      label_ht: 'Avez-vous déjà été baptisé ?',
      options: [
        { value: 'yes', label_en: 'Yes', label_ht: 'Oui' },
        { value: 'no', label_en: 'No', label_ht: 'Non' },
        { value: 'not_sure', label_en: 'Not sure', label_ht: 'Je ne sais pas' },
      ],
    },
    {
      key: 'salvation_testimony',
      type: 'textarea',
      label_en: 'Brief testimony of faith in Christ',
      label_ht: 'Bref témoignage de foi en Christ',
    },
    {
      key: 'pastor_meeting_requested',
      type: 'checkbox',
      label_en: 'I would like a pastor to contact me to prepare for baptism.',
      label_ht: 'Je souhaite qu’un pasteur me contacte pour préparer le baptême.',
    },
  ],
  'childrens-dedications': [
    {
      key: 'child_full_name',
      type: 'text',
      label_en: "Child's full name",
      label_ht: "Nom complet de l'enfant",
      required: true,
    },
    {
      key: 'child_date_of_birth',
      type: 'text',
      label_en: "Child's date of birth",
      label_ht: "Date de naissance de l'enfant",
    },
    {
      key: 'parent_guardian_names',
      type: 'text',
      label_en: 'Parent(s) / guardian name(s)',
      label_ht: 'Nom(s) du/des parent(s) ou tuteur(s)',
      required: true,
    },
    {
      key: 'preferred_service_month',
      type: 'text',
      label_en: 'Preferred month for dedication',
      label_ht: 'Mois souhaité pour la présentation',
    },
    {
      key: 'dedication_ack',
      type: 'checkbox',
      label_en: 'I understand child dedication is a commitment to raise my child in the Christian faith with the support of the church.',
      label_ht: 'Je comprends que la présentation de l’enfant est un engagement à l’élever dans la foi chrétienne avec le soutien de l’église.',
      required: true,
    },
    {
      key: 'additional_notes',
      type: 'textarea',
      label_en: 'Allergies, special needs, or scheduling notes',
      label_ht: 'Allergies, besoins particuliers ou notes d’horaire',
    },
  ],
  'hospice-support': [
    {
      key: 'patient_full_name',
      type: 'text',
      label_en: 'Patient full name',
      label_ht: 'Nom complet du patient',
      required: true,
    },
    {
      key: 'relationship_to_patient',
      type: 'text',
      label_en: 'Your relationship to the patient',
      label_ht: 'Votre lien avec le patient',
    },
    {
      key: 'care_setting',
      type: 'select',
      label_en: 'Care setting',
      label_ht: 'Lieu de soins',
      options: [
        { value: 'hospital', label_en: 'Hospital', label_ht: 'Hôpital' },
        { value: 'hospice_facility', label_en: 'Hospice facility', label_ht: 'Établissement de soins palliatifs' },
        { value: 'home', label_en: 'Home', label_ht: 'Domicile' },
        { value: 'rehabilitation', label_en: 'Rehabilitation', label_ht: 'Réadaptation' },
        { value: 'other', label_en: 'Other', label_ht: 'Autre' },
      ],
    },
    {
      key: 'facility_or_address',
      type: 'text',
      label_en: 'Facility name or home address',
      label_ht: 'Nom de l’établissement ou adresse du domicile',
    },
    {
      key: 'patient_condition',
      type: 'textarea',
      label_en: 'Brief description of situation (optional)',
      label_ht: 'Brève description de la situation (facultatif)',
    },
    {
      key: 'visitation_requested',
      type: 'select',
      label_en: 'Pastoral visitation requested?',
      label_ht: 'Visite pastorale souhaitée ?',
      options: [
        { value: 'yes', label_en: 'Yes', label_ht: 'Oui' },
        { value: 'no', label_en: 'No', label_ht: 'Non' },
        { value: 'phone_call_only', label_en: 'Phone call only', label_ht: 'Appel téléphonique seulement' },
      ],
    },
    {
      key: 'prayer_support_requested',
      type: 'checkbox',
      label_en: 'Please include this need in our church prayer care.',
      label_ht: 'Veuillez inclure ce besoin dans nos prières pastorales.',
    },
    {
      key: 'share_with_pastoral_team',
      type: 'checkbox',
      label_en: 'I authorize the pastoral care team to coordinate support with my family.',
      label_ht: 'J’autorise l’équipe pastorale à coordonner le soutien avec ma famille.',
    },
  ],
};

export { ADMINISTRATIVE_CARE_SLUGS };

export function isCheckedResponse(value?: string | null): boolean {
  const normalized = (value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === 'on' || normalized === '1';
}

export function formatAdministrativeCareFieldValue(
  field: AdministrativeCareField,
  value: string | undefined,
  language: 'en' | 'fr_ht'
): string {
  const raw = (value || '').trim();
  if (!raw) return '';

  if (field.type === 'checkbox') {
    if (!isCheckedResponse(raw)) return '';
    return language === 'fr_ht' ? 'Oui' : 'Yes';
  }

  if (field.type === 'select' && field.options) {
    const option = field.options.find((item) => item.value === raw);
    if (option) {
      return language === 'fr_ht' ? option.label_ht : option.label_en;
    }
  }

  return raw;
}

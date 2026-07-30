export type AdminDocument = {
  id: string;
  titleEn: string;
  titleHt: string;
  href: string;
  kind: 'guide' | 'letter';
};

export const ADMIN_DOCUMENTS: AdminDocument[] = [
  {
    id: 'admin-guide',
    titleEn: 'Website Administration Guide',
    titleHt: 'Gid Administrasyon Sit Wèb la',
    href: '/admin-guide/Parousia-Admin-Guide.html',
    kind: 'guide',
  },
  {
    id: 'completion-letter',
    titleEn: 'Project Completion Letter',
    titleHt: 'Lèt Fini Pwojè a',
    href: '/admin-guide/Parousia-Completion-Letter.html',
    kind: 'letter',
  },
];

export function getAdminDocumentTitle(doc: AdminDocument, language: 'en' | 'fr_ht'): string {
  return language === 'fr_ht' ? doc.titleHt : doc.titleEn;
}

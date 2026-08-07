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
    titleHt: 'Guide d’administration du site Web',
    href: '/admin-guide/Parousia-Admin-Guide.html',
    kind: 'guide',
  },
  {
    id: 'completion-letter',
    titleEn: 'Project Completion Letter',
    titleHt: 'Lettre d’achèvement du projet',
    href: '/admin-guide/Parousia-Completion-Letter.html',
    kind: 'letter',
  },
];

export function getAdminDocumentTitle(doc: AdminDocument, language: 'en' | 'fr_ht'): string {
  return language === 'fr_ht' ? doc.titleHt : doc.titleEn;
}

export function getAdminDocumentPrintUrl(doc: AdminDocument): string {
  return `${doc.href}?print=1`;
}

export function getAdminDocumentOutlookUrl(doc: AdminDocument): string | null {
  if (doc.kind !== 'letter') return null;
  return `${doc.href}?outlook=1`;
}

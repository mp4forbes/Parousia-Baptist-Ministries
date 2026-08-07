export type TeamMember = {
  name: string;
  role_en: string;
  role_ht: string;
  bio_en: string;
  bio_ht: string;
  image_url: string;
  email: string;
};

export type TeamDepartment = {
  id: string;
  title_en: string;
  title_ht: string;
  members: TeamMember[];
};

const blankMember = (name: string, partial: Partial<TeamMember> = {}): TeamMember => ({
  name,
  role_en: partial.role_en || '',
  role_ht: partial.role_ht || '',
  bio_en: partial.bio_en || '',
  bio_ht: partial.bio_ht || '',
  image_url: partial.image_url || '',
  email: partial.email || '',
});

/** Default departments & associations roster (English / French titles). */
export const DEFAULT_TEAM_DEPARTMENTS: TeamDepartment[] = [
  {
    id: 'executive-committee',
    title_en: 'Executive Committee',
    title_ht: 'Comité exécutif',
    members: [
      blankMember('Pasteur Yvan Dalzon, M.T.', {
        role_en: 'Ex Officio President',
        role_ht: 'Président ex officio',
        bio_en:
          'Ex officio president of all church committees, holder of a master’s degree in theology, and a church planter for more than three decades, he also teaches at the Bible school.',
        bio_ht:
          'Président ex officio de tous les comités de l’église, détenteur d’une maîtrise en théologie et implanteur d’églises depuis plus de trois décennies, il enseigne également à l’école biblique.',
        image_url: '/api/assets/home_team_p1_1781413370481.jpg',
        email: 'franckyvan@gmail.com',
      }),
    ],
  },
  {
    id: 'administration',
    title_en: 'Administration',
    title_ht: 'Administration',
    members: [
      blankMember('Pasteur D. Pierre-Louis', {
        role_en: 'Assistant Pastor',
        role_ht: 'Pasteur assistant',
        bio_en: 'He assists Pastor Dalzon in his duties and administers the church’s finances with Deacon Louis.',
        bio_ht: 'Il assiste le pasteur Dalzon dans ses fonctions et administre les finances de l’église avec le diacre Louis.',
        image_url: '/api/assets/home_team_p2_1781413370575.jpg',
      }),
      blankMember('Paul Louis'),
    ],
  },
  {
    id: 'board-of-deacons',
    title_en: 'The Board of Deacons',
    title_ht: 'Conseil des diacres',
    members: [blankMember('Deacon Winer Chandleron')],
  },
  {
    id: 'vocals-choirs',
    title_en: 'Vocals & Choirs',
    title_ht: 'Vocaux et chœurs',
    members: [
      blankMember('Maestro Geral Monfort', {
        role_en: 'Director of Singing and Music',
        role_ht: 'Directeur des chants et de la musique',
        bio_en:
          'A former member of the Cité de Béthanie Baptist Church, he directs singing and music in the church.',
        bio_ht:
          'Ancien membre de l’Église baptiste de Cité de Béthanie, il est directeur des chants et de la musique de l’église.',
      }),
    ],
  },
  {
    id: 'sunday-school',
    title_en: 'Sunday School',
    title_ht: 'École du dimanche',
    members: [blankMember('Deacon Jean-Mary Ferrari')],
  },
  {
    id: 'youth',
    title_en: 'Youth Department',
    title_ht: 'Département de la jeunesse',
    members: [blankMember('Rodny Pierre'), blankMember('Bruno Djuferson')],
  },
  {
    id: 'women',
    title_en: 'Women: Seniors & Young Women',
    title_ht: 'Femmes : seniors et jeunes femmes',
    members: [
      blankMember('Sr Arlette Milfort', {
        role_en: 'Women’s Association President',
        role_ht: 'Présidente de l’Association des dames',
        bio_en: 'She is president of the Women’s Association and vice president of the diaconate.',
        bio_ht: 'Elle est présidente de l’Association des dames et vice-présidente du diaconat.',
      }),
      blankMember('Sr Yanick Albert'),
    ],
  },
  {
    id: 'sound-media',
    title_en: 'Sound & Media',
    title_ht: 'Son et médias',
    members: [blankMember('Rodny Pierre'), blankMember('Dieula Parinis')],
  },
  {
    id: 'mens',
    title_en: "Men's Department",
    title_ht: 'Département des hommes',
    members: [blankMember('Jean-Robert Francois')],
  },
  {
    id: 'secretariat',
    title_en: 'Secretariat',
    title_ht: 'Secrétariat',
    members: [
      blankMember('Angeline B.'),
      blankMember('Carline F.', {
        role_en: 'External Relations Coordinator',
        role_ht: 'Coordinatrice des relations externes',
        bio_en:
          'She coordinates the church’s various groups and departments and is especially responsible for external relations with visitors and prospective members.',
        bio_ht:
          'Elle assure la coordination entre les différents groupes et départements de l’église et est surtout chargée des relations externes avec les visiteurs et les fidèles potentiels.',
      }),
      blankMember('Yves Dalzon'),
    ],
  },
  {
    id: 'children',
    title_en: "Children's Department",
    title_ht: 'Département des enfants',
    members: [blankMember('Gerlande Bien-Aimes'), blankMember('Madge P.')],
  },
  {
    id: 'missionary',
    title_en: 'Missionary Department',
    title_ht: 'Département missionnaire',
    members: [blankMember('Sr Solanges Valentin')],
  },
];

export function flattenTeamMembers(departments: TeamDepartment[]): TeamMember[] {
  return departments.flatMap((department) => department.members);
}

export function parseTeamDepartments(settings: Record<string, string | undefined>): TeamDepartment[] {
  try {
    if (settings.team_departments_json) {
      const parsed = JSON.parse(settings.team_departments_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing team_departments_json:', e);
  }

  return DEFAULT_TEAM_DEPARTMENTS;
}

/** @deprecated Use DEFAULT_TEAM_DEPARTMENTS / flattenTeamMembers instead. */
export const EXECUTIVE_COMMITTEE_MEMBERS = DEFAULT_TEAM_DEPARTMENTS[0].members;

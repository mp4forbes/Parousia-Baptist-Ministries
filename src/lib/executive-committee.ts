export type ExecutiveCommitteeMember = {
  name: string;
  role_en: string;
  role_ht: string;
  bio_en: string;
  bio_ht: string;
  image_url: string;
  email: string;
};

// The *_ht properties are legacy compatibility names. Their values are French.
export const EXECUTIVE_COMMITTEE_MEMBERS: ExecutiveCommitteeMember[] = [
  {
    name: 'Pasteur Yvan Dalzon, M.T.',
    role_en: 'Ex Officio President',
    role_ht: 'Président ex officio',
    bio_en:
      'Ex officio president of all church committees, holder of a master’s degree in theology, and a church planter for more than three decades, he also teaches at the Bible school.',
    bio_ht:
      'Président ex officio de tous les comités de l’église, détenteur d’une maîtrise en théologie et implanteur d’églises depuis plus de trois décennies, il enseigne également à l’école biblique.',
    image_url: '/api/assets/home_team_p1_1781413370481.jpg',
    email: 'franckyvan@gmail.com',
  },
  {
    name: 'Pasteur Jean Duravit Pierre-Louis',
    role_en: 'Assistant Pastor',
    role_ht: 'Pasteur assistant',
    bio_en:
      'He assists Pastor Dalzon in his duties and administers the church’s finances with Deacon Louis.',
    bio_ht:
      'Il assiste le pasteur Dalzon dans ses fonctions et administre les finances de l’église avec le diacre Louis.',
    image_url: '/api/assets/home_team_p2_1781413370575.jpg',
    email: '',
  },
  {
    name: 'Maestro Geral Monfort',
    role_en: 'Director of Singing and Music',
    role_ht: 'Directeur des chants et de la musique',
    bio_en:
      'A former member of the Cité de Béthanie Baptist Church, he directs singing and music in the church.',
    bio_ht:
      'Ancien membre de l’Église baptiste de Cité de Béthanie, il est directeur des chants et de la musique de l’église.',
    image_url: '',
    email: '',
  },
  {
    name: 'Sœur Arlette Milfort',
    role_en: 'Women’s Association President and Diaconate Vice President',
    role_ht: 'Présidente de l’Association des dames et vice-présidente du diaconat',
    bio_en:
      'She is president of the Women’s Association and vice president of the diaconate.',
    bio_ht:
      'Elle est présidente de l’Association des dames et vice-présidente du diaconat.',
    image_url: '',
    email: '',
  },
  {
    name: 'Sœur Carline Florestal',
    role_en: 'External Relations Coordinator',
    role_ht: 'Coordinatrice des relations externes',
    bio_en:
      'She coordinates the church’s various groups and departments. She is especially responsible for external relations with visitors and prospective members of the congregation.',
    bio_ht:
      'Elle assure la coordination entre les différents groupes et départements de l’église. Elle est surtout chargée des relations externes avec les visiteurs et les fidèles potentiels de l’assemblée.',
    image_url: '',
    email: '',
  },
];

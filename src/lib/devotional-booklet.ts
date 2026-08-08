export type DevotionalDay = {
  title: string;
  scriptureRef: string;
  scriptureText: string;
  meditation: string;
  prayer: string;
};

export type DevotionalBooklet = {
  churchName: string;
  subtitle: string;
  greeting: string;
  intro: string;
  closingQuote: string;
  closingQuoteRef: string;
  contactTitle: string;
  days: DevotionalDay[];
};

export const DEVOTIONAL_BOOKLET_EN: DevotionalBooklet = {
  churchName: 'Parousia Baptist Church',
  subtitle: 'Daily Devotional & Study Guide',
  greeting: 'Dear Brothers and Sisters in Christ,',
  intro:
    'We are glad to provide this daily devotional guide to help you grow spiritually every day. It is a gift from our hearts to build our faith together.',
  closingQuote:
    'For where two or three are gathered in my name, there am I among them.',
  closingQuoteRef: 'Matthew 18:20',
  contactTitle: 'Contact Us',
  days: [
    {
      title: 'Day 1: Beginning with Faith',
      scriptureRef: 'Hebrews 11:1',
      scriptureText:
        'Now faith is the assurance of things hoped for, the conviction of things not seen.',
      meditation:
        'Faith is not just believing when everything goes well, but trusting God even in the midst of heavy storms. Today, leave all your worries in the hands of the Lord.',
      prayer:
        'Lord, give me strength to walk in faith today. Cleanse my heart and grant me assurance. Amen.',
    },
    {
      title: 'Day 2: Preparing for His Return',
      scriptureRef: '1 Thessalonians 4:16',
      scriptureText:
        'For the Lord himself will descend from heaven with a cry of command, with the voice of an archangel, and with the sound of the trumpet of God.',
      meditation:
        'The name of our church, "Parousia," means "The Lord\'s Return." We live every day with the hope and preparation to meet our Savior in the clouds.',
      prayer:
        'Jesus Christ, keep me ready. Help me live a life that pleases You until You return. Amen.',
    },
    {
      title: 'Day 3: Growing in Fellowship',
      scriptureRef: 'Psalm 133:1',
      scriptureText: 'Behold, how good and pleasant it is when brothers dwell in unity!',
      meditation:
        'We are designed to grow together. Support your brothers and sisters, carry their burdens, and pray for one another with sincerity.',
      prayer:
        'Heavenly Father, build unity among us. Help us love others as ourselves. Amen.',
    },
  ],
};

export const DEVOTIONAL_BOOKLET_FR: DevotionalBooklet = {
  churchName: 'Église Baptiste Parousie',
  subtitle: 'Dévotionnel quotidien et guide d’étude',
  greeting: 'Chers frères et sœurs en Christ,',
  intro:
    'Nous sommes heureux de vous offrir ce guide de dévotion quotidienne pour vous aider à grandir spirituellement chaque jour. C’est un cadeau de notre cœur pour bâtir notre foi ensemble.',
  closingQuote:
    'Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d’eux.',
  closingQuoteRef: 'Matthieu 18:20',
  contactTitle: 'Nous contacter',
  days: [
    {
      title: 'Jour 1 : Commencer par la foi',
      scriptureRef: 'Hébreux 11:1',
      scriptureText:
        'Or la foi est une ferme assurance des choses qu’on espère, une démonstration de celles qu’on ne voit pas.',
      meditation:
        'La foi ne consiste pas seulement à croire quand tout va bien, mais à faire confiance à Dieu même au milieu des grandes tempêtes. Aujourd’hui, remettez toutes vos inquiétudes entre les mains du Seigneur.',
      prayer:
        'Seigneur, donne-moi la force de marcher dans la foi aujourd’hui. Purifie mon cœur et accorde-moi l’assurance. Amen.',
    },
    {
      title: 'Jour 2 : Se préparer à Son retour',
      scriptureRef: '1 Thessaloniciens 4:16',
      scriptureText:
        'Car le Seigneur lui-même, à un signal donné, à la voix d’un archange et au son de la trompette de Dieu, descendra du ciel.',
      meditation:
        'Le nom de notre église, « Parousie », signifie « le retour du Seigneur ». Nous vivons chaque jour dans l’espérance et la préparation de rencontrer notre Sauveur dans les nuées.',
      prayer:
        'Jésus-Christ, garde-moi prêt. Aide-moi à vivre une vie qui Te plaît jusqu’à Ton retour. Amen.',
    },
    {
      title: 'Jour 3 : Grandir dans la communion',
      scriptureRef: 'Psaume 133:1',
      scriptureText: 'Voici, combien il est bon et agréable que des frères habitent ensemble!',
      meditation:
        'Nous sommes faits pour grandir ensemble. Soutenez vos frères et sœurs, portez leurs fardeaux et priez les uns pour les autres avec sincérité.',
      prayer:
        'Père céleste, bâtis l’unité parmi nous. Aide-nous à aimer les autres comme nous-mêmes. Amen.',
    },
  ],
};

export function getDevotionalBooklet(lang: 'en' | 'fr'): DevotionalBooklet {
  return lang === 'fr' ? DEVOTIONAL_BOOKLET_FR : DEVOTIONAL_BOOKLET_EN;
}

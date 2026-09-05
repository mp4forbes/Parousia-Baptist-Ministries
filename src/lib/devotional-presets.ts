export type DevotionalPreset = {
  theme: string;
  refEn: string;
  refHt: string;
  textEn: string;
  textHt: string;
  lessonEn: string;
  lessonHt: string;
};

const DEFAULT_THEME =
  'a timely morning encouragement from Scripture (choose a well-known passage on hope, faith, character, healing, or perseverance)';

export function buildDevotionalGeminiPrompt(theme: string): string {
  const topic = theme.trim() || DEFAULT_THEME;
  return `Act as a modern Christian devotional writer and spiritual coach for Parousia Baptist Ministries.
Write an uplifting, practical morning devotional formatted specifically for a community group chat (Discord/WhatsApp/Slack).

Theme or Passage: "${topic}"

CRITICAL LANGUAGE RULES:
- Produce TWO complete versions: English AND proper standard French (français standard).
- JSON properties ending in "_kreyol" are LEGACY database names only. They MUST contain standard French. NEVER write Haitian Creole.
- Do not convert, translate, or generate Haitian Creole (no Annou, Seyè, Chonje, gaya, kote, Frè m, lekòl spellings, Creole grammar, etc.).
- English scripture: NLT or another modern English translation, accurate and well-known.
- French scripture: a modern French Bible (Segond 21, NBS, or equivalent polished French — never Creole).
- French book names: Jean, Romains, Galates, Josué, Ésaïe, Hébreux, Éphésiens, Philippiens, Jérémie, 1 Corinthiens, etc.

NEVER write a 2–4 sentence pastoral paragraph. lesson_english and lesson_kreyol must be a FULL group-chat morning devotional (about 25–45 short lines), not a blurb.

Follow this exact structure, voice, and layout for BOTH languages.
Use single-line breaks (newline characters) so the message is rhythmically scannable in a group chat.
In the French lesson, use French headings: « 💎 La sagesse du jour... » and « 🙏🏾 Prière ».

QUALITY SAMPLE (match this depth, rhythm, and length — do not copy the Jeremiah text unless that is the chosen passage):

Scripture: Jeremiah 29:11 (NLT)
“‘For I know the plans I have for you,’ says the Lord. ‘They are plans for good and not for disaster, to give you a future and a hope.’”

We often quote this verse at graduations and fresh starts—but God spoke these words to people living in Babylonian exile.

They were trapped in a season they didn't choose, waiting for a breakthrough that was still years away.

Yet God reminded them: An unexpected detour in your life is not a cancellation of His promise.

That’s faith.

🌱 A seed buried in the dirt feels like it's trapped in a grave, but in reality, it's just being positioned to grow. What feels like an ending is often God's quiet preparation.

Uncertainty will always offer you a choice:

“Now that you can't see the full path, will you panic or will you trust?”

“Now that your timeline fell apart, will you give up or lean in?”

“Now that God feels silent, will you assume He has forgotten you?”

God essentially says, “Your current location does not limit My ultimate destination for you.”

💎 Today’s Wisdom...
Hope isn’t pretending the waiting season is easy. It’s trusting that God is working while you wait.

Let delay teach you patience.
Let confusion teach you surrender.
Let unanswered questions teach you deeper trust.
Let the waiting room teach you how to prepare for the promise.

You don't have to figure out the next ten years to trust God with today.

Sometimes the greatest evidence of spiritual maturity is this:
You have every reason to be anxious about the future—and somehow, you are completely at peace.

🙏🏾 Prayer
Father, quiet my anxious heart when life doesn’t match my timeline. Forgive me for confusing a delay with Your absence. Remind me that You are already in my tomorrow, working all things together for my good. Teach me to thrive right where I am while holding onto the hope You’ve placed ahead of me. In Jesus’ name, amen.

Required sections — the lesson MUST begin with the actual scripture quote before any interpretation:
1. Line 1: Scripture: [reference] (NLT) / Écriture : [référence]
2. Line 2+: the exact 1–2 verse quote in quotation marks (full verse text, not a paraphrase)
3. Blank line, then 3–5 short lines of interpretation (who heard it, what they were living through, what the promise meant)
4. The Core Lesson: vivid metaphor (🌱 / 🔥), 3 quoted rhetorical questions, summarizing conviction
5. "💎 Today’s Wisdom..." / "💎 La sagesse du jour..." with aphorism, 4-line list, mic-drop takeaway
6. "🙏🏾 Prayer" / "🙏🏾 Prière" — 4–5 sentences, closing in Jesus' name

Do NOT start with "Good morning" or narrative before the quoted verse. The quoted scripture text must be the first content in the lesson body.

Tone: Empathetic, rhythmically scannable, punchy, spiritually grounded without being archaic or preachy.

The verse_ref_* and verse_text_* fields must match the scripture quoted in the lessons.

Return JSON with this exact shape:
{
  "verse_ref_english": "e.g. Romans 12:21",
  "verse_ref_kreyol": "e.g. Romains 12:21 (French reference; legacy property name)",
  "verse_text_english": "1–2 verses in modern English",
  "verse_text_kreyol": "the same verses in standard French (legacy property name)",
  "lesson_english": "full English group-chat body with newline separators",
  "lesson_kreyol": "full standard-French group-chat body with newline separators (legacy property name)"
}`;
}

export const FALLBACK_DEVOTIONAL: Omit<DevotionalPreset, 'theme'> = {
  refEn: '1 Thessalonians 4:16-17',
  refHt: '1 Thessaloniciens 4:16-17',
  textEn:
    'For the Lord himself will come down from heaven with a commanding shout, with the voice of the archangel, and with the trumpet call of God. First, the believers who have died will rise from their graves. Then, together with them, we who are still alive and remain on the earth will be caught up in the clouds to meet the Lord in the air. Then we will be with the Lord forever.',
  textHt:
    'Car le Seigneur lui-même, à un signal donné, à la voix d’un archange et au son de la trompette de Dieu, descendra du ciel. Les morts en Christ ressusciteront d’abord. Ensuite, nous les vivants qui serons restés, nous serons tous ensemble enlevés avec eux sur des nuées, à la rencontre du Seigneur dans les airs, et ainsi nous serons toujours avec le Seigneur.',
  lessonEn: `Good morning @everyone 🙏🏾

"The Reunion Is Still on the Calendar"

📖 1 Thessalonians 4:16-17 (NLT)
"For the Lord himself will come down from heaven with a commanding shout... Then we will be with the Lord forever."

Paul wrote this to grieving people, not to debate-club Christians. Someone they loved had died, and they were afraid hope had an expiration date. This passage is not a scare tactic. It is a promise that goodbye is not the last word God speaks over your life.

🔥 A trumpet can startle a city, but it can also call a family home. What you do with the waiting is who you become.

Now that you know what absence feels like, will you treat people as disposable?
Now that you know what grief feels like, will you rush someone else's healing?
Now that you know what longing feels like, will you live as if forever is a rumor?

Your pain is allowed to make you tender. It is not allowed to make you hopeless.

💎 Today's Wisdom...
Healing names the ache. Maturity keeps watching the sky with a clean heart.

Let grief teach you how to hold people gently.
Let delay teach you how to stay faithful.
Let loneliness teach you how to become a refuge.
Let longing teach you how to live ready.

Bitterness is just grief that refused to become hope. Don't let it sign your name.

🙏🏾 Prayer
Father, I bring You the empty chairs and the unanswered questions. Protect my character from being corrupted by loss. Keep my hope from turning into hardness, and my waiting from turning into unbelief. Teach me to love people as if eternity is real, because it is. I want to be found ready, and kind, when You come. In Jesus' name, amen.`,
  lessonHt: `Bonjour à tous 🙏🏾

« Les retrouvailles sont encore inscrites au calendrier »

📖 1 Thessaloniciens 4:16-17
« Car le Seigneur lui-même, à un signal donné, à la voix d’un archange et au son de la trompette de Dieu, descendra du ciel... ainsi nous serons toujours avec le Seigneur. »

Paul écrivait à des cœurs en deuil, non à un club de débats. Quelqu’un qu’ils aimaient était mort, et ils craignaient que l’espérance ait une date de péremption. Ce passage n’est pas une intimidation. C’est une promesse : au revoir n’est pas le dernier mot que Dieu prononce sur ta vie.

🔥 Une trompette peut faire sursauter une ville, mais elle peut aussi rappeler une famille à la maison. Ce que tu fais de l’attente, c’est ce que tu deviens.

Maintenant que tu sais ce que l’absence fait au cœur, vas-tu traiter les gens comme s’ils étaient jetables ?
Maintenant que tu sais ce qu’est le deuil, vas-tu presser la guérison de quelqu’un d’autre ?
Maintenant que tu sais ce qu’est le manque, vas-tu vivre comme si l’éternité n’était qu’une rumeur ?

Ta douleur a le droit de te rendre tendre. Elle n’a pas le droit de te rendre désespéré.

💎 La sagesse du jour...
La guérison nomme le manque. La maturité continue de regarder le ciel avec un cœur net.

Que le deuil t’apprenne à tenir les gens avec douceur.
Que le délai t’apprenne à rester fidèle.
Que la solitude t’apprenne à devenir un refuge.
Que le désir t’apprenne à vivre prêt.

L’amertume, c’est un deuil qui a refusé de devenir espérance. Ne la laisse pas signer à ta place.

🙏🏾 Prière
Père, je Te confie les chaises vides et les questions sans réponse. Protège mon caractère pour que la perte ne le corrompe pas. Empêche mon espérance de se changer en dureté, et mon attente en incrédulité. Apprends-moi à aimer les gens comme si l’éternité était vraie, parce qu’elle l’est. Je veux être trouvé prêt, et bon, à Ton retour. Au nom de Jésus, amen.`,
};

export const DEVOTIONAL_PRESETS: DevotionalPreset[] = [
  {
    theme: 'strength',
    refEn: 'Galatians 6:9',
    refHt: 'Galates 6:9',
    textEn:
      "So let's not get tired of doing what is good. At just the right time we will reap a harvest of blessing if we don't give up.",
    textHt:
      'Ne nous lassons pas de faire le bien, car nous récolterons au moment voulu, si nous ne nous relâchons pas.',
    lessonEn: `Good morning @everyone 🙏🏾

"Don't Quit in the Middle of the Miracle"

📖 Galatians 6:9 (NLT)
"So let's not get tired of doing what is good. At just the right time we will reap a harvest of blessing if we don't give up."

Paul was writing to tired believers — people who had done the right thing long enough to wonder if it even mattered. Exhaustion is not a lack of faith. It is often the cost of caring. This verse is not a scolding. It is a promise to the weary: the harvest is still on the calendar.

🔥 A seed can look dead in the dirt, but that is not the same as being finished. What you water in secret will speak in public.

Now that you know what burnout feels like, will you mock someone else's tired hands?
Now that you know what waiting feels like, will you rush someone else's process?
Now that you know what being overlooked feels like, will you withhold encouragement?

Your pain is allowed to inform you. It is not allowed to rewrite your character.

💎 Today's Wisdom...
Healing names the wound. Maturity refuses to become the wound.

Let exhaustion teach you how to rest without quitting.
Let delay teach you how to keep showing up.
Let disappointment teach you how to stay kind.
Let the long road teach you how to keep faith with people.

Bitterness is just a harvest you planted on purpose. Don't water it.

🙏🏾 Prayer
Father, I come to You tired but still willing. Protect my heart from growing cold where it once was generous. Teach me to do good without needing instant results. Guard my character so that pain does not turn me into someone I would not want to meet. Give me courage to keep planting when the field looks empty. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« Ne lâche pas au milieu du miracle »

📖 Galates 6:9
« Ne nous lassons pas de faire le bien, car nous récolterons au moment voulu, si nous ne nous relâchons pas. »

Paul s’adressait à des croyants fatigués — des gens qui avaient assez longtemps fait le bien pour se demander si cela servait encore à quelque chose. L’épuisement n’est pas un manque de foi. C’est souvent le prix de l’amour. Ce verset n’est pas un reproche. C’est une promesse aux cœurs las : la moisson est encore inscrite au calendrier.

🔥 Une graine peut sembler morte sous la terre, mais cela ne veut pas dire qu’elle a fini son travail. Ce que tu arroses en secret parlera un jour en public.

Maintenant que tu sais ce que l’épuisement fait au cœur, vas-tu te moquer des mains fatiguées d’un autre ?
Maintenant que tu sais ce qu’est l’attente, vas-tu presser le processus de quelqu’un d’autre ?
Maintenant que tu sais ce que c’est d’être oublié, vas-tu retenir tes encouragements ?

Ta douleur a le droit de t’enseigner. Elle n’a pas le droit de réécrire ton caractère.

💎 La sagesse du jour...
La guérison nomme la blessure. La maturité refuse de devenir la blessure.

Que la fatigue t’apprenne à te reposer sans abandonner.
Que le délai t’apprenne à continuer de te présenter.
Que la déception t’apprenne à rester bon.
Que le long chemin t’apprenne à rester fidèle aux autres.

L’amertume, c’est une moisson que l’on sème exprès. Ne l’arrose pas.

🙏🏾 Prière
Père, je viens à Toi fatigué, mais encore disposé. Protège mon cœur pour qu’il ne se refroidisse pas là où il était généreux. Apprends-moi à faire le bien sans exiger un résultat immédiat. Garde mon caractère, afin que la douleur ne fasse pas de moi quelqu’un que je ne voudrais pas rencontrer. Donne-moi le courage de continuer à semer, même si le champ paraît vide. Au nom de Jésus, amen.`,
  },
  {
    theme: 'strength',
    refEn: 'Joshua 1:9',
    refHt: 'Josué 1:9',
    textEn:
      'This is my command—be strong and courageous! Do not be afraid or discouraged. For the Lord your God is with you wherever you go.',
    textHt:
      'Ne te l’ai-je pas ordonné ? Fortifie-toi et prends courage. Ne t’effraie pas et ne t’épouvante pas, car l’Éternel, ton Dieu, est avec toi partout où tu iras.',
    lessonEn: `Good morning @everyone 🙏🏾

"Courage Is a Command, Not a Mood"

📖 Joshua 1:9 (NLT)
"This is my command—be strong and courageous! Do not be afraid or discouraged. For the Lord your God is with you wherever you go."

Joshua was standing in a gap Moses used to fill. New land. Old fear. Heavy assignment. God did not wait for Joshua to feel brave. He told him to walk as if presence was already the fact, because it was.

🔥 A backpack can weigh you down, or it can carry what you need for the road. Fear is only useful if you make it pack water, not stones.

Now that you know what abandonment feels like, will you leave someone else to walk alone?
Now that you know what intimidation feels like, will you become the loudest threat in the room?
Now that you know what starting over feels like, will you shame people who are still at the shoreline?

Your history can explain your caution. It cannot cancel your calling.

💎 Today's Wisdom...
Healing admits the trembling. Maturity still takes the next step.

Let fear teach you how to pray before you move.
Let unfamiliar places teach you how to trust Presence.
Let pressure teach you how to stand without becoming hard.
Let the unknown teach you how to obey without a full map.

Courage is not the absence of shaking. It is refusing to let shaking become your god.

🙏🏾 Prayer
Father, I do not always feel strong, but I do not want to live small. Go with me into the rooms that scare me. Protect my character from fear’s counterfeit versions of wisdom — control, withdrawal, and cruelty. Make me brave enough to be kind, and steady enough to keep walking. I trust that You are already where I am going. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« Le courage est un ordre, pas une humeur »

📖 Josué 1:9
« Ne te l’ai-je pas ordonné ? Fortifie-toi et prends courage. Ne t’effraie pas et ne t’épouvante pas, car l’Éternel, ton Dieu, est avec toi partout où tu iras. »

Josué se tenait dans un vide que Moïse remplissait auparavant. Terre nouvelle. Peur ancienne. Mission lourde. Dieu n’a pas attendu que Josué se sente brave. Il lui a dit de marcher comme si la présence était déjà un fait, parce qu’elle l’était.

🔥 Un sac à dos peut t’écraser, ou porter ce qu’il te faut pour la route. La peur n’est utile que si tu lui fais porter de l’eau, pas des pierres.

Maintenant que tu sais ce que c’est d’être laissé, vas-tu laisser quelqu’un d’autre marcher seul ?
Maintenant que tu sais ce qu’est l’intimidation, vas-tu devenir la plus grande menace de la pièce ?
Maintenant que tu sais ce qu’est un nouveau départ, vas-tu humilier ceux qui sont encore sur le rivage ?

Ton histoire peut expliquer ta prudence. Elle ne peut pas annuler ton appel.

💎 La sagesse du jour...
La guérison avoue le tremblement. La maturité fait quand même le pas suivant.

Que la peur t’apprenne à prier avant de bouger.
Que les lieux inconnus t’apprennent à faire confiance à la Présence.
Que la pression t’apprenne à tenir sans devenir dur.
Que l’inconnu t’apprenne à obéir sans carte complète.

Le courage n’est pas l’absence de tremblement. C’est le refus de laisser le tremblement devenir ton dieu.

🙏🏾 Prière
Père, je ne me sens pas toujours fort, mais je ne veux pas vivre petit. Accompagne-moi dans les pièces qui me font peur. Protège mon caractère des fausses sagesses de la crainte — le contrôle, le repli et la dureté. Rends-moi assez brave pour rester bon, et assez stable pour continuer à marcher. Je crois que Tu es déjà là où je vais. Au nom de Jésus, amen.`,
  },
  {
    theme: 'strength',
    refEn: 'Philippians 4:13',
    refHt: 'Philippiens 4:13',
    textEn: 'For I can do everything through Christ, who gives me strength.',
    textHt: 'Je puis tout par celui qui me fortifie.',
    lessonEn: `Good morning @everyone 🙏🏾

"Strength Is Borrowed, Not Bragged"

📖 Philippians 4:13 (NLT)
"For I can do everything through Christ, who gives me strength."

Paul wrote this from limitation, not from a highlight reel. He had learned to live with plenty and with lack. This verse is not a slogan for winning every contest. It is the confession of a man who found Christ’s power in the places his own ran out.

🔥 Electricity can light a house, but only if the house stays plugged in. Talent without dependence is just a dark room with expensive wiring.

Now that you know what emptiness feels like, will you shame people who are still running on fumes?
Now that you know what needing help feels like, will you pretend you built yourself?
Now that you know what weakness feels like, will you crush someone who cannot carry what you carry?

Your scars can become testimony. They do not have to become superiority.

💎 Today's Wisdom...
Healing admits the limit. Maturity stays connected to the Source.

Let weakness teach you how to ask for help.
Let pressure teach you how to lean, not perform.
Let success teach you how to stay humble.
Let fatigue teach you how to receive strength instead of faking it.

Bitterness says, "I had to survive alone." Maturity says, "I will not make anyone else do that."

🙏🏾 Prayer
Lord Jesus, I cannot do this day in my own voltage. Protect my character from pride when I feel strong and from despair when I feel empty. Teach me to borrow Your strength without turning it into a speech about myself. Keep my heart soft toward people who are still exhausted. Be my power, my patience, and my peace. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« La force se reçoit, elle ne se clame pas »

📖 Philippiens 4:13
« Je puis tout par celui qui me fortifie. »

Paul a écrit cela depuis la limitation, non depuis un palmarès. Il avait appris à vivre dans l’abondance et dans le manque. Ce verset n’est pas un slogan pour gagner tous les concours. C’est la confession d’un homme qui a trouvé la puissance du Christ là où la sienne s’arrêtait.

🔥 L’électricité peut éclairer une maison, mais seulement si la maison reste branchée. Le talent sans dépendance, c’est une pièce sombre avec un câblage coûteux.

Maintenant que tu sais ce qu’est le vide, vas-tu humilier ceux qui marchent encore sur leurs dernières réserves ?
Maintenant que tu sais ce qu’est le besoin d’aide, vas-tu faire semblant de t’être construit tout seul ?
Maintenant que tu sais ce qu’est la faiblesse, vas-tu écraser quelqu’un qui ne peut pas porter ce que tu portes ?

Tes cicatrices peuvent devenir un témoignage. Elles n’ont pas à devenir une supériorité.

💎 La sagesse du jour...
La guérison avoue la limite. La maturité reste branchée à la Source.

Que la faiblesse t’apprenne à demander de l’aide.
Que la pression t’apprenne à t’appuyer, non à jouer un rôle.
Que le succès t’apprenne à rester humble.
Que la fatigue t’apprenne à recevoir la force au lieu de la simuler.

L’amertume dit : « J’ai dû survivre seul. » La maturité dit : « Je ne forcerai personne d’autre à faire cela. »

🙏🏾 Prière
Seigneur Jésus, je ne peux pas vivre cette journée sur ma propre tension. Protège mon caractère de l’orgueil quand je me sens fort, et du désespoir quand je me sens vide. Apprends-moi à recevoir Ta force sans en faire un discours sur moi-même. Garde mon cœur doux envers ceux qui sont encore épuisés. Sois ma puissance, ma patience et ma paix. Au nom de Jésus, amen.`,
  },
  {
    theme: 'love',
    refEn: 'Romans 8:28',
    refHt: 'Romains 8:28',
    textEn:
      'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.',
    textHt:
      'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.',
    lessonEn: `Good morning @everyone 🙏🏾

"God Is Still Weaving the Mess"

📖 Romans 8:28 (NLT)
"And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them."

Paul is not saying every event is good. He is saying God is still employed on the days that look wasted. The verse is for people who cannot yet see the pattern — not for people who want a shortcut around grief.

🔥 A loom can look like a tangle until you step back. Threads that felt like accidents can become the strength of the cloth.

Now that you know what confusion feels like, will you mock someone still in the tangle?
Now that you know what delay feels like, will you declare someone else's story finished too soon?
Now that you know what "why, God?" feels like, will you offer cheap answers instead of presence?

Your chapter can be painful without being pointless. Don't make pain your theology.

💎 Today's Wisdom...
Healing tells the truth about the wound. Maturity trusts God with the weave.

Let confusion teach you how to wait without becoming cynical.
Let loss teach you how to hold mystery with reverence.
Let unanswered questions teach you how to stay honest in prayer.
Let the slow plot teach you how to be gentle with other people's unfinished pages.

Bitterness is what happens when we demand a finished tapestry from a still-moving loom.

🙏🏾 Prayer
Father, I cannot see the whole cloth yet. Protect my character from the lie that pain is proof You left. Teach me to love You in the middle of the tangle, not only after the explanation. Keep me from using my story as a weapon against people who are still hurting. Weave even this into purpose, and keep my heart from rotting while You work. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« Dieu tisse encore le désordre »

📖 Romains 8:28
« Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein. »

Paul ne dit pas que chaque événement est bon. Il dit que Dieu est encore à l’œuvre les jours qui semblent perdus. Ce verset est pour ceux qui ne voient pas encore le motif — pas pour ceux qui veulent un raccourci autour du chagrin.

🔥 Un métier à tisser peut ressembler à un nœud tant qu’on ne recule pas. Des fils qui semblaient des accidents peuvent devenir la force du tissu.

Maintenant que tu sais ce qu’est la confusion, vas-tu te moquer de quelqu’un encore pris dans le nœud ?
Maintenant que tu sais ce qu’est le délai, vas-tu déclarer trop tôt que l’histoire d’un autre est terminée ?
Maintenant que tu sais ce que c’est de crier « pourquoi, Dieu ? », vas-tu offrir des réponses bon marché au lieu de ta présence ?

Ton chapitre peut être douloureux sans être inutile. Ne fais pas de la douleur ta théologie.

💎 La sagesse du jour...
La guérison dit la vérité sur la blessure. La maturité confie le tissage à Dieu.

Que la confusion t’apprenne à attendre sans devenir cynique.
Que la perte t’apprenne à tenir le mystère avec respect.
Que les questions sans réponse t’apprennent à rester honnête dans la prière.
Que l’intrigue lente t’apprenne à être doux avec les pages inachevées des autres.

L’amertume, c’est ce qui arrive quand on exige une tapisserie achevée d’un métier qui travaille encore.

🙏🏾 Prière
Père, je ne vois pas encore tout le tissu. Protège mon caractère du mensonge qui dit que la douleur prouve Ton départ. Apprends-moi à T’aimer au milieu du nœud, pas seulement après l’explication. Empêche-moi d’utiliser mon histoire comme une arme contre ceux qui souffrent encore. Tisse même cela dans Ton dessein, et garde mon cœur de pourrir pendant que Tu travailles. Au nom de Jésus, amen.`,
  },
  {
    theme: 'hope',
    refEn: 'Isaiah 40:31',
    refHt: 'Ésaïe 40:31',
    textEn:
      'But those who trust in the Lord will find new strength. They will soar high on wings like eagles. They will run and not grow weary. They will walk and not faint.',
    textHt:
      'Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent leur envol comme les aigles ; ils courent et ne se lassent point, ils marchent et ne se fatiguent point.',
    lessonEn: `Good morning @everyone 🙏🏾

"Waiting Is Not Weakness"

📖 Isaiah 40:31 (NLT)
"But those who trust in the Lord will find new strength. They will soar high on wings like eagles. They will run and not grow weary. They will walk and not faint."

Isaiah spoke to exhausted people who thought God had gone quiet. Exile had drained them. This promise is not for the already-rested. It is for the ones who can barely walk, and need God to put wind back under tired wings.

🔥 An eagle does not flap harder to prove it is holy. It finds the current and rises. Some of the strength you need is received, not performed.

Now that you know what depletion feels like, will you demand a performance from someone who is barely standing?
Now that you know what waiting feels like, will you call patience laziness?
Now that you know what fainting feels like, will you hide your limp so nobody else feels allowed to rest?

Your tiredness is data. It is not your identity.

💎 Today's Wisdom...
Healing admits the crash. Maturity learns to wait on God instead of punishing the body and the soul.

Let weariness teach you how to trust instead of hustle.
Let silence teach you how to listen.
Let slowness teach you how to walk without shame.
Let renewal teach you how to give other people room to breathe.

Bitterness sprints on empty and then blames everyone who stopped to drink water.

🙏🏾 Prayer
Lord, I am more tired than I want to admit. Renew what collapse tried to steal. Protect my character from turning exhaustion into contempt — for myself or for anyone else. Teach me to wait on You without quitting on people. Put wind under my wings, and keep my heart from growing sharp while I recover. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« Attendre n’est pas une faiblesse »

📖 Ésaïe 40:31
« Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent leur envol comme les aigles ; ils courent et ne se lassent point, ils marchent et ne se fatiguent point. »

Ésaïe parlait à un peuple épuisé qui croyait que Dieu s’était tu. L’exil les avait vidés. Cette promesse n’est pas pour ceux qui sont déjà reposés. Elle est pour ceux qui peinent à marcher, et qui ont besoin que Dieu remette du vent sous des ailes fatiguées.

🔥 Un aigle ne bat pas plus fort des ailes pour prouver qu’il est saint. Il trouve le courant et s’élève. Une part de la force dont tu as besoin se reçoit, elle ne se joue pas.

Maintenant que tu sais ce qu’est l’épuisement, vas-tu exiger un spectacle de quelqu’un qui tient à peine debout ?
Maintenant que tu sais ce qu’est l’attente, vas-tu appeler la patience de la paresse ?
Maintenant que tu sais ce qu’est défaillir, vas-tu cacher ta boiterie pour que personne d’autre n’ose se reposer ?

Ta fatigue est une information. Elle n’est pas ton identité.

💎 La sagesse du jour...
La guérison avoue l’effondrement. La maturité apprend à attendre Dieu au lieu de punir le corps et l’âme.

Que la lassitude t’apprenne à faire confiance plutôt qu’à t’agiter.
Que le silence t’apprenne à écouter.
Que la lenteur t’apprenne à marcher sans honte.
Que le renouveau t’apprenne à laisser aux autres de l’air pour respirer.

L’amertume sprinte à vide, puis accuse tous ceux qui se sont arrêtés pour boire.

🙏🏾 Prière
Seigneur, je suis plus fatigué que je ne veux l’avouer. Renouvelle ce que l’effondrement a voulu voler. Protège mon caractère pour que l’épuisement ne devienne pas du mépris — envers moi-même ou envers quiconque. Apprends-moi à T’attendre sans abandonner les gens. Mets du vent sous mes ailes, et empêche mon cœur de devenir tranchant pendant que je me relèverai. Au nom de Jésus, amen.`,
  },
  {
    theme: 'faith',
    refEn: 'Hebrews 11:1',
    refHt: 'Hébreux 11:1',
    textEn: 'Faith shows the reality of what we hope for; it is the evidence of things we cannot see.',
    textHt:
      'Or la foi, c’est la ferme assurance des choses qu’on espère, la démonstration de celles qu’on ne voit pas.',
    lessonEn: `Good morning @everyone 🙏🏾

"Faith Is How You Walk in the Dark Without Becoming Dark"

📖 Hebrews 11:1 (NLT)
"Faith shows the reality of what we hope for; it is the evidence of things we cannot see."

Hebrews was written to people tempted to quit because the visible world was loud and the promise felt late. Faith is not pretending the dark is light. It is refusing to let the dark have the last definition of reality.

🔥 A compass does not change the storm. It keeps you from calling the storm "north."

Now that you know what doubt feels like, will you mock the person still learning to trust?
Now that you know what unanswered prayer feels like, will you become cynical on someone else's behalf?
Now that you know what invisibility feels like, will you only honor what can be posted and proven?

Your questions can be honest. They do not have to become unbelief with a microphone.

💎 Today's Wisdom...
Healing tells the truth about what you cannot see. Maturity still obeys the God who can.

Let uncertainty teach you how to cling, not collapse.
Let delay teach you how to keep a soft yes.
Let invisibility teach you how to work without an audience.
Let hope teach you how to speak life without lying about the facts.

Bitterness is faith that got tired and started preaching despair as "realism."

🙏🏾 Prayer
Father, I cannot see the whole path, and I am tired of pretending I can. Protect my character from using disappointment as an excuse to stop trusting You. Give me a faith that is honest, sturdy, and kind. Keep me from becoming the voice that talks others out of hope. I will walk toward what I cannot yet see, because You are already there. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« La foi, c’est marcher dans le noir sans devenir sombre »

📖 Hébreux 11:1
« Or la foi, c’est la ferme assurance des choses qu’on espère, la démonstration de celles qu’on ne voit pas. »

L’épître aux Hébreux s’adressait à des gens tentés d’abandonner, parce que le monde visible criait fort et que la promesse semblait en retard. La foi, ce n’est pas faire semblant que la nuit est lumière. C’est refuser de laisser la nuit définir toute la réalité.

🔥 Une boussole ne change pas la tempête. Elle t’empêche d’appeler la tempête « le nord ».

Maintenant que tu sais ce qu’est le doute, vas-tu te moquer de celui qui apprend encore à faire confiance ?
Maintenant que tu sais ce qu’est une prière sans réponse, vas-tu devenir cynique à la place de quelqu’un d’autre ?
Maintenant que tu sais ce qu’est l’invisibilité, vas-tu n’honorer que ce qui peut être publié et prouvé ?

Tes questions peuvent être honnêtes. Elles n’ont pas à devenir une incrédulité avec un micro.

💎 La sagesse du jour...
La guérison dit la vérité sur ce que tu ne vois pas. La maturité obéit quand même au Dieu qui voit.

Que l’incertitude t’apprenne à t’accrocher, non à t’effondrer.
Que le délai t’apprenne à garder un oui doux.
Que l’invisibilité t’apprenne à travailler sans public.
Que l’espérance t’apprenne à parler vie sans mentir sur les faits.

L’amertume, c’est une foi fatiguée qui s’est mise à prêcher le désespoir comme du « réalisme ».

🙏🏾 Prière
Père, je ne vois pas tout le chemin, et j’en ai assez de faire semblant. Protège mon caractère pour que la déception ne devienne pas une excuse pour cesser de Te faire confiance. Donne-moi une foi honnête, solide et bonne. Empêche-moi de devenir la voix qui détourne les autres de l’espérance. Je marcherai vers ce que je ne vois pas encore, parce que Tu y es déjà. Au nom de Jésus, amen.`,
  },
  {
    theme: 'peace',
    refEn: 'John 14:27',
    refHt: 'Jean 14:27',
    textEn:
      'I am leaving you with a gift—peace of mind and heart. And the peace I give is a gift the world cannot give. So don’t be troubled or afraid.',
    textHt:
      'Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s’alarme point.',
    lessonEn: `Good morning @everyone 🙏🏾

"Peace Is a Person, Not a Perfect Week"

📖 John 14:27 (NLT)
"I am leaving you with a gift—peace of mind and heart. And the peace I give is a gift the world cannot give. So don’t be troubled or afraid."

Jesus said this on the way to the cross, not after a spa day. The disciples were about to watch their world split open. He did not offer them a quieter news cycle. He offered them Himself — a peace that can sit in a shaking room and still tell the heart, "You are not abandoned."

🔥 A lighthouse does not stop the waves. It keeps the ship from using the waves as its map.

Now that you know what panic feels like, will you become someone else's storm?
Now that you know what a troubled heart feels like, will you mock people who cannot "just calm down"?
Now that you know what fear feels like, will you control everyone around you so you never feel it again?

Your nervous system may have a story. Your character still has a choice.

💎 Today's Wisdom...
Healing names the alarm. Maturity lets Jesus hold the room.

Let anxiety teach you how to return to prayer instead of control.
Let chaos teach you how to become a calm presence.
Let fear teach you how to tell the truth without spreading it like a virus.
Let peace teach you how to leave people better than you found them.

Bitterness is just fear that learned how to bite.

🙏🏾 Prayer
Jesus, my heart knows how to panic. I receive the peace the world cannot manufacture. Protect my character from turning fear into control, sarcasm, or withdrawal. Make me a person who can sit in a shaking room and still bless it. Guard my mouth and my mood today. I want Your peace to be the loudest thing in me. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« La paix est une Personne, pas une semaine parfaite »

📖 Jean 14:27
« Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s’alarme point. »

Jésus a dit cela en allant vers la croix, non après un jour de repos. Les disciples allaient voir leur monde se fendre. Il ne leur a pas promis un journal plus calme. Il s’est donné Lui-même — une paix capable de s’asseoir dans une pièce qui tremble et de dire encore au cœur : « Tu n’es pas abandonné. »

🔥 Un phare n’arrête pas les vagues. Il empêche le navire de prendre les vagues pour une carte.

Maintenant que tu sais ce qu’est la panique, vas-tu devenir la tempête de quelqu’un d’autre ?
Maintenant que tu sais ce qu’est un cœur troublé, vas-tu te moquer de ceux qui ne peuvent pas « se calmer, un point c’est tout » ?
Maintenant que tu sais ce qu’est la peur, vas-tu tout contrôler autour de toi pour ne plus jamais la sentir ?

Ton système nerveux a peut-être une histoire. Ton caractère a encore un choix.

💎 La sagesse du jour...
La guérison nomme l’alarme. La maturité laisse Jésus tenir la pièce.

Que l’anxiété t’apprenne à revenir à la prière plutôt qu’au contrôle.
Que le chaos t’apprenne à devenir une présence calme.
Que la peur t’apprenne à dire la vérité sans la répandre comme un virus.
Que la paix t’apprenne à laisser les gens mieux que tu ne les as trouvés.

L’amertume, c’est une peur qui a appris à mordre.

🙏🏾 Prière
Jésus, mon cœur sait paniquer. Je reçois la paix que le monde ne peut pas fabriquer. Protège mon caractère pour que la peur ne devienne pas du contrôle, du sarcasme ou du repli. Fais de moi quelqu’un capable de s’asseoir dans une pièce qui tremble et de la bénir encore. Garde ma bouche et mon humeur aujourd’hui. Je veux que Ta paix soit la voix la plus forte en moi. Au nom de Jésus, amen.`,
  },
  {
    theme: 'grace',
    refEn: 'Ephesians 2:8',
    refHt: 'Éphésiens 2:8',
    textEn:
      'God saved you by his grace when you believed. And you can’t take credit for this; it is a gift from God.',
    textHt:
      'Car c’est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c’est le don de Dieu.',
    lessonEn: `Good morning @everyone 🙏🏾

"You Were Gifted, Not Graded"

📖 Ephesians 2:8 (NLT)
"God saved you by his grace when you believed. And you can’t take credit for this; it is a gift from God."

Paul is cutting the ladder out from under religious pride. If grace got you in, grace has to shape how you treat people who are still finding the door. This is not permission to stay careless. It is a command to stay humble.

🔥 A gift can be received with thanks, or inspected like a paycheck you think you earned. The posture you choose becomes the way you handle everyone else.

Now that you know what shame feels like, will you keep a running score on somebody else?
Now that you know what unearned mercy feels like, will you make people audition for your kindness?
Now that you know what being rescued feels like, will you become the gatekeeper you once needed to be freed from?

Grace that stops at you is just ego with church language.

💎 Today's Wisdom...
Healing receives the gift. Maturity becomes generous with the same gift.

Let shame teach you how to cover others, not expose them.
Let mercy teach you how to drop the clipboard.
Let your past teach you how to be patient with slow growth.
Let gratitude teach you how to speak softly to people still in process.

Bitterness is what happens when we forget we arrived by gift and start charging admission.

🙏🏾 Prayer
Father, I did not earn the air I am breathing, and I did not earn the cross. Protect my character from turning grace into a ranking system. Keep me from humiliating people You are still saving. Make me a doorway, not a checkpoint. Thank You for the gift. Help me give it away with clean hands. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« Tu as été comblé, tu n’as pas été noté »

📖 Éphésiens 2:8
« Car c’est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c’est le don de Dieu. »

Paul coupe l’échelle sous l’orgueil religieux. Si la grâce t’a fait entrer, la grâce doit aussi former ta manière de traiter ceux qui cherchent encore la porte. Ce n’est pas une permission de rester négligent. C’est un appel à rester humble.

🔥 Un cadeau peut se recevoir avec reconnaissance, ou s’inspecter comme un salaire que l’on croit avoir mérité. La posture que tu choisis devient ta manière de traiter tous les autres.

Maintenant que tu sais ce qu’est la honte, vas-tu tenir le compte des fautes de quelqu’un d’autre ?
Maintenant que tu sais ce qu’est une miséricorde non méritée, vas-tu faire auditionner les gens pour ta bonté ?
Maintenant que tu sais ce qu’est d’être sauvé, vas-tu devenir le portier dont tu avais besoin d’être délivré ?

Une grâce qui s’arrête à toi n’est que de l’ego avec un vocabulaire d’église.

💎 La sagesse du jour...
La guérison reçoit le don. La maturité devient généreuse du même don.

Que la honte t’apprenne à couvrir les autres, non à les exposer.
Que la miséricorde t’apprenne à poser le presse-papiers.
Que ton passé t’apprenne à être patient avec une croissance lente.
Que la gratitude t’apprenne à parler doucement à ceux qui sont encore en chemin.

L’amertume, c’est ce qui arrive quand on oublie d’être arrivé par un don et qu’on se met à faire payer l’entrée.

🙏🏾 Prière
Père, je n’ai mérité ni l’air que je respire, ni la croix. Protège mon caractère pour que la grâce ne devienne pas un classement. Empêche-moi d’humilier ceux que Tu es encore en train de sauver. Fais de moi une porte, non un poste de contrôle. Merci pour le don. Aide-moi à le donner avec des mains propres. Au nom de Jésus, amen.`,
  },
  {
    theme: 'love',
    refEn: '1 Corinthians 13:4-5',
    refHt: '1 Corinthiens 13:4-5',
    textEn:
      'Love is patient and kind. Love is not jealous or boastful or proud or rude. It does not demand its own way. It is not irritable, and it keeps no record of being wronged.',
    textHt:
      'L’amour est patient, il est plein de bonté ; l’amour n’est point envieux ; l’amour ne se vante point, il ne s’enfle point d’orgueil, il ne fait rien de malhonnête, il ne cherche point son intérêt, il ne s’irrite point, il ne soupçonne point le mal.',
    lessonEn: `Good morning @everyone 🙏🏾

"Love Is What You Do After You Have Been Hurt"

📖 1 Corinthians 13:4-5 (NLT)
"Love is patient and kind. Love is not jealous or boastful or proud or rude. It does not demand its own way. It is not irritable, and it keeps no record of being wronged."

Paul was writing to a gifted church that had become a loud church. They had spiritual fireworks and relational shrapnel. This is not wedding décor. It is a character inspection: after the insult, after the slight, after the disappointment — who do you become?

🔥 Fire can cook a meal or burn the kitchen down. The same heat. Different stewardship.

Now that you know what impatience feels like, will you become the person who never gives anyone time?
Now that you know what a scorecard feels like, will you keep one with prettier handwriting?
Now that you know what unkindness feels like, will you call your sharpness "just being honest"?

Love that only works when you are unoffended is not love. It is comfort.

💎 Today's Wisdom...
Healing remembers the wound. Maturity refuses to turn the wound into a weapon.

Let irritation teach you how to pause before you speak.
Let jealousy teach you how to celebrate.
Let pride teach you how to go low.
Let old records teach you how to forgive on purpose.

Bitterness is just a ledger you keep rereading until it starts writing you.

🙏🏾 Prayer
Father, I have receipts I like to keep. Teach me a love that is patient when I am tired and kind when I am right. Protect my character from becoming rude in the name of truth. Cancel the record I keep of other people's failures, as You have canceled mine. Make me safe to be in a room with. In Jesus' name, amen.`,
    lessonHt: `Bonjour à tous 🙏🏾

« L’amour, c’est ce que tu fais après avoir été blessé »

📖 1 Corinthiens 13:4-5
« L’amour est patient, il est plein de bonté ; l’amour n’est point envieux ; l’amour ne se vante point, il ne s’enfle point d’orgueil... il ne s’irrite point, il ne soupçonne point le mal. »

Paul écrivait à une église douée devenue une église bruyante. Ils avaient des feux d’artifice spirituels et des éclats relationnels. Ce n’est pas de la décoration de mariage. C’est une inspection du caractère : après l’affront, après le mépris, après la déception — qui deviens-tu ?

🔥 Le feu peut cuire un repas ou brûler la cuisine. Même chaleur. Autre intendance.

Maintenant que tu sais ce qu’est l’impatience, vas-tu devenir celui qui ne donne plus de temps à personne ?
Maintenant que tu sais ce qu’est un tableau de scores, vas-tu en tenir un avec une plus belle écriture ?
Maintenant que tu sais ce qu’est la dureté, vas-tu appeler ton tranchant « de la franchise » ?

Un amour qui ne fonctionne que lorsque tu n’es pas offensé n’est pas de l’amour. C’est du confort.

💎 La sagesse du jour...
La guérison se souvient de la blessure. La maturité refuse d’en faire une arme.

Que l’irritation t’apprenne à marquer une pause avant de parler.
Que la jalousie t’apprenne à célébrer.
Que l’orgueil t’apprenne à t’abaisser.
Que les vieux dossiers t’apprennent à pardonner exprès.

L’amertume, c’est un registre que l’on relit jusqu’à ce qu’il se mette à t’écrire.

🙏🏾 Prière
Père, j’ai des reçus que j’aime garder. Enseigne-moi un amour patient quand je suis fatigué, et bon quand j’ai raison. Protège mon caractère pour qu’il ne devienne pas rude au nom de la vérité. Efface le registre que je tiens des échecs des autres, comme Tu as effacé le mien. Rends-moi quelqu’un de sûr dans une pièce. Au nom de Jésus, amen.`,
  },
  {
    theme: 'hope',
    refEn: 'Jeremiah 29:11',
    refHt: 'Jérémie 29:11',
    textEn:
      '"For I know the plans I have for you," says the Lord. "They are plans for good and not for disaster, to give you a future and a hope."',
    textHt:
      'Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l’espérance.',
    lessonEn: `Scripture: Jeremiah 29:11 (NLT)
“‘For I know the plans I have for you,’ says the Lord. ‘They are plans for good and not for disaster, to give you a future and a hope.’”

We often quote this verse at graduations and fresh starts—but God spoke these words to people living in Babylonian exile.

They were trapped in a season they didn't choose, waiting for a breakthrough that was still years away.

Yet God reminded them: An unexpected detour in your life is not a cancellation of His promise.

That’s faith.

🌱 A seed buried in the dirt feels like it's trapped in a grave, but in reality, it's just being positioned to grow. What feels like an ending is often God's quiet preparation.

Uncertainty will always offer you a choice:

“Now that you can't see the full path, will you panic or will you trust?”

“Now that your timeline fell apart, will you give up or lean in?”

“Now that God feels silent, will you assume He has forgotten you?”

God essentially says, “Your current location does not limit My ultimate destination for you.”

💎 Today’s Wisdom...
Hope isn’t pretending the waiting season is easy. It’s trusting that God is working while you wait.

Let delay teach you patience.
Let confusion teach you surrender.
Let unanswered questions teach you deeper trust.
Let the waiting room teach you how to prepare for the promise.

You don't have to figure out the next ten years to trust God with today.

Sometimes the greatest evidence of spiritual maturity is this:
You have every reason to be anxious about the future—and somehow, you are completely at peace.

🙏🏾 Prayer
Father, quiet my anxious heart when life doesn’t match my timeline. Forgive me for confusing a delay with Your absence. Remind me that You are already in my tomorrow, working all things together for my good. Teach me to thrive right where I am while holding onto the hope You’ve placed ahead of me. In Jesus’ name, amen. ❤️`,
    lessonHt: `Écriture : Jérémie 29:11
« Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l’espérance. »

On cite souvent ce verset aux remises de diplômes et aux nouveaux départs — mais Dieu a dit ces paroles à un peuple en exil à Babylone.

Ils étaient coincés dans une saison qu’ils n’avaient pas choisie, en attendant une percée qui était encore à des années de là.

Pourtant Dieu leur a rappelé : un détour imprévu dans ta vie n’est pas l’annulation de Sa promesse.

Voilà la foi.

🌱 Une graine enterrée dans la terre a l’impression d’être coincée dans une tombe, mais en réalité, elle est seulement placée pour grandir. Ce qui ressemble à une fin est souvent la préparation silencieuse de Dieu.

L’incertitude t’offre toujours un choix :

« Maintenant que tu ne vois pas tout le chemin, vas-tu paniquer ou vas-tu faire confiance ? »

« Maintenant que ton calendrier s’est effondré, vas-tu abandonner ou t’appuyer davantage ? »

« Maintenant que Dieu semble silencieux, vas-tu croire qu’Il t’a oublié ? »

Dieu dit essentiellement : « Ton lieu actuel ne limite pas la destination que J’ai pour toi. »

💎 La sagesse du jour...
L’espérance, ce n’est pas faire semblant que l’attente est facile. C’est croire que Dieu travaille pendant que tu attends.

Que le délai t’apprenne la patience.
Que la confusion t’apprenne l’abandon.
Que les questions sans réponse t’apprennent une confiance plus profonde.
Que la salle d’attente t’apprenne à te préparer pour la promesse.

Tu n’as pas besoin de résoudre les dix prochaines années pour faire confiance à Dieu pour aujourd’hui.

Parfois, la plus grande preuve de maturité spirituelle est celle-ci :
Tu as toutes les raisons d’être inquiet pour l’avenir — et pourtant, tu es complètement en paix.

🙏🏾 Prière
Père, apaise mon cœur inquiet quand la vie ne correspond pas à mon calendrier. Pardonne-moi d’avoir confondu un délai avec Ton absence. Rappelle-moi que Tu es déjà dans mon demain, et que Tu fais concourir toutes choses à mon bien. Apprends-moi à m’épanouir là où je suis, tout en tenant l’espérance que Tu as placée devant moi. Au nom de Jésus, amen. ❤️`,
  },
];

export function normalizeVerseRef(ref: string): string {
  return (ref || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, ':')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isGroupChatDevotionalFormat(lesson: string | null | undefined): boolean {
  const text = lesson || '';
  return (
    text.includes('💎') ||
    /today['’]s wisdom/i.test(text) ||
    /sagesse du jour/i.test(text)
  );
}

export function findDevotionalPresetByRef(ref: string | null | undefined): DevotionalPreset | undefined {
  const needle = normalizeVerseRef(ref || '');
  if (!needle) return undefined;
  return DEVOTIONAL_PRESETS.find(
    (preset) =>
      normalizeVerseRef(preset.refEn) === needle || normalizeVerseRef(preset.refHt) === needle
  );
}

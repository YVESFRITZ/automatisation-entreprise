// ── Générateur de contenu pour les réseaux sociaux (hors-ligne, FR) ──

export type Objectif = 'promo' | 'nouveaute' | 'engagement' | 'evenement' | 'horaires' | 'temoignage'

export const OBJECTIFS: { value: Objectif; label: string }[] = [
  { value: 'promo', label: 'Promotion / offre' },
  { value: 'nouveaute', label: 'Nouveauté' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'evenement', label: 'Événement' },
  { value: 'horaires', label: 'Infos pratiques' },
  { value: 'temoignage', label: 'Avis client' },
]

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

/** Modèles rapides (remplissent directement le compositeur). */
export interface QuickTemplate {
  id: string
  title: string
  objectif: Objectif
}
export const QUICK_TEMPLATES: QuickTemplate[] = [
  { id: 'q1', title: 'Offre du moment', objectif: 'promo' },
  { id: 'q2', title: 'Nouveau produit', objectif: 'nouveaute' },
  { id: 'q3', title: 'Poser une question', objectif: 'engagement' },
  { id: 'q4', title: 'Annonce d’événement', objectif: 'evenement' },
  { id: 'q5', title: 'Horaires / adresse', objectif: 'horaires' },
  { id: 'q6', title: 'Remercier nos clients', objectif: 'temoignage' },
]

const CTA = [
  'Passez nous voir.',
  'Écrivez-nous en message privé.',
  'Contactez-nous dès aujourd’hui.',
  'Réservez vite, les places sont limitées.',
  'Plus d’infos via le lien en bio.',
  'Appelez-nous pour en savoir plus.',
]

/** Génère une légende à partir d'un objectif et d'un sujet libre. */
export function generateCaption(objectif: Objectif, sujet: string, entreprise: string): string {
  const s = sujet.trim() || 'notre offre'
  const e = entreprise || 'notre équipe'
  const cta = pick(CTA)

  const bank: Record<Objectif, string[]> = {
    promo: [
      `Offre spéciale sur ${s} cette semaine chez ${e}. Profitez-en avant qu’il ne soit trop tard. ${cta}`,
      `-20% sur ${s} pendant quelques jours seulement. ${cta}`,
      `${s} est en promotion chez ${e}. Une occasion à ne pas manquer. ${cta}`,
    ],
    nouveaute: [
      `Nouveauté : découvrez ${s}, désormais disponible chez ${e}. On a hâte d’avoir votre avis. ${cta}`,
      `${s} vient d’arriver. Venez le découvrir chez ${e}. ${cta}`,
      `Nous vous présentons ${s}, un vrai coup de cœur de l’équipe ${e}. ${cta}`,
    ],
    engagement: [
      `Une question pour vous : que pensez-vous de ${s} ? Dites-nous tout en commentaire.`,
      `Vous préférez quoi ? Racontez-nous en commentaire ce que vous aimez à propos de ${s}.`,
      `Votre avis nous intéresse : ${s}, plutôt oui ou plutôt non ? Réagissez ci-dessous.`,
    ],
    evenement: [
      `Notez la date : ${e} organise un événement autour de ${s}. On vous attend nombreux. ${cta}`,
      `Rendez-vous bientôt pour ${s} chez ${e}. Réservez la date. ${cta}`,
      `Grand événement en préparation autour de ${s}. Restez connectés. ${cta}`,
    ],
    horaires: [
      `${e} vous accueille. ${s}. À très vite.`,
      `Infos pratiques : ${s}. Un renseignement ? ${cta}`,
      `${e} vous ouvre ses portes. ${s}. Passez quand vous voulez.`,
    ],
    temoignage: [
      `Merci pour votre confiance. Chez ${e}, votre satisfaction sur ${s} est notre priorité.`,
      `Un grand merci à nos clients. Vos retours sur ${s} nous motivent chaque jour. ${cta}`,
      `« ${s} » : ils l’ont adopté, et vous ? Merci de faire confiance à ${e}.`,
    ],
  }
  return pick(bank[objectif])
}

const HASH_COMMON = ['#entreprise', '#cameroun', '#business', '#local']
const HASH_BY_OBJECTIF: Record<Objectif, string[]> = {
  promo: ['#promo', '#offre', '#bonplan', '#reduction', '#soldes'],
  nouveaute: ['#nouveaute', '#new', '#nouveau', '#tendance'],
  engagement: ['#communaute', '#avis', '#question'],
  evenement: ['#evenement', '#event', '#agenda', '#rdv'],
  horaires: ['#adresse', '#horaires', '#ouvert', '#pratique'],
  temoignage: ['#merci', '#client', '#satisfaction', '#confiance'],
}

/** Génère un jeu de hashtags pertinents. */
export function generateHashtags(objectif: Objectif, sujet: string): string {
  const fromSujet = sujet
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 2)
    .map((w) => '#' + w.replace(/[^a-zà-ÿ0-9]/gi, ''))
    .filter((h) => h.length > 2)
  const set = new Set<string>([...HASH_BY_OBJECTIF[objectif].slice(0, 3), ...fromSujet, ...HASH_COMMON.slice(0, 2)])
  return Array.from(set).join(' ')
}

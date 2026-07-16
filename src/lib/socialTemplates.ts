// ── Générateur de contenu pour les réseaux sociaux (hors-ligne, FR) ──

export type Objectif = 'promo' | 'nouveaute' | 'engagement' | 'evenement' | 'horaires' | 'temoignage'

export const OBJECTIFS: { value: Objectif; label: string; emoji: string }[] = [
  { value: 'promo', label: 'Promotion / offre', emoji: '🔥' },
  { value: 'nouveaute', label: 'Nouveauté', emoji: '✨' },
  { value: 'engagement', label: 'Engagement', emoji: '💬' },
  { value: 'evenement', label: 'Événement', emoji: '📅' },
  { value: 'horaires', label: 'Infos pratiques', emoji: '📍' },
  { value: 'temoignage', label: 'Avis client', emoji: '⭐' },
]

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

/** Modèles rapides (remplissent directement le compositeur). */
export interface QuickTemplate {
  id: string
  title: string
  emoji: string
  objectif: Objectif
}
export const QUICK_TEMPLATES: QuickTemplate[] = [
  { id: 'q1', title: 'Offre du moment', emoji: '🔥', objectif: 'promo' },
  { id: 'q2', title: 'Nouveau produit', emoji: '✨', objectif: 'nouveaute' },
  { id: 'q3', title: 'Poser une question', emoji: '💬', objectif: 'engagement' },
  { id: 'q4', title: 'Annonce d’événement', emoji: '📅', objectif: 'evenement' },
  { id: 'q5', title: 'Horaires / adresse', emoji: '📍', objectif: 'horaires' },
  { id: 'q6', title: 'Merci à nos clients', emoji: '⭐', objectif: 'temoignage' },
]

const CTA = [
  'Passez nous voir 👉',
  'Écrivez-nous en message privé 📩',
  'Contactez-nous dès aujourd’hui !',
  'Réservez vite, les places sont limitées ⏳',
  'Cliquez sur le lien en bio 🔗',
  'Appelez-nous pour en savoir plus ☎️',
]

/** Génère une légende à partir d'un objectif et d'un sujet libre. */
export function generateCaption(objectif: Objectif, sujet: string, entreprise: string): string {
  const s = sujet.trim() || 'notre offre'
  const e = entreprise || 'notre équipe'
  const cta = pick(CTA)

  const bank: Record<Objectif, string[]> = {
    promo: [
      `🔥 OFFRE SPÉCIALE sur ${s} !\nProfitez-en chez ${e} avant la fin de la semaine. ${cta}`,
      `💥 -20% cette semaine sur ${s} ! C’est le moment ou jamais. ${cta}`,
      `Bonne nouvelle 🎉 ${s} est en promotion chez ${e}. Ne ratez pas ça ! ${cta}`,
    ],
    nouveaute: [
      `✨ NOUVEAUTÉ ✨\nDécouvrez ${s}, tout juste arrivé chez ${e}. On a hâte d’avoir votre avis ! ${cta}`,
      `Ça y est, ${s} est disponible ! 🙌 Venez le découvrir chez ${e}. ${cta}`,
      `On vous présente ${s} 👀 Un vrai coup de cœur de l’équipe ${e}. ${cta}`,
    ],
    engagement: [
      `💬 Petite question pour vous : que pensez-vous de ${s} ?\nDites-nous tout en commentaire 👇`,
      `Vous préférez quoi ? 🤔 Racontez-nous en commentaire ce que vous aimez à propos de ${s} !`,
      `On veut votre avis 🙏 ${s} : oui ou non ? Réagissez ci-dessous 👇`,
    ],
    evenement: [
      `📅 SAVE THE DATE !\n${e} organise un événement autour de ${s}. On vous attend nombreux 🎉 ${cta}`,
      `🎊 Rendez-vous bientôt pour ${s} chez ${e} ! Notez la date, ça va être top. ${cta}`,
      `Grand événement en préparation : ${s} ! Restez connectés 📲 ${cta}`,
    ],
    horaires: [
      `📍 On vous accueille chez ${e} !\n${s}\nÀ très vite 😊`,
      `Infos pratiques 🕐\n${s}\nBesoin d’un renseignement ? ${cta}`,
      `${e} vous ouvre ses portes 🚪\n${s}\nPassez quand vous voulez !`,
    ],
    temoignage: [
      `⭐⭐⭐⭐⭐ Merci pour votre confiance !\nChez ${e}, votre satisfaction sur ${s} est notre priorité. 🙏`,
      `Un grand merci à nos clients 💛 Vos retours sur ${s} nous motivent chaque jour. ${cta}`,
      `« ${s} » — Ils l’ont adoré, et vous ? 😍 Merci de faire confiance à ${e}.`,
    ],
  }
  return pick(bank[objectif])
}

const HASH_COMMON = ['#entreprise', '#cameroun', '#business', '#local']
const HASH_BY_OBJECTIF: Record<Objectif, string[]> = {
  promo: ['#promo', '#offre', '#bonplan', '#reduction', '#soldes'],
  nouveaute: ['#nouveaute', '#new', '#nouveau', '#tendance'],
  engagement: ['#communaute', '#avis', '#question', '#vousetesnombreux'],
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

// ── Types métier de l'application ───────────────────────────────────

export type TxType = 'entree' | 'sortie'

export interface Transaction {
  id: string
  type: TxType
  amount: number // en unité de devise (ex: FCFA)
  category: string
  label: string
  method: 'especes' | 'mobile' | 'virement' | 'autre'
  date: string // ISO (jour de l'opération)
  createdAt: string
}

export type ProspectStatus = 'nouveau' | 'contacte' | 'relance' | 'client' | 'perdu'
export type Channel = 'whatsapp' | 'sms' | 'email'

export interface Prospect {
  id: string
  name: string
  phone: string // format international sans + ni espaces de préférence, ex: 2376xxxxxxx
  email: string
  channel: Channel
  status: ProspectStatus
  note: string
  lastContact: string | null // ISO
  createdAt: string
}

export type Platform = 'facebook' | 'instagram' | 'tiktok'
export type PostStatus = 'brouillon' | 'programme' | 'publie' | 'echec'

export interface Post {
  id: string
  platforms: Platform[]
  content: string
  mediaUrl: string // lien vers une image/vidéo (optionnel)
  scheduledAt: string | null // ISO — null = brouillon non planifié
  status: PostStatus
  error?: string
  createdAt: string
}

export interface Settings {
  businessName: string
  currency: string // ex: 'FCFA'
  currencyLocale: string // ex: 'fr-CM'
  senderName: string // signature dans les messages prospects
}

export interface AppData {
  transactions: Transaction[]
  prospects: Prospect[]
  posts: Post[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  businessName: 'Mon Entreprise',
  currency: 'FCFA',
  currencyLocale: 'fr-CM',
  senderName: '',
}

export const TX_CATEGORIES = [
  'Vente',
  'Service',
  'Achat marchandise',
  'Salaire',
  'Loyer',
  'Transport',
  'Fournitures',
  'Marketing',
  'Divers',
]

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  relance: 'À relancer',
  client: 'Client',
  perdu: 'Perdu',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  brouillon: 'Brouillon',
  programme: 'Programmé',
  publie: 'Publié',
  echec: 'Échec',
}

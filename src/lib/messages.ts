import type { Prospect, Settings } from './types'

export interface Template {
  id: string
  title: string
  body: string
}

/** Modèles de messages de prospection (personnalisables). Variables : {nom} {entreprise} {moi} */
export const TEMPLATES: Template[] = [
  {
    id: 'intro',
    title: 'Premier contact',
    body:
      "Bonjour {nom}, je suis {moi} de {entreprise}. Je me permets de vous contacter car je pense que nos services peuvent vous être utiles. Auriez-vous quelques minutes pour en discuter ?",
  },
  {
    id: 'offre',
    title: 'Offre du moment',
    body:
      "Bonjour {nom}, chez {entreprise} nous avons une offre spéciale en ce moment. Je serais ravi de vous présenter les détails. Quand seriez-vous disponible ?",
  },
  {
    id: 'relance',
    title: 'Relance',
    body:
      "Bonjour {nom}, je reviens vers vous suite à mon dernier message. Avez-vous eu le temps d'y réfléchir ? Je reste à votre disposition. — {moi}, {entreprise}",
  },
  {
    id: 'rdv',
    title: 'Proposer un rendez-vous',
    body:
      "Bonjour {nom}, seriez-vous disponible cette semaine pour un court échange (10-15 min) ? Je m'adapte à votre emploi du temps. Merci ! — {moi} ({entreprise})",
  },
  {
    id: 'merci',
    title: 'Remerciement client',
    body:
      "Bonjour {nom}, merci pour votre confiance. N'hésitez pas si vous avez la moindre question, {entreprise} reste à votre écoute.",
  },
]

export function fillTemplate(body: string, p: Prospect, s: Settings): string {
  const firstName = p.name.trim().split(/\s+/)[0] || ''
  return body
    .replaceAll('{nom}', firstName)
    .replaceAll('{entreprise}', s.businessName || 'notre entreprise')
    .replaceAll('{moi}', s.senderName || '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Nettoie un numéro pour les liens (chiffres uniquement). */
export function cleanPhone(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(text)}`
}

export function smsLink(phone: string, text: string): string {
  return `sms:${cleanPhone(phone)}?body=${encodeURIComponent(text)}`
}

export function emailLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

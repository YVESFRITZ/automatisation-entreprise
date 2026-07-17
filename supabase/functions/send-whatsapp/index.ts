// ════════════════════════════════════════════════════════════════════
//  Edge Function : envoi de messages WhatsApp via la Cloud API de Meta.
//  Body: { to, message }  (texte, fenêtre 24h)
//     ou { to, template, lang?, components? }  (message template approuvé)
//  Auth: JWT utilisateur (identifie le compte -> ses identifiants WhatsApp).
//  Déploiement : supabase functions deploy send-whatsapp
// ════════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'content-type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Identifier l'utilisateur
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: u } = await sb.auth.getUser(jwt)
  const uid = u?.user?.id
  if (!uid) return json({ error: 'Non authentifié' }, 401)

  // Ses identifiants WhatsApp
  const { data: acc } = await sb
    .from('social_accounts')
    .select('whatsapp_phone_id, whatsapp_token')
    .eq('user_id', uid)
    .maybeSingle()
  if (!acc?.whatsapp_phone_id || !acc?.whatsapp_token) {
    return json({ error: 'WhatsApp non connecté (Réglages).' }, 400)
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400)
  }
  const to = String(body.to ?? '').replace(/[^\d]/g, '')
  if (!to) return json({ error: 'Destinataire manquant' }, 400)

  const payload = body.template
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: body.template, language: { code: body.lang ?? 'fr' }, components: body.components ?? [] },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: String(body.message ?? '') },
      }

  const r = await fetch(`https://graph.facebook.com/v21.0/${acc.whatsapp_phone_id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acc.whatsapp_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const res = await r.json()
  if (!r.ok) return json({ error: res.error?.message ?? 'Échec de l’envoi', details: res.error }, 400)
  return json({ ok: true, id: res.messages?.[0]?.id ?? null })
})

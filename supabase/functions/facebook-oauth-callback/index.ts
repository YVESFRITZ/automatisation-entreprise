// ════════════════════════════════════════════════════════════════════
//  Edge Function : retour du « Se connecter avec Facebook » (OAuth).
//  Échange le code contre un jeton de Page permanent et l'enregistre
//  dans social_accounts pour l'utilisateur connecté (identifié via state).
//  Secrets requis : META_APP_ID, META_APP_SECRET, META_REDIRECT_URI, APP_URL
//  Déploiement : supabase functions deploy facebook-oauth-callback --no-verify-jwt
// ════════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const G = 'https://graph.facebook.com/v21.0'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // JWT Supabase de l'utilisateur
  const oauthErr = url.searchParams.get('error')

  const APP_ID = Deno.env.get('META_APP_ID')!
  const APP_SECRET = Deno.env.get('META_APP_SECRET')!
  const REDIRECT = Deno.env.get('META_REDIRECT_URI')!
  const APP_URL = Deno.env.get('APP_URL') ?? 'https://automatisation-entreprise.vercel.app'

  const back = (status: string) => Response.redirect(`${APP_URL}/#/reglages?fb=${status}`, 302)

  if (oauthErr || !code || !state) return back('cancel')

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 1) Identifier l'utilisateur à partir du JWT
  const { data: userData } = await sb.auth.getUser(state)
  const uid = userData?.user?.id
  if (!uid) return back('autherror')

  try {
    // 2) code -> jeton utilisateur court
    const t1 = await fetch(
      `${G}/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&client_secret=${APP_SECRET}&code=${encodeURIComponent(code)}`,
    ).then((r) => r.json())
    if (!t1.access_token) return back('tokenerror')

    // 3) -> jeton utilisateur longue durée
    const t2 = await fetch(
      `${G}/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${t1.access_token}`,
    ).then((r) => r.json())
    const userToken = t2.access_token ?? t1.access_token

    // 4) Pages gérées (jeton de Page = permanent)
    const pages = await fetch(`${G}/me/accounts?fields=id,name,access_token&access_token=${userToken}`).then((r) => r.json())
    if (!pages.data || pages.data.length === 0) return back('nopage')
    const page = pages.data[0]

    // 5) Compte Instagram lié
    const ig = await fetch(`${G}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`).then((r) => r.json())

    // 6) Enregistrer
    await sb.from('social_accounts').upsert({
      user_id: uid,
      meta_page_id: page.id,
      meta_ig_user_id: ig.instagram_business_account?.id ?? null,
      meta_access_token: page.access_token,
      updated_at: new Date().toISOString(),
    })
    return back('ok')
  } catch (_e) {
    return back('error')
  }
})

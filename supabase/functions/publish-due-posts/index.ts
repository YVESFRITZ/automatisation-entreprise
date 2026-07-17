// ════════════════════════════════════════════════════════════════════
//  Edge Function : publie automatiquement les posts arrivés à échéance.
//  Déclenchée périodiquement (voir supabase/README.md → pg_cron).
//  Déploiement : supabase functions deploy publish-due-posts
// ════════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GRAPH = 'https://graph.facebook.com/v21.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role : contourne le RLS
  )

  // Posts programmés dont l'heure est passée
  const nowISO = new Date().toISOString()
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'programme')
    .lte('scheduled_at', nowISO)

  if (error) return json({ error: error.message }, 500)
  if (!posts?.length) return json({ published: 0, message: 'Rien à publier.' })

  let published = 0
  const results: unknown[] = []

  for (const post of posts) {
    const { data: acc } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', post.user_id)
      .maybeSingle()

    try {
      for (const platform of post.platforms as string[]) {
        if (platform === 'facebook') await postFacebook(acc, post)
        else if (platform === 'instagram') await postInstagram(acc, post)
        else if (platform === 'tiktok') await postTikTok(acc, post)
      }
      await supabase.from('posts').update({ status: 'publie', error: null }).eq('id', post.id)
      published++
      results.push({ id: post.id, ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec de publication'
      await supabase.from('posts').update({ status: 'echec', error: msg }).eq('id', post.id)
      results.push({ id: post.id, ok: false, error: msg })
    }
  }

  return json({ published, results })
})

// ── Facebook (Page feed) ────────────────────────────────────────────
async function postFacebook(acc: any, post: any) {
  if (!acc?.meta_page_id || !acc?.meta_access_token) throw new Error('Compte Facebook non connecté')
  const token = acc.meta_access_token
  let url: string
  const body = new URLSearchParams({ access_token: token })
  if (post.media_url) {
    url = `${GRAPH}/${acc.meta_page_id}/photos`
    body.set('url', post.media_url)
    body.set('caption', post.content)
  } else {
    url = `${GRAPH}/${acc.meta_page_id}/feed`
    body.set('message', post.content)
  }
  const r = await fetch(url, { method: 'POST', body })
  if (!r.ok) throw new Error(`Facebook: ${await r.text()}`)
}

// ── Instagram (container -> publish) ────────────────────────────────
async function postInstagram(acc: any, post: any) {
  if (!acc?.meta_ig_user_id || !acc?.meta_access_token) throw new Error('Compte Instagram non connecté')
  if (!post.media_url) throw new Error('Instagram nécessite une image (media_url)')
  const token = acc.meta_access_token
  // 1) créer le conteneur média
  const create = await fetch(`${GRAPH}/${acc.meta_ig_user_id}/media`, {
    method: 'POST',
    body: new URLSearchParams({ image_url: post.media_url, caption: post.content, access_token: token }),
  })
  if (!create.ok) throw new Error(`Instagram (création): ${await create.text()}`)
  const { id: creationId } = await create.json()
  // 2) publier le conteneur
  const publish = await fetch(`${GRAPH}/${acc.meta_ig_user_id}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: creationId, access_token: token }),
  })
  if (!publish.ok) throw new Error(`Instagram (publication): ${await publish.text()}`)
}

// ── TikTok (Content Posting API) ────────────────────────────────────
// Nécessite l'accès validé + un flux d'upload spécifique. Squelette prêt.
async function postTikTok(acc: any, _post: any) {
  if (!acc?.tiktok_access_token) throw new Error('Compte TikTok non connecté')
  throw new Error("TikTok : publication non encore activée (validation de l'API requise).")
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}

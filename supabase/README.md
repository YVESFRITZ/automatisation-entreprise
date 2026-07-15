# Activer le cloud (synchro) et la publication automatique

L'application **fonctionne sans rien de tout ça** (mode local). Suivez ce guide
uniquement quand vous voulez : (1) synchroniser vos appareils, (2) publier
automatiquement sur les réseaux sociaux.

## 1) Créer le projet Supabase (gratuit) — synchro entre appareils

1. Allez sur **https://supabase.com** → *New project* (notez le mot de passe DB).
2. Menu **SQL Editor** → *New query* → collez le contenu de `schema.sql` → **Run**.
3. Menu **Settings → API** → copiez :
   - *Project URL* → `VITE_SUPABASE_URL`
   - *anon public key* → `VITE_SUPABASE_ANON_KEY`
4. À la racine du projet, créez un fichier **`.env`** (copiez `.env.example`) et collez ces 2 valeurs.
5. Relancez `npm run dev`. Un écran de **connexion** apparaît : créez votre compte.
   Utilisez le **même compte** sur vos 2-3 appareils → tout est synchronisé en temps réel.

> Astuce : dans Supabase → **Authentication → Providers → Email**, vous pouvez
> désactiver « Confirm email » pour vous connecter immédiatement pendant les tests.

## 2) Publication automatique Facebook / Instagram

1. **https://developers.facebook.com** → créez une app *Business*.
2. Reliez votre **Page Facebook** + un **compte Instagram Professionnel** (lié à la Page).
3. Générez un **jeton d'accès de Page longue durée** avec les permissions :
   `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`.
4. Récupérez aussi votre `PAGE_ID` et votre `IG_USER_ID`.
5. Enregistrez ces valeurs dans la table `social_accounts` (Table Editor), ligne de votre utilisateur :
   `meta_page_id`, `meta_ig_user_id`, `meta_access_token`.

## 3) Déployer la fonction de publication + la planifier

Installez la CLI Supabase puis :

```bash
supabase login
supabase link --project-ref VOTRE_REF
supabase functions deploy publish-due-posts
```

Planifiez son exécution toutes les 5 minutes (SQL Editor) :

```sql
-- Active les extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Appelle la fonction toutes les 5 minutes
select cron.schedule(
  'publier-posts',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := 'https://VOTRE_REF.functions.supabase.co/publish-due-posts',
    headers:= jsonb_build_object('Authorization', 'Bearer ' || 'VOTRE_SERVICE_ROLE_KEY')
  );
  $$
);
```

Désormais, tout post **programmé** part automatiquement à l'heure prévue.
En cas d'échec, le post passe en statut **Échec** avec le message d'erreur dans l'app.

## 4) TikTok

TikTok exige la validation de la **Content Posting API** (developers.tiktok.com).
Le squelette est prêt dans `functions/publish-due-posts/index.ts` (`postTikTok`) ;
il s'activera une fois l'accès accordé et le flux d'upload finalisé.

## 5) Envoi de messages en masse (WhatsApp)

L'envoi **un par un** (WhatsApp / SMS / e-mail pré-rempli) fonctionne déjà dans l'app.
Pour un envoi **100% automatique en masse**, il faut l'**API WhatsApp Business**
(Meta) ou un fournisseur (Twilio, 360dialog…). Même principe : jeton stocké côté
serveur, envoi via une Edge Function. À activer quand vous aurez un compte validé.

-- ════════════════════════════════════════════════════════════════════
--  Automatisation Entreprise — Schéma de base de données Supabase
--  À exécuter dans : Supabase → SQL Editor → New query → Run
--  Sécurité : RLS activé, chaque utilisateur ne voit que SES données.
-- ════════════════════════════════════════════════════════════════════

-- ── Transactions (caisse) ───────────────────────────────────────────
create table if not exists public.transactions (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('entree','sortie')),
  amount      numeric not null check (amount >= 0),
  category    text not null default 'Divers',
  label       text default '',
  method      text default 'especes',
  date        date not null,
  created_at  timestamptz not null default now()
);

-- ── Prospects (CRM) ─────────────────────────────────────────────────
create table if not exists public.prospects (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  phone         text default '',
  email         text default '',
  channel       text default 'whatsapp',
  status        text default 'nouveau',
  note          text default '',
  last_contact  timestamptz,
  created_at    timestamptz not null default now()
);

-- ── Posts (réseaux sociaux) ─────────────────────────────────────────
create table if not exists public.posts (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  platforms     jsonb not null default '[]',
  content       text not null default '',
  media_url     text default '',
  scheduled_at  timestamptz,
  status        text not null default 'brouillon',
  error         text,
  created_at    timestamptz not null default now()
);

-- ── Réglages (une ligne par utilisateur) ────────────────────────────
create table if not exists public.settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  business_name   text default 'Mon Entreprise',
  currency        text default 'FCFA',
  currency_locale text default 'fr-CM',
  sender_name     text default ''
);

-- ── Connexions réseaux sociaux (jetons, par utilisateur) ────────────
-- Stocke les jetons d'accès. Lisible uniquement côté serveur (service role).
create table if not exists public.social_accounts (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  meta_page_id      text,
  meta_ig_user_id   text,
  meta_access_token text,
  tiktok_access_token text,
  updated_at        timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.transactions   enable row level security;
alter table public.prospects       enable row level security;
alter table public.posts           enable row level security;
alter table public.settings        enable row level security;
alter table public.social_accounts enable row level security;

-- Politique générique : l'utilisateur gère uniquement ses lignes.
do $$
declare t text;
begin
  foreach t in array array['transactions','prospects','posts'] loop
    execute format('drop policy if exists own_all on public.%I;', t);
    execute format(
      'create policy own_all on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id);', t);
  end loop;
end $$;

drop policy if exists own_settings on public.settings;
create policy own_settings on public.settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- social_accounts : l'utilisateur peut écrire ses jetons, mais la lecture
-- massive se fait via le service role (fonction serveur).
drop policy if exists own_social on public.social_accounts;
create policy own_social on public.social_accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Index utiles ────────────────────────────────────────────────────
create index if not exists idx_tx_user_date   on public.transactions (user_id, date desc);
create index if not exists idx_prospects_user  on public.prospects (user_id, created_at desc);
create index if not exists idx_posts_due        on public.posts (status, scheduled_at);

-- ════════════════════════════════════════════════════════════════════
--  Realtime (synchro temps réel entre appareils)
-- ════════════════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.prospects;
alter publication supabase_realtime add table public.posts;

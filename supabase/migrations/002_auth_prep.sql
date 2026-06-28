-- licilibre · migración 002 · preparació autenticació (silenciosa)
-- ─────────────────────────────────────────────────────────────────
-- PROPÒSIT:
-- Afegim la infraestructura de comptes d'usuari SENSE activar-la.
-- El lloc web segueix funcionant 100% sense login.
-- Quan decidim activar el registre, simplement habilitem el middleware
-- i afegim la UI. No cal cap canvi a la BD.
--
-- QUAN ACTIVAR:
-- - Quan tinguem >100 usuaris d'alertes email demanant gestió de comptes
-- - Quan vulguem afegir funcionalitats de seguiment (licitacions guardades)
-- - Quan vulguem oferir API keys personalitzades
-- ─────────────────────────────────────────────────────────────────

-- TAULA: perfils (estén auth.users de Supabase)
-- auth.users ja existeix automàticament a Supabase.
-- Aquí afegim camps específics de licilibre.
create table if not exists perfils (
  id                  uuid references auth.users(id) on delete cascade primary key,
  nom                 text,
  empresa             text,
  sector_principal    text,                           -- CPV/sector d'interès principal
  ccaa_principal      text,                           -- CCAA on opera principalment
  plan                text default 'free',            -- 'free' | 'pro' (per al futur)
  api_key             text unique default gen_random_uuid()::text,
  num_alertes         integer default 0,
  num_cerques_mes     integer default 0,
  darrer_acces        timestamptz,
  creat_a             timestamptz default now()
);

-- RLS: cada usuari accedeix només al seu perfil
alter table perfils enable row level security;
create policy "Perfil propi" on perfils
  for all using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────
-- TAULA: licitacions_guardades
-- Per marcar licitacions com a "m'interessa", "presentada", etc.
-- ─────────────────────────────────────────────────────────────────
create table if not exists licitacions_guardades (
  id            bigint generated always as identity primary key,
  usuari_id     uuid references auth.users(id) on delete cascade,
  licitacio_id  text references licitaciones(id) on delete cascade,
  estat_usuari  text default 'interessant',
  -- 'interessant' | 'en_preparacio' | 'presentada' | 'adjudicada' | 'descartada'
  notes         text,
  creat_a       timestamptz default now(),
  unique(usuari_id, licitacio_id)
);

alter table licitacions_guardades enable row level security;
create policy "Guardades pròpies" on licitacions_guardades
  for all using (auth.uid() = usuari_id);

create index idx_guardades_usuari on licitacions_guardades(usuari_id);

-- ─────────────────────────────────────────────────────────────────
-- TRIGGER: crear perfil automàticament quan es registra un usuari
-- Funciona quan activem Supabase Auth amb email/Google OAuth.
-- ─────────────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfils (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

-- El trigger s'activa quan Supabase crea un nou usuari
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- FUNCIÓ: vincular alertes existents a un compte (futur)
-- Quan un usuari es registri amb el mateix email que ja té alertes,
-- podem vincular les alertes al seu compte automàticament.
-- ─────────────────────────────────────────────────────────────────
create or replace function vincular_alertes_a_compte(p_user_id uuid, p_email text)
returns integer language plpgsql security definer as $$
declare
  n integer;
begin
  update alertes
  set email = email  -- De moment no fem res, placeholder
  where email = p_email and verificat = true;

  get diagnostics n = row_count;
  return n;
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- VISTA: dashboard d'usuari (per quan activem comptes)
-- ─────────────────────────────────────────────────────────────────
create or replace view dashboard_usuari as
select
  p.id,
  p.nom,
  p.empresa,
  p.plan,
  count(distinct lg.licitacio_id) as licitacions_guardades,
  count(distinct a.id) as alertes_actives,
  p.darrer_acces
from perfils p
left join licitacions_guardades lg on lg.usuari_id = p.id
left join alertes a on a.email = (select email from auth.users where id = p.id) and a.activa = true
group by p.id;

-- ─────────────────────────────────────────────────────────────────
-- NOTA per a l'equip:
-- Per activar el registre quan estiguem preparats:
--
-- 1. Habilitar a Supabase Dashboard → Authentication → Providers:
--    - Email/Password: ON
--    - Google OAuth: ON (opcional, però molt millora conversió)
--
-- 2. Afegir a web/middleware.ts:
--    - Desbloquejar les rutes protegides (/dashboard, /api/keys, etc.)
--
-- 3. Afegir components UI:
--    - web/app/auth/login/page.tsx
--    - web/app/auth/register/page.tsx
--    - web/components/UserMenu.tsx
--
-- 4. Actualitzar header per mostrar botó "Inicia sessió"
-- ─────────────────────────────────────────────────────────────────

-- licilibre · migración 001 · esquema principal
-- Ejecutar en Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────
-- EXTENSIONES
-- ─────────────────────────────────────────────────────────────────
create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- ─────────────────────────────────────────────────────────────────
-- TABLA PRINCIPAL: licitaciones
-- ─────────────────────────────────────────────────────────────────
create table if not exists licitaciones (
  -- Identidad
  id                    text primary key,           -- ID único: fuente + id_origen (ej: "place_123456")
  id_origen             text not null,              -- ID en la fuente original
  fuente                text not null,              -- 'place' | 'ted' | 'pscp_cat' | 'rtve' | 'aena' | ...

  -- Contenido
  titulo                text not null,
  objeto                text,                       -- Descripción ampliada del objeto
  organismo             text not null,
  organismo_nif         text,
  tipo_contrato         text,                       -- 'Serveis' | 'Obres' | 'Subministraments' | 'Altres'
  procedimiento         text,                       -- 'Obert' | 'Restringit' | 'Negociat' | ...
  cpv_codes             text[],                     -- Array de códigos CPV
  cpv_descripcions      text[],                     -- Descripciones humanas de CPV

  -- Geografía
  ccaa                  text,                       -- Comunidad autónoma
  provincia             text,
  municipio             text,
  pais                  text default 'ES',

  -- Importes
  pressupost_base       numeric,                    -- Presupuesto base sin IVA
  pressupost_iva        numeric,                    -- Presupuesto con IVA
  valor_estimat         numeric,                    -- Valor estimado del contrato
  moneda                text default 'EUR',

  -- Fechas
  data_publicacio       timestamptz,
  data_obertura         timestamptz,                -- Apertura de ofertas
  data_tancament        timestamptz,                -- Fecha límite de presentación
  data_adjudicacio      timestamptz,
  data_formalitzacio    timestamptz,

  -- Estado
  estat                 text not null default 'publicada',
  -- 'publicada' | 'activa' | 'resolució_provisional' | 'adjudicada' | 'formalitzada' | 'deserta' | 'anulada'

  -- URLs
  url_licitacio         text,                       -- URL perfil contratante
  url_plec              text,                       -- URL pliego de condiciones
  url_anunci            text,                       -- URL anuncio oficial (BOE, DOUE, DOGC...)

  -- Adjudicación (si existe)
  empresa_adjudicataria text,
  import_adjudicat      numeric,
  num_ofertes_rebudes   integer,

  -- Metadatos técnicos
  creat_a               timestamptz default now(),
  actualitzat_a         timestamptz default now(),
  hash_contingut        text,                       -- Hash del XML/JSON original para detectar cambios

  -- Full-text search (castellano + catalán)
  fts                   tsvector generated always as (
    to_tsvector('spanish',
      coalesce(titulo, '') || ' ' ||
      coalesce(organismo, '') || ' ' ||
      coalesce(object, '') || ' ' ||
      coalesce(array_to_string(cpv_descripcions, ' '), '')
    )
  ) stored
);

-- ─────────────────────────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────────────────────────

-- Búsqueda full-text principal
create index idx_licitaciones_fts on licitaciones using gin(fts);

-- Trigramas para búsqueda fuzzy (errores tipográficos, parciales)
create index idx_licitaciones_titulo_trgm on licitaciones using gin(titulo gin_trgm_ops);
create index idx_licitaciones_organisme_trgm on licitaciones using gin(organismo gin_trgm_ops);

-- Filtros frecuentes
create index idx_licitaciones_fuente on licitaciones(fuente);
create index idx_licitaciones_estat on licitaciones(estat);
create index idx_licitaciones_ccaa on licitaciones(ccaa);
create index idx_licitaciones_data_tancament on licitaciones(data_tancament);
create index idx_licitaciones_data_publicacio on licitaciones(data_publicacio desc);
create index idx_licitaciones_pressupost on licitaciones(pressupost_base);
create index idx_licitaciones_cpv on licitaciones using gin(cpv_codes);

-- ─────────────────────────────────────────────────────────────────
-- TABLA: fuentes (registro de fetches)
-- ─────────────────────────────────────────────────────────────────
create table if not exists fetch_log (
  id                    bigint generated always as identity primary key,
  fuente                text not null,
  iniciat_a             timestamptz default now(),
  finalitzat_a          timestamptz,
  estat                 text default 'running',     -- 'running' | 'ok' | 'error'
  licitaciones_noves    integer default 0,
  licitaciones_actualitzades integer default 0,
  licitaciones_total    integer default 0,
  error_missatge        text,
  metadata              jsonb
);

-- ─────────────────────────────────────────────────────────────────
-- TABLA: alertes
-- ─────────────────────────────────────────────────────────────────
create table if not exists alertes (
  id                    uuid default gen_random_uuid() primary key,
  email                 text not null,
  verificat             boolean default false,
  token_verificacio     text unique default gen_random_uuid()::text,
  activa                boolean default true,

  -- Criteris de l'alerta
  paraules_clau         text[],                     -- Keywords en el título/objeto
  cpv_codes             text[],                     -- Códigos CPV específicos
  organismes            text[],                     -- Organismos contratantes
  ccaas                 text[],                     -- CCAA
  fuentes               text[],                     -- Fuentes ('place', 'ted', ...)
  tipus_contracte       text[],                     -- Tipos de contrato
  pressupost_min        numeric,
  pressupost_max        numeric,
  dies_limit_min        integer,                    -- Mínimo días restantes
  dies_limit_max        integer,                    -- Máximo días restantes

  -- Frecuencia
  frequencia            text default 'diaria',      -- 'inmediata' | 'diaria' | 'setmanal'
  hora_enviament        time default '08:00',

  -- Metadatos
  creat_a               timestamptz default now(),
  darrer_enviament      timestamptz,
  num_enviaments        integer default 0,

  constraint email_valid check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

create index idx_alertes_email on alertes(email);
create index idx_alertes_activa on alertes(activa) where activa = true;
create index idx_alertes_token on alertes(token_verificacio);

-- ─────────────────────────────────────────────────────────────────
-- TABLA: alertes_enviades (historial)
-- ─────────────────────────────────────────────────────────────────
create table if not exists alertes_enviades (
  id                    bigint generated always as identity primary key,
  alerta_id             uuid references alertes(id) on delete cascade,
  licitacio_id          text references licitaciones(id) on delete cascade,
  enviat_a              timestamptz default now(),
  unique(alerta_id, licitacio_id)
);

-- ─────────────────────────────────────────────────────────────────
-- FUNCIÓN: buscar licitaciones
-- Uso: select * from buscar_licitaciones('audiovisual', 'cat', null, null, 20, 0)
-- ─────────────────────────────────────────────────────────────────
create or replace function buscar_licitaciones(
  q               text default null,
  ccaa_filter     text default null,
  fuente_filter   text default null,
  estat_filter    text default 'activa',
  limit_n         integer default 20,
  offset_n        integer default 0
)
returns table (
  id                text,
  titulo            text,
  organismo         text,
  ccaa              text,
  fuente            text,
  estat             text,
  pressupost_base   numeric,
  data_publicacio   timestamptz,
  data_tancament    timestamptz,
  dies_restants     integer,
  cpv_codes         text[],
  cpv_descripcions  text[],
  url_licitacio     text,
  rank              real
)
language sql stable
as $$
  select
    l.id, l.titulo, l.organismo, l.ccaa, l.fuente, l.estat,
    l.pressupost_base, l.data_publicacio, l.data_tancament,
    extract(days from l.data_tancament - now())::integer as dies_restants,
    l.cpv_codes, l.cpv_descripcions, l.url_licitacio,
    case
      when q is null then 1.0
      else ts_rank(l.fts, plainto_tsquery('spanish', unaccent(q)))
    end as rank
  from licitaciones l
  where
    (estat_filter is null or l.estat = estat_filter)
    and (ccaa_filter is null or lower(l.ccaa) = lower(ccaa_filter))
    and (fuente_filter is null or l.fuente = fuente_filter)
    and (q is null or l.fts @@ plainto_tsquery('spanish', unaccent(q))
         or l.titulo ilike '%' || q || '%'
         or l.organismo ilike '%' || q || '%')
    and (l.data_tancament is null or l.data_tancament > now() - interval '7 days')
  order by
    case when q is not null then ts_rank(l.fts, plainto_tsquery('spanish', unaccent(q))) end desc nulls last,
    l.data_tancament asc nulls last
  limit limit_n
  offset offset_n;
$$;

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────

-- Licitaciones: lectura pública, escritura solo service_role
alter table licitaciones enable row level security;
create policy "Lectura pública" on licitaciones for select using (true);
create policy "Escritura solo sistema" on licitaciones for all using (auth.role() = 'service_role');

-- Alertas: solo el propio usuario (por email verificado)
alter table alertes enable row level security;
create policy "Inserción pública" on alertes for insert with check (true);
create policy "Lectura propia" on alertes for select using (true);  -- token-gated en la app

-- ─────────────────────────────────────────────────────────────────
-- VISTAS ÚTILES
-- ─────────────────────────────────────────────────────────────────

-- Licitaciones activas con urgencia
create or replace view licitaciones_actives as
select
  *,
  extract(days from data_tancament - now())::integer as dies_restants,
  case
    when extract(days from data_tancament - now()) <= 5  then 'urgent'
    when extract(days from data_tancament - now()) <= 15 then 'aviat'
    else 'ample'
  end as urgencia
from licitaciones
where estat in ('publicada', 'activa')
  and (data_tancament is null or data_tancament > now() - interval '1 day');

-- Estadísticas por fuente
create or replace view estadistiques_fonts as
select
  fuente,
  count(*) as total,
  count(*) filter (where estat in ('publicada', 'activa')) as actives,
  avg(pressupost_base) filter (where pressupost_base > 0) as pressupost_mitja,
  max(data_publicacio) as darrera_publicacio
from licitaciones
group by fuente;

-- ─────────────────────────────────────────────────────────────────
-- TRIGGER: actualitzar updated_at
-- ─────────────────────────────────────────────────────────────────
create or replace function update_actualitzat_a()
returns trigger language plpgsql as $$
begin
  new.actualitzat_a = now();
  return new;
end;
$$;

create trigger trg_licitaciones_updated
  before update on licitaciones
  for each row execute function update_actualitzat_a();

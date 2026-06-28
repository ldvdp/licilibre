// licilibre · web/lib/types.ts

export type Fuente = 'place' | 'ted' | 'pscp_cat' | 'rtve' | 'aena' | 'sepe' | 'red_es';

export type TipusContracte = 'Serveis' | 'Obres' | 'Subministraments' | 'Altres';

export type Urgencia = 'urgent' | 'aviat' | 'ample' | 'caducada';

export type Estat =
  | 'publicada'
  | 'activa'
  | 'resolucio_provisional'
  | 'adjudicada'
  | 'formalitzada'
  | 'deserta'
  | 'anulada';

export interface Licitacio {
  id: string;
  id_origen: string;
  fuente: Fuente;

  titulo: string;
  organismo: string;
  organismo_nif: string | null;
  tipus_contracte: TipusContracte | null;
  procediment: string | null;

  cpv_codes: string[];
  cpv_descripcions: string[];

  ccaa: string | null;
  provincia: string | null;
  municipio: string | null;
  pais: string;

  pressupost_base: number | null;
  pressupost_iva: number | null;
  valor_estimat: number | null;
  moneda: string;

  data_publicacio: string | null;
  data_tancament: string | null;
  data_adjudicacio: string | null;

  estat: Estat;

  url_licitacio: string | null;
  url_plec: string | null;
  url_anunci: string | null;

  empresa_adjudicataria: string | null;
  import_adjudicat: number | null;

  creat_a: string;
  actualitzat_a: string;

  // Camps computats (de la vista licitaciones_actives)
  dies_restants?: number;
  urgencia?: Urgencia;
  rank?: number;
}

export interface FiltresRecerca {
  q?: string;
  ccaa?: string;
  fuente?: Fuente | 'totes';
  tipus?: TipusContracte | 'tots';
  urgencia?: 'urgent' | 'aviat' | 'ample' | 'totes';
  pressupost_min?: number;
  pressupost_max?: number;
  cpv?: string;
  order?: 'dies' | 'pressupost' | 'recent';
  limit?: number;
  offset?: number;
}

export interface ResultatRecerca {
  licitacions: Licitacio[];
  total: number;
  pagina: number;
  per_pagina: number;
}

export interface Alerta {
  id: string;
  email: string;
  paraules_clau?: string[];
  cpv_codes?: string[];
  organismes?: string[];
  ccaas?: string[];
  fuentes?: Fuente[];
  tipus_contracte?: TipusContracte[];
  pressupost_min?: number;
  pressupost_max?: number;
  frequencia: 'diaria' | 'setmanal';
  activa: boolean;
  creat_a: string;
}

export interface EstadistiquesFuente {
  fuente: Fuente;
  total: number;
  actives: number;
  pressupost_mitja: number;
  darrera_publicacio: string;
}

export const CCAAS = [
  'Andalucía', 'Aragón', 'Principado de Asturias', 'Illes Balears',
  'Canarias', 'Cantabria', 'Castilla-La Mancha', 'Castilla y León',
  'Catalunya', 'Comunitat Valenciana', 'Extremadura', 'Galicia',
  'Comunidad de Madrid', 'Región de Murcia', 'Comunidad Foral de Navarra',
  'País Vasco', 'La Rioja', 'Ciudad de Ceuta', 'Ciudad de Melilla',
] as const;

export const FONTS: { key: Fuente; label: string; color: string }[] = [
  { key: 'place',    label: 'PLACE (Hacienda)',  color: 'success' },
  { key: 'ted',      label: 'TED (UE)',           color: 'accent'  },
  { key: 'pscp_cat', label: 'PSCP Catalunya',     color: 'success' },
  { key: 'rtve',     label: 'RTVE',               color: 'warning' },
  { key: 'aena',     label: 'AENA',               color: 'pro'     },
  { key: 'sepe',     label: 'SEPE',               color: 'warning' },
];

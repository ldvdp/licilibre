// licilibre · web/lib/supabase.ts

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { FiltresRecerca, Licitacio, ResultatRecerca } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─────────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────────

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Per a Server Components de Next.js
export function createServerSupabaseClient(cookieStore: any) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookies: any) => cookies.forEach(({ name, value, options }: any) =>
        cookieStore.set(name, value, options)
      ),
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// FUNCIONS DE DADES
// ─────────────────────────────────────────────────────────────────

export async function cercarLicitacions(
  filtres: FiltresRecerca
): Promise<ResultatRecerca> {
  const supabase = createClient();
  const { q, ccaa, fuente, tipus, urgencia, pressupost_min, pressupost_max, order, limit = 20, offset = 0 } = filtres;

  let query = supabase
    .from('licitaciones_actives')
    .select('*', { count: 'exact' });

  // Filtre de text (full-text search)
  if (q && q.trim()) {
    query = query.textSearch('fts', q.trim(), {
      type: 'websearch',
      config: 'spanish',
    });
  }

  // Filtres estructurats
  if (ccaa && ccaa !== 'totes') {
    query = query.ilike('ccaa', `%${ccaa}%`);
  }
  if (fuente && fuente !== 'totes') {
    query = query.eq('fuente', fuente);
  }
  if (tipus && tipus !== 'tots') {
    query = query.eq('tipus_contracte', tipus);
  }
  if (urgencia && urgencia !== 'totes') {
    query = query.eq('urgencia', urgencia);
  }
  if (pressupost_min) {
    query = query.gte('pressupost_base', pressupost_min);
  }
  if (pressupost_max) {
    query = query.lte('pressupost_base', pressupost_max);
  }

  // Ordenació
  switch (order) {
    case 'pressupost':
      query = query.order('pressupost_base', { ascending: false, nullsFirst: false });
      break;
    case 'recent':
      query = query.order('data_publicacio', { ascending: false });
      break;
    default: // 'dies' - tanca aviat primer
      query = query.order('dies_restants', { ascending: true, nullsFirst: false });
  }

  // Paginació
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    licitacions: (data || []) as Licitacio[],
    total: count || 0,
    pagina: Math.floor(offset / limit) + 1,
    per_pagina: limit,
  };
}

export async function getLicitacio(id: string): Promise<Licitacio | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('licitaciones')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Licitacio;
}

export async function getEstadistiques() {
  const supabase = createClient();
  const { data } = await supabase
    .from('estadistiques_fonts')
    .select('*');
  return data || [];
}

export async function createAlerta(alerta: {
  email: string;
  paraules_clau?: string[];
  cpv_codes?: string[];
  ccaas?: string[];
  organismes?: string[];
  fuentes?: string[];
  pressupost_min?: number;
  pressupost_max?: number;
  frequencia?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alertes')
    .insert({
      ...alerta,
      frequencia: alerta.frequencia || 'diaria',
    })
    .select('id, token_verificacio')
    .single();

  if (error) throw error;
  return data;
}

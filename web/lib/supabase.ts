import { createClient } from '@supabase/supabase-js';
import type { FiltresRecerca, Licitacio, ResultatRecerca } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function cercarLicitacions(filtres: FiltresRecerca): Promise<ResultatRecerca> {
  const { q, ccaa, fuente, urgencia, order = 'dies', limit = 20, offset = 0 } = filtres;
  let query = supabase.from('licitaciones_actives').select('*', { count: 'exact' });
  if (q?.trim()) query = query.or(	itulo.ilike.%%,organismo.ilike.%%);
  if (ccaa) query = query.ilike('ccaa', %%);
  if (fuente) query = query.eq('fuente', fuente);
  if (urgencia) query = query.eq('urgencia', urgencia);
  if (order === 'pressupost') query = query.order('pressupost_base', { ascending: false, nullsFirst: false });
  else if (order === 'recent') query = query.order('data_publicacio', { ascending: false });
  else query = query.order('dies_restants', { ascending: true, nullsFirst: false });
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { licitacions: (data || []) as Licitacio[], total: count || 0, pagina: Math.floor(offset / limit) + 1, per_pagina: limit };
}

export async function getLicitacio(id: string): Promise<Licitacio | null> {
  const { data, error } = await supabase.from('licitaciones').select('*').eq('id', id).single();
  if (error) return null;
  return data as Licitacio;
}

export async function createAlerta(alerta: { email: string; paraules_clau?: string[]; ccaas?: string[]; frequencia?: string }) {
  const { data, error } = await supabase.from('alertes').insert({ ...alerta, frequencia: alerta.frequencia || 'diaria' }).select('id').single();
  if (error) throw error;
  return data;
}

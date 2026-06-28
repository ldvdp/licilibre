/**
 * licilibre · scripts/fetch-ted.js
 *
 * Fetcher para TED (Tenders Electronic Daily) - Comisión Europea
 * API: https://api.ted.europa.eu/v3
 * Sin autenticación para búsquedas básicas.
 *
 * Uso:
 *   node fetch-ted.js                     # España, últimas 24h
 *   node fetch-ted.js --country=ES,FR,PT  # Múltiples países
 *   node fetch-ted.js --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { normalize } from './normalize.js';

const TED_API_BASE = 'https://api.ted.europa.eu/v3';
const PAGE_SIZE    = 100;
const MAX_PAGES    = 20;

const isDryRun  = process.argv.includes('--dry-run');
const countries = (process.argv.find(a => a.startsWith('--country='))
  ?.split('=')?.[1] ?? 'ES').split(',');

const supabase = isDryRun ? null : createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─────────────────────────────────────────────────────────────────
async function fetchTED() {
  console.log(`[TED] Iniciando fetch · países: ${countries.join(', ')} ${isDryRun ? '(DRY RUN)' : ''}`);

  let fetchLogId = null;
  if (!isDryRun) {
    const { data } = await supabase
      .from('fetch_log')
      .insert({ fuente: 'ted', estat: 'running' })
      .select('id').single();
    fetchLogId = data?.id;
  }

  let totalNoves = 0;
  let totalProcesades = 0;
  const startTime = Date.now();

  try {
    for (const country of countries) {
      console.log(`[TED] → País: ${country}`);

      // Fem servir la data de ahir per agafar totes les publicades en 24h
      const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString().split('T')[0];

      let page = 0;
      let hasMore = true;

      while (hasMore && page < MAX_PAGES) {
        const url = buildSearchUrl(country, since, page);
        console.log(`[TED]   Pàgina ${page + 1}: ${url}`);

        const data = await fetchJSON(url);
        const notices = data?.notices ?? [];

        if (notices.length === 0) {
          hasMore = false;
          break;
        }

        for (const notice of notices) {
          totalProcesades++;
          try {
            const normalitzada = normalize(notice, 'ted');

            if (isDryRun) {
              console.log(`  [dry] ${normalitzada.id} · ${normalitzada.titulo?.substring(0, 60)}`);
              continue;
            }

            const { error } = await supabase
              .from('licitaciones')
              .upsert(normalitzada, { onConflict: 'id' });

            if (error) console.error(`  [err] ${normalitzada.id}:`, error.message);
            else totalNoves++;
          } catch (err) {
            console.error(`  [err] notice ${notice?.noticeNumber}:`, err.message);
          }
        }

        hasMore = notices.length === PAGE_SIZE;
        page++;

        if (hasMore) await sleep(500);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[TED] ✓ Finalitzat en ${elapsed}s · ${totalProcesades} processades · ${totalNoves} noves`);

    if (!isDryRun && fetchLogId) {
      await supabase.from('fetch_log').update({
        estat: 'ok',
        finalitzat_a: new Date().toISOString(),
        licitaciones_noves: totalNoves,
        licitaciones_total: totalProcesades,
      }).eq('id', fetchLogId);
    }

  } catch (err) {
    console.error('[TED] ✗ Error fatal:', err.message);
    if (!isDryRun && fetchLogId) {
      await supabase.from('fetch_log').update({
        estat: 'error',
        finalitzat_a: new Date().toISOString(),
        error_missatge: err.message,
      }).eq('id', fetchLogId);
    }
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────
// CONSTRUCCIÓ DE LA URL DE CERCA TED
// ─────────────────────────────────────────────────────────────────
function buildSearchUrl(country, since, page) {
  const params = new URLSearchParams({
    // Filtres principals
    'fields[notices]': [
      'BT-01-notice',       // Notice number
      'BT-02-notice',       // Notice type
      'BT-03-notice',       // Form type
      'BT-04-notice',       // Procedure identifier
      'BT-05a-notice',      // Dispatch date
      'BT-05b-notice',      // Publication date
      'BT-06-notice',       // Expected date of publication
      'BT-21-Procedure',    // Procedure title
      'BT-23-Procedure',    // Procedure description
      'BT-24-Procedure',    // Procedure scope/description
      'BT-263-Procedure',   // Additional Nature
      'OPP-01-notice',      // Legal basis
      'OPP-034-Tender',     // Country
      'BT-300-Procedure',   // Description
      'BT-727-Procedure',   // Procedure type (open, restricted...)
    ].join(','),
    'filter[notices]':
      `publication-date>=${since} AND buyer-country-code IN (${country})`,
    'page[size]':   PAGE_SIZE,
    'page[number]': page,
    'sort[notices]': '-publication-date',
  });

  return `${TED_API_BASE}/notices/search?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────
// FETCH AMB RETRY
// ─────────────────────────────────────────────────────────────────
async function fetchJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'licilibre/1.0 (https://github.com/licilibre/licilibre)',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (err) {
      if (i === 2) throw err;
      console.warn(`  [retry ${i + 1}] ${err.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────
fetchTED();

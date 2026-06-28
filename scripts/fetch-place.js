/**
 * licilibre · scripts/fetch-place.js
 *
 * Fetcher para la Plataforma de Contratación del Sector Público (PLACE)
 * Fuente oficial: Ministerio de Hacienda
 * Formato: Atom XML paginado (máx. 500 entradas por fichero)
 * Actualización: diaria
 *
 * Uso:
 *   node fetch-place.js            # Fetch incremental (hoy)
 *   node fetch-place.js --dry-run  # Mostrar sin guardar
 *   node fetch-place.js --full     # Reprocesar fichero completo
 */

import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';
import { normalize } from './normalize.js';

const PLACE_ATOM_URL =
  'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';

const MAX_PAGES = 50;    // Límite de seguridad de páginas a procesar
const DELAY_MS  = 1000;  // Pausa entre requests para no sobrecargar

const isDryRun = process.argv.includes('--dry-run');
const isFull   = process.argv.includes('--full');

const supabase = isDryRun ? null : createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
});

// ─────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────
async function fetchPLACE() {
  console.log(`[PLACE] Iniciando fetch ${isDryRun ? '(DRY RUN)' : ''}`);
  const startTime = Date.now();

  let fetchLogId = null;
  if (!isDryRun) {
    const { data } = await supabase
      .from('fetch_log')
      .insert({ fuente: 'place', estat: 'running' })
      .select('id').single();
    fetchLogId = data?.id;
  }

  let totalNoves = 0;
  let totalActualitzades = 0;
  let totalProcesades = 0;
  let nextUrl = PLACE_ATOM_URL;
  let page = 0;

  try {
    while (nextUrl && page < MAX_PAGES) {
      page++;
      console.log(`[PLACE] Pàgina ${page}: ${nextUrl}`);

      const xml = await fetchWithRetry(nextUrl);
      const parsed = parser.parse(xml);
      const feed = parsed?.feed;

      if (!feed) throw new Error('Format Atom inesperat');

      const entries = toArray(feed.entry);
      console.log(`[PLACE] → ${entries.length} entrades`);

      // Processar cada entrada
      for (const entry of entries) {
        totalProcesades++;
        try {
          const licitacio = parsePlaceEntry(entry);
          if (!licitacio) continue;

          const normalitzada = normalize(licitacio, 'place');

          if (isDryRun) {
            console.log(`  [dry] ${normalitzada.id} · ${normalitzada.titulo?.substring(0, 60)}`);
            continue;
          }

          const { error } = await supabase
            .from('licitaciones')
            .upsert(normalitzada, { onConflict: 'id', ignoreDuplicates: false });

          if (error) {
            console.error(`  [err] ${normalitzada.id}:`, error.message);
          } else {
            // Determinem si és nova o actualitzada per les estadístiques
            totalNoves++;
          }
        } catch (err) {
          console.error(`  [err] entrada ${entry?.id}:`, err.message);
        }
      }

      // Paginació: buscar link rel="next"
      const links = toArray(feed.link);
      const nextLink = links.find(l => l['@_rel'] === 'next');
      nextUrl = nextLink?.['@_href'] ?? null;

      // En mode incremental aturem a la primera pàgina (ja tenim el fresc)
      if (!isFull && page === 1) {
        console.log('[PLACE] Mode incremental: primera pàgina procesada.');
        break;
      }

      if (nextUrl) await sleep(DELAY_MS);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[PLACE] ✓ Finalitzat en ${elapsed}s · ${totalProcesades} processades · ${totalNoves} noves`);

    if (!isDryRun && fetchLogId) {
      await supabase.from('fetch_log').update({
        estat: 'ok',
        finalitzat_a: new Date().toISOString(),
        licitaciones_noves: totalNoves,
        licitaciones_total: totalProcesades,
      }).eq('id', fetchLogId);
    }

  } catch (err) {
    console.error('[PLACE] ✗ Error fatal:', err.message);
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
// PARSER D'ENTRADA PLACE (Atom + CODICE XML)
// ─────────────────────────────────────────────────────────────────
function parsePlaceEntry(entry) {
  if (!entry?.id) return null;

  // L'entry conté el contingut CODICE dins de <content>
  // El contingut pot venir parsejat com a objecte o com a string
  const content = entry.content?.['#text'] || entry.content || '';
  let codice = {};

  if (content && typeof content === 'string' && content.includes('<')) {
    try {
      const parsed = parser.parse(content);
      // L'arrel pot ser ContractNotice, ContractAwardNotice, etc.
      codice = parsed?.ContractNotice
            || parsed?.ContractAwardNotice
            || parsed?.PriorInformationNotice
            || parsed?.['can:ContractAwardNotice']
            || {};
    } catch {
      // Si no podem parsear el CODICE, usem el que tenim de l'Atom
    }
  }

  // Extracció de camps principals
  // L'estructura CODICE pot variar; intentem els camins més comuns
  const getPath = (obj, ...paths) => {
    for (const path of paths) {
      const val = path.split('.').reduce((o, k) => o?.[k], obj);
      if (val !== undefined && val !== null) return val;
    }
    return null;
  };

  const idOrigen = getPath(entry, 'id') ?? '';
  const idNorm = 'place_' + idOrigen.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);

  return {
    id_origen:        idOrigen,
    fuente:           'place',

    titulo:           getPath(codice, 'cbc:ContractName', 'ContractName')
                   || entry.title?.['#text']
                   || entry.title
                   || 'Sense títol',

    organismo:        getPath(codice,
                        'cac:ContractingParty.cac:Party.cac:PartyName.cbc:Name',
                        'ContractingParty.Party.PartyName.Name'
                      ) || '',

    organismo_nif:    getPath(codice,
                        'cac:ContractingParty.cac:Party.cac:PartyIdentification.cbc:ID'
                      ),

    tipus_contracte:  getPath(codice,
                        'cbc:ContractTypeCode.#text',
                        'ContractTypeCode.#text',
                        'cbc:ContractTypeCode'
                      ),

    procediment:      getPath(codice,
                        'cac:TenderingProcess.cbc:ProcedureCode.#text',
                        'TenderingProcess.ProcedureCode.#text'
                      ),

    cpv_codes:        extractCPVs(codice),

    pressupost_base:  parseAmount(
                        getPath(codice,
                          'cac:ProcurementProject.cbc:EstimatedOverallContractAmount.#text',
                          'ProcurementProject.EstimatedOverallContractAmount.#text',
                          'cac:ProcurementProject.cbc:EstimatedOverallContractAmount'
                        )
                      ),

    data_publicacio:  parseDate(entry.published || entry.updated),
    data_tancament:   parseDate(
                        getPath(codice,
                          'cac:TenderingProcess.cac:TenderSubmissionDeadlinePeriod.cbc:EndDate',
                          'TenderingProcess.TenderSubmissionDeadlinePeriod.EndDate'
                        )
                      ),

    estat:            mapEstat(
                        getPath(codice, 'cbc:ContractFolderStatusCode', 'ContractFolderStatusCode')
                      ),

    url_licitacio:    entry.link?.['@_href']
                   || toArray(entry.link).find(l => l['@_rel'] === 'alternate')?.['@_href'],

    // Localització (intentem extreure CCAA/Província)
    ccaa:             extractCCAA(codice),
    provincia:        extractProvincia(codice),

    // Raw per si necessitem re-parsear
    _raw_atom_id:     idOrigen,
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function extractCPVs(codice) {
  const classifications = toArray(
    codice?.['cac:ProcurementProject']?.['cac:MainCommodityClassification']
    || codice?.ProcurementProject?.MainCommodityClassification
  );
  return classifications
    .map(c => c?.['cbc:ItemClassificationCode'] || c?.ItemClassificationCode)
    .filter(Boolean)
    .map(c => (typeof c === 'object' ? c?.['#text'] : c))
    .filter(Boolean)
    .map(String);
}

function extractCCAA(codice) {
  // Les CCAA s'infereixin de la província o del codi de realització
  const region = codice?.['cac:ProcurementProject']?.['cac:RealizedLocation']?.['cbc:CountrySubentity']
               || codice?.ProcurementProject?.RealizedLocation?.CountrySubentity;
  return region ? String(region) : null;
}

function extractProvincia(codice) {
  return codice?.['cac:ProcurementProject']?.['cac:RealizedLocation']?.['cac:Address']?.['cbc:CityName']
      || null;
}

function mapEstat(code) {
  const map = {
    'PUB': 'publicada',
    'ACT': 'activa',
    'ADJ': 'adjudicada',
    'FOR': 'formalitzada',
    'DES': 'deserta',
    'ANU': 'anulada',
    'EV':  'avaluacio',
  };
  return map[code] || 'publicada';
}

function parseAmount(val) {
  if (!val) return null;
  const n = parseFloat(String(val).replace(',', '.').replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'licilibre/1.0 (https://github.com/licilibre/licilibre; open source public tender aggregator)',
          'Accept': 'application/atom+xml, text/xml, */*',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`  [retry ${i + 1}/${retries}] ${err.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────
fetchPLACE();

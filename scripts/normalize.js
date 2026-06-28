/**
 * licilibre · scripts/normalize.js
 *
 * Normaliza los datos de cualquier fuente al esquema común de licilibre.
 * Cada fuente tiene su propio mapeador. El resultado es siempre el mismo
 * objeto que puede insertarse directamente en Supabase.
 */

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────
// ENTRADA PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export function normalize(rawData, fuente) {
  switch (fuente) {
    case 'place':     return normalizePLACE(rawData);
    case 'ted':       return normalizeTED(rawData);
    case 'pscp_cat':  return normalizePSCPCat(rawData);
    default:
      throw new Error(`Fuente desconocida: ${fuente}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// NORMALIZADOR PLACE (Hacienda / contrataciondelsectorpublico.gob.es)
// ─────────────────────────────────────────────────────────────────
function normalizePLACE(data) {
  const id = `place_${cleanId(data.id_origen)}`;

  const obj = {
    id,
    id_origen:            data.id_origen,
    fuente:               'place',

    titulo:               cleanText(data.titulo) || 'Sense títol',
    organismo:            cleanText(data.organismo) || '',
    organismo_nif:        data.organismo_nif || null,

    tipus_contracte:      mapTipusContractePLACE(data.tipus_contracte),
    procediment:          data.procediment || null,

    cpv_codes:            (data.cpv_codes || []).map(cleanCPV).filter(Boolean),
    cpv_descripcions:     (data.cpv_codes || []).map(cpvToDescripcio).filter(Boolean),

    ccaa:                 normalizeCCAA(data.ccaa),
    provincia:            cleanText(data.provincia),
    municipio:            null,
    pais:                 'ES',

    pressupost_base:      parseAmount(data.pressupost_base),
    pressupost_iva:       null,
    valor_estimat:        parseAmount(data.valor_estimat),
    moneda:               'EUR',

    data_publicacio:      parseDate(data.data_publicacio),
    data_tancament:       parseDate(data.data_tancament),
    data_adjudicacio:     parseDate(data.data_adjudicacio),

    estat:                data.estat || 'publicada',

    url_licitacio:        data.url_licitacio || null,
    url_plec:             data.url_plec || null,

    empresa_adjudicataria: null,
    import_adjudicat:      null,

    hash_contingut:       hashContent(data),
  };

  return sanitize(obj);
}

// ─────────────────────────────────────────────────────────────────
// NORMALIZADOR TED (api.ted.europa.eu)
// ─────────────────────────────────────────────────────────────────
function normalizeTED(notice) {
  // L'API TED v3 retorna un objecte notice amb camps BT-* (Business Terms)
  const noticeNum = notice?.['BT-01-notice'] || notice?.noticeNumber || '';
  const id = `ted_${cleanId(noticeNum)}`;

  const titulo =
    notice?.['BT-21-Procedure']  ||      // Títol del procediment
    notice?.['BT-300-Procedure'] ||      // Descripció
    notice?.title ||
    'EU Tender';

  const organismo =
    notice?.['OPP-040-Tender']?.name  ||
    notice?.['buyer-name']            ||
    notice?.['contracting-authority'] ||
    '';

  const cpvCodes = extractTEDCPVs(notice);

  const obj = {
    id,
    id_origen:            noticeNum,
    fuente:               'ted',

    titulo:               cleanText(titulo),
    organismo:            cleanText(organismo),
    organismo_nif:        null,

    tipus_contracte:      mapTipusContracteTED(notice?.['BT-23-Procedure']),
    procediment:          notice?.['BT-727-Procedure'] || null,

    cpv_codes:            cpvCodes.map(cleanCPV).filter(Boolean),
    cpv_descripcions:     cpvCodes.map(cpvToDescripcio).filter(Boolean),

    ccaa:                 null,
    provincia:            null,
    municipio:            null,
    pais:                 notice?.['OPP-034-Tender']?.[0] || 'ES',

    pressupost_base:      parseAmount(notice?.['BT-ContractValue'] || notice?.estimatedValue),
    pressupost_iva:       null,
    valor_estimat:        parseAmount(notice?.totalValue),
    moneda:               notice?.currency || 'EUR',

    data_publicacio:      parseDate(notice?.['BT-05b-notice'] || notice?.publicationDate),
    data_tancament:       parseDate(notice?.['BT-131-Lot'] || notice?.submissionDeadline),
    data_adjudicacio:     null,

    estat:                mapEstatTED(notice?.['BT-02-notice'] || notice?.noticeType),

    url_licitacio:        `https://ted.europa.eu/en/notice/${noticeNum}`,
    url_plec:             null,
    url_anunci:           `https://ted.europa.eu/en/notice/${noticeNum}`,

    empresa_adjudicataria: null,
    import_adjudicat:      null,

    hash_contingut:       hashContent(notice),
  };

  return sanitize(obj);
}

// ─────────────────────────────────────────────────────────────────
// NORMALIZADOR PSCP CATALUNYA (contractaciopublica.cat)
// ─────────────────────────────────────────────────────────────────
function normalizePSCPCat(data) {
  const id = `pscp_cat_${cleanId(data.id_origen || data.expedient)}`;

  const obj = {
    id,
    id_origen:            data.id_origen || data.expedient,
    fuente:               'pscp_cat',

    titulo:               cleanText(data.titulo || data.objecte),
    organismo:            cleanText(data.organismo || data.entitat),
    organismo_nif:        data.nif || null,

    tipus_contracte:      mapTipusContractePSCPCat(data.tipus),
    procediment:          data.procediment || null,

    cpv_codes:            toArray(data.cpv_codes).map(cleanCPV).filter(Boolean),
    cpv_descripcions:     toArray(data.cpv_codes).map(cpvToDescripcio).filter(Boolean),

    ccaa:                 'Catalunya',
    provincia:            normalizeProvincia(data.provincia),
    municipio:            cleanText(data.municipi),
    pais:                 'ES',

    pressupost_base:      parseAmount(data.import_licitacio || data.pressupost_base),
    pressupost_iva:       parseAmount(data.import_amb_iva),
    valor_estimat:        parseAmount(data.valor_estimat),
    moneda:               'EUR',

    data_publicacio:      parseDate(data.data_publicacio),
    data_tancament:       parseDate(data.data_presentacio || data.data_tancament),
    data_adjudicacio:     parseDate(data.data_adjudicacio),

    estat:                mapEstatPSCPCat(data.estat || data.status),

    url_licitacio:        data.url || data.url_licitacio || null,
    url_plec:             data.url_plec || null,
    url_anunci:           data.url_dogc || null,

    empresa_adjudicataria: cleanText(data.empresa_adjudicataria),
    import_adjudicat:      parseAmount(data.import_adjudicat),

    hash_contingut:       hashContent(data),
  };

  return sanitize(obj);
}

// ─────────────────────────────────────────────────────────────────
// MAPEADORS DE CAMPS
// ─────────────────────────────────────────────────────────────────

const CPV_MAP = {
  '92111200': 'Producció de pel·lícules publicitàries',
  '92100000': 'Serveis de cinema i vídeo',
  '92111000': 'Producció cinematogràfica i videogràfica',
  '74200000': 'Serveis de fotografia',
  '79341400': 'Serveis de publicitat',
  '79400000': 'Serveis de consultoria empresarial',
  '72000000': 'Serveis de tecnologies de la informació',
  '45000000': 'Treballs de construcció',
  '80000000': 'Serveis d\'ensenyament i formació',
  '80531200': 'Serveis de formació professional tècnica',
  '32323000': 'Monitors de vídeo',
  '85000000': 'Serveis de salut i serveis socials',
  '60000000': 'Serveis de transport',
  '50000000': 'Serveis de reparació i manteniment',
  '90000000': 'Serveis de clavegueram, escombraries i neteja',
};

function cpvToDescripcio(cpv) {
  if (!cpv) return null;
  const clean = cleanCPV(cpv);
  // Primer intentem els 8 dígits, després els 4 primers (grup)
  return CPV_MAP[clean]
      || CPV_MAP[clean?.substring(0, 4)]
      || `CPV ${clean}`;
}

function cleanCPV(cpv) {
  if (!cpv) return null;
  return String(cpv).replace(/[^0-9]/g, '').substring(0, 8) || null;
}

function extractTEDCPVs(notice) {
  const cpv = notice?.['BT-262-Procedure']
           || notice?.['cpv-codes']
           || notice?.mainCpv;
  return toArray(cpv).filter(Boolean).map(c =>
    typeof c === 'object' ? (c?.code || c?.value) : c
  ).filter(Boolean);
}

function mapTipusContractePLACE(code) {
  const map = {
    '1': 'Obres',
    '2': 'Serveis',
    '3': 'Subministraments',
    'services': 'Serveis',
    'works': 'Obres',
    'supplies': 'Subministraments',
  };
  return map[String(code).toLowerCase()] || code || null;
}

function mapTipusContracteTED(desc) {
  if (!desc) return null;
  const d = desc.toLowerCase();
  if (d.includes('servi') || d.includes('service')) return 'Serveis';
  if (d.includes('obra') || d.includes('work'))    return 'Obres';
  if (d.includes('submin') || d.includes('supply')) return 'Subministraments';
  return desc;
}

function mapTipusContractePSCPCat(tipus) {
  const map = {
    'SE': 'Serveis', 'OB': 'Obres', 'SU': 'Subministraments',
    'Serveis': 'Serveis', 'Obres': 'Obres', 'Subministraments': 'Subministraments',
  };
  return map[tipus] || tipus || null;
}

function mapEstatTED(noticeType) {
  if (!noticeType) return 'publicada';
  const t = noticeType.toLowerCase();
  if (t.includes('award') || t.includes('adjudica')) return 'adjudicada';
  if (t.includes('prior'))                            return 'publicada';
  return 'activa';
}

function mapEstatPSCPCat(estat) {
  const map = {
    'Publicada': 'publicada',
    'En termini': 'activa',
    'Resolució Provisional': 'resolucio_provisional',
    'Adjudicada': 'adjudicada',
    'Formalitzada': 'formalitzada',
    'Deserta': 'deserta',
    'Anul·lada': 'anulada',
  };
  return map[estat] || 'publicada';
}

const CCAA_MAP = {
  'andalucia': 'Andalucía', 'aragon': 'Aragón', 'asturias': 'Principado de Asturias',
  'baleares': 'Illes Balears', 'canarias': 'Canarias', 'cantabria': 'Cantabria',
  'castilla-la mancha': 'Castilla-La Mancha', 'castilla y leon': 'Castilla y León',
  'catalunya': 'Catalunya', 'cataluna': 'Catalunya',
  'comunitat valenciana': 'Comunitat Valenciana',
  'extremadura': 'Extremadura', 'galicia': 'Galicia', 'madrid': 'Comunidad de Madrid',
  'murcia': 'Región de Murcia', 'navarra': 'Comunidad Foral de Navarra',
  'pais vasco': 'País Vasco', 'euskadi': 'País Vasco',
  'la rioja': 'La Rioja', 'ceuta': 'Ciudad de Ceuta', 'melilla': 'Ciudad de Melilla',
};

function normalizeCCAA(val) {
  if (!val) return null;
  const key = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CCAA_MAP[key] || val;
}

const PROV_MAP = {
  'barcelona': 'Barcelona', 'girona': 'Girona', 'lleida': 'Lleida', 'tarragona': 'Tarragona',
  'madrid': 'Madrid', 'valencia': 'València', 'sevilla': 'Sevilla', 'bilbao': 'Bilbao',
};

function normalizeProvincia(val) {
  if (!val) return null;
  return PROV_MAP[val?.toLowerCase()] || val;
}

// ─────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────

function cleanText(val) {
  if (!val) return null;
  return String(val).trim().replace(/\s+/g, ' ') || null;
}

function cleanId(val) {
  if (!val) return 'unknown';
  return String(val).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 200);
}

function parseAmount(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(',', '.').replace(/[^\d.-]/g, ''));
  return isNaN(n) || n < 0 ? null : Math.round(n * 100) / 100;
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

function hashContent(data) {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

function sanitize(obj) {
  // Assegurem que cap camp obligatori és null
  if (!obj.id) throw new Error('ID és obligatori');
  if (!obj.titulo) obj.titulo = 'Sense títol';
  if (!obj.organismo) obj.organismo = '';
  return obj;
}

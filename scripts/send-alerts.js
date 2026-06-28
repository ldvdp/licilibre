/**
 * licilibre · scripts/send-alerts.js
 *
 * Processa les alertes actives i envia emails amb les noves licitacions
 * que compleixen els criteris de cada alerta.
 *
 * Utilitza Resend (resend.com) per enviar emails - free tier: 3000/mes
 * Executa's un cop al dia, just després dels fetchers.
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'alertes@licilibre.es';
const SITE_URL   = process.env.SITE_URL   || 'https://licilibre.es';

// ─────────────────────────────────────────────────────────────────
async function sendAlerts() {
  console.log('[Alertes] Processant alertes...');

  // Obtenim les alertes actives i verificades
  const { data: alertes, error: alertesErr } = await supabase
    .from('alertes')
    .select('*')
    .eq('activa', true)
    .eq('verificat', true)
    .eq('frequencia', 'diaria');

  if (alertesErr) {
    console.error('[Alertes] Error:', alertesErr.message);
    return;
  }

  console.log(`[Alertes] ${alertes.length} alertes actives`);

  let enviaments = 0;

  for (const alerta of alertes) {
    try {
      const noves = await trobarNovesLicitacions(alerta);

      if (noves.length === 0) {
        console.log(`  [skip] ${alerta.email}: cap novetat`);
        continue;
      }

      await enviarEmail(alerta, noves);
      await marcarComEnviades(alerta.id, noves.map(l => l.id));

      console.log(`  [ok] ${alerta.email}: ${noves.length} licitacions enviades`);
      enviaments++;

    } catch (err) {
      console.error(`  [err] ${alerta.email}:`, err.message);
    }

    // Pausa petita per no sobrecarregar l'API d'email
    await sleep(200);
  }

  console.log(`[Alertes] ✓ ${enviaments} emails enviats`);
}

// ─────────────────────────────────────────────────────────────────
// CERCA LICITACIONS QUE COMPLEIXEN L'ALERTA
// ─────────────────────────────────────────────────────────────────
async function trobarNovesLicitacions(alerta) {
  let query = supabase
    .from('licitaciones_actives')
    .select('*')
    // Nomes licitacions de les darreres 26h (marge de seguretat)
    .gte('data_publicacio', new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString());

  // Filtres de l'alerta
  if (alerta.ccaas?.length) {
    query = query.in('ccaa', alerta.ccaas);
  }
  if (alerta.fuentes?.length) {
    query = query.in('fuente', alerta.fuentes);
  }
  if (alerta.tipus_contracte?.length) {
    query = query.in('tipus_contracte', alerta.tipus_contracte);
  }
  if (alerta.pressupost_min) {
    query = query.gte('pressupost_base', alerta.pressupost_min);
  }
  if (alerta.pressupost_max) {
    query = query.lte('pressupost_base', alerta.pressupost_max);
  }

  const { data } = await query.limit(50);
  let resultats = data || [];

  // Filtre per paraules clau (full-text en client si cal)
  if (alerta.paraules_clau?.length) {
    const keywords = alerta.paraules_clau.map(k => k.toLowerCase());
    resultats = resultats.filter(l =>
      keywords.some(k =>
        l.titulo?.toLowerCase().includes(k) ||
        l.organismo?.toLowerCase().includes(k) ||
        l.cpv_descripcions?.some(d => d?.toLowerCase().includes(k))
      )
    );
  }

  // Filtrem les que ja s'han enviat per a aquesta alerta
  const { data: jaEnviades } = await supabase
    .from('alertes_enviades')
    .select('licitacio_id')
    .eq('alerta_id', alerta.id)
    .in('licitacio_id', resultats.map(l => l.id));

  const idsEnviades = new Set((jaEnviades || []).map(e => e.licitacio_id));
  return resultats.filter(l => !idsEnviades.has(l.id));
}

// ─────────────────────────────────────────────────────────────────
// ENVIAR EMAIL
// ─────────────────────────────────────────────────────────────────
async function enviarEmail(alerta, licitacions) {
  const html = buildEmailHTML(alerta, licitacions);
  const text = buildEmailText(licitacions);

  await resend.emails.send({
    from: `licilibre <${FROM_EMAIL}>`,
    to: alerta.email,
    subject: `${licitacions.length} nova${licitacions.length > 1 ? 's' : ''} licitaci${licitacions.length > 1 ? 'ons' : 'ó'} · licilibre`,
    html,
    text,
  });

  await supabase
    .from('alertes')
    .update({
      darrer_enviament: new Date().toISOString(),
      num_enviaments: (alerta.num_enviaments || 0) + 1,
    })
    .eq('id', alerta.id);
}

// ─────────────────────────────────────────────────────────────────
// TEMPLATES D'EMAIL
// ─────────────────────────────────────────────────────────────────
function buildEmailHTML(alerta, licitacions) {
  const eur = n => n ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : '—';
  const urgColor = d => d <= 5 ? '#A32D2D' : d <= 15 ? '#854F0B' : '#3B6D11';

  const cards = licitacions.map(l => {
    const dies = l.dies_restants ?? '?';
    const color = urgColor(dies);
    return `
      <div style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px;overflow:hidden;">
        <div style="height:3px;background:${color};"></div>
        <div style="padding:14px 16px;">
          <div style="margin-bottom:6px;">
            <span style="font-size:11px;background:#E1F5EE;color:#0F6E56;border:1px solid #9FE1CB;border-radius:3px;padding:2px 6px;font-weight:500;">${l.fuente?.toUpperCase()}</span>
            ${l.tipus_contracte ? `<span style="font-size:11px;color:#6b7280;margin-left:6px;">${l.tipus_contracte}</span>` : ''}
            ${l.ccaa ? `<span style="font-size:11px;color:#6b7280;margin-left:6px;">· ${l.ccaa}</span>` : ''}
          </div>
          <p style="font-size:14px;font-weight:500;color:#111827;margin:0 0 6px 0;line-height:1.4;">${l.titulo}</p>
          <p style="font-size:13px;color:#4b5563;margin:0 0 10px 0;">🏛️ ${l.organismo}</p>
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
            <span style="font-size:15px;font-weight:500;color:#111827;">${eur(l.pressupost_base)}</span>
            <span style="font-size:12px;color:#9ca3af;">Cierre: ${l.data_tancament?.split('T')[0] || '—'}</span>
            <span style="font-size:14px;font-weight:500;color:${color};">${dies} dies</span>
          </div>
          ${l.url_licitacio ? `
            <div style="margin-top:10px;">
              <a href="${l.url_licitacio}" style="font-size:13px;color:#2563eb;text-decoration:none;">Ver convocatoria oficial →</a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  const unsubUrl = `${SITE_URL}/alertes/cancelar?id=${alerta.id}&token=${alerta.token_verificacio}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="background:#1d4ed8;padding:20px 24px;">
            <span style="color:white;font-size:18px;font-weight:600;">licilibre</span>
            <span style="color:#93c5fd;font-size:14px;margin-left:8px;">${licitacions.length} nova${licitacions.length > 1 ? 's' : ''} licitaci${licitacions.length > 1 ? 'ons' : 'ó'}</span>
          </div>
          <div style="padding:20px 24px;">
            ${cards}
            <div style="border-top:1px solid #f3f4f6;margin-top:20px;padding-top:16px;text-align:center;">
              <a href="${SITE_URL}" style="display:inline-block;background:#1d4ed8;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
                Veure totes les licitacions
              </a>
            </div>
          </div>
          <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">
              licilibre · La informació pública ha de ser pública de veritat.<br>
              <a href="${unsubUrl}" style="color:#6b7280;">Cancelar alerta</a>
              · <a href="${SITE_URL}" style="color:#6b7280;">licilibre.es</a>
              · <a href="https://github.com/licilibre/licilibre" style="color:#6b7280;">GitHub</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildEmailText(licitacions) {
  return licitacions.map(l =>
    `${l.titulo}\n${l.organismo}\n${l.pressupost_base ? `${l.pressupost_base}€` : ''} · ${l.dies_restants} dies restants\n${l.url_licitacio || ''}\n`
  ).join('\n---\n\n');
}

// ─────────────────────────────────────────────────────────────────
async function marcarComEnviades(alertaId, licitacioIds) {
  await supabase.from('alertes_enviades').insert(
    licitacioIds.map(id => ({ alerta_id: alertaId, licitacio_id: id }))
  );
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────
sendAlerts();

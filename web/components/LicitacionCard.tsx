// licilibre · web/components/LicitacionCard.tsx
// Tarjeta principal. Server Component (sin estado cliente).

import type { Licitacio } from '@/lib/types';

interface Props {
  licitacio: Licitacio;
}

const FONT_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  place:    { label: 'PLACE',   bg: '#E1F5EE', text: '#0F6E56', border: '#9FE1CB' },
  ted:      { label: 'TED',     bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
  pscp_cat: { label: 'PSCP',    bg: '#E1F5EE', text: '#0F6E56', border: '#9FE1CB' },
  rtve:     { label: 'RTVE',    bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  aena:     { label: 'AENA',    bg: '#EEEDFE', text: '#3C3489', border: '#AFA9EC' },
  sepe:     { label: 'SEPE',    bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  red_es:   { label: 'RED.ES',  bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
};

function urgStyle(dies: number | undefined) {
  const d = dies ?? 999;
  if (d <= 5)   return { bar: '#E24B4A', num: '#A32D2D' };
  if (d <= 15)  return { bar: '#EF9F27', num: '#854F0B' };
  return             { bar: '#639922', num: '#3B6D11' };
}

const EUR = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
    : '—';

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

export function LicitacionCard({ licitacio: l }: Props) {
  const dies = l.dies_restants;
  const urg  = urgStyle(dies);
  const font = FONT_BADGE[l.fuente] ?? { label: l.fuente.toUpperCase(), bg: '#F1EFE8', text: '#5F5E5A', border: '#D3D1C7' };
  const expedient = l.id_origen?.substring(0, 35) ?? '';

  return (
    <article
      style={{
        background: 'var(--surface-2, #fff)',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Barra urgència */}
      <div style={{ height: 3, background: urg.bar }} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

          {/* Cos principal */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginBottom: 7 }}>
              <span style={{
                fontSize: 11, fontWeight: 500,
                padding: '2px 7px', borderRadius: 4,
                background: font.bg, color: font.text,
                border: `1px solid ${font.border}`,
              }}>
                {font.label}
              </span>
              {l.tipus_contracte && (
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#F1EFE8', color: '#5F5E5A', border: '1px solid #D3D1C7' }}>
                  {l.tipus_contracte}
                </span>
              )}
              {l.cpv_descripcions?.[0] && (
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {l.cpv_descripcions[0]}
                </span>
              )}
              {l.provincia && <span style={{ fontSize: 11, color: '#9ca3af' }}>· {l.provincia}</span>}
              {l.ccaa && !l.provincia && <span style={{ fontSize: 11, color: '#9ca3af' }}>· {l.ccaa}</span>}
              {l.pais && l.pais !== 'ES' && <span style={{ fontSize: 11, color: '#9ca3af' }}>· {l.pais}</span>}
            </div>

            {/* Títol */}
            <a href={`/licitacion/${l.id}`} style={{ textDecoration: 'none' }}>
              <h3 style={{
                fontSize: 14, fontWeight: 500,
                color: '#111827', lineHeight: 1.45,
                marginBottom: 7,
              }}>
                {l.titulo}
              </h3>
            </a>

            {/* Organisme */}
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              <span>{l.organismo}</span>
              {expedient && <span style={{ color: '#d1d5db', fontSize: 11, marginLeft: 4 }}>{expedient}</span>}
            </p>

            {/* Fila inferior */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>{EUR(l.pressupost_base)}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 5 }}>base s/IVA</span>
              </div>
              {l.data_publicacio && (
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  Pub. {fmtDate(l.data_publicacio)}
                </span>
              )}
              {l.data_tancament && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  Cierre {fmtDate(l.data_tancament)}
                </span>
              )}
            </div>
          </div>

          {/* Dreta: dies + botons */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 2 }}>
            <div style={{ textAlign: 'center', minWidth: 44 }}>
              <div style={{ fontSize: 26, fontWeight: 500, color: urg.num, lineHeight: 1 }}>
                {dies != null ? dies : '—'}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                {dies == null ? '' : dies === 1 ? 'día' : 'días'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              {/* Crear alerta */}
              <a
                href={`/alertas?organismo=${encodeURIComponent(l.organismo)}`}
                title="Crear alerta para este organismo"
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: '1px solid #e5e7eb', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#9ca3af', textDecoration: 'none', fontSize: 13,
                }}
              >
                🔔
              </a>
              {/* Enllaç extern */}
              {l.url_licitacio && (
                <a
                  href={l.url_licitacio}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver convocatoria oficial"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: '1px solid #e5e7eb', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af', textDecoration: 'none', fontSize: 13,
                  }}
                >
                  ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

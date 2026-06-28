// licilibre · web/app/licitacion/[id]/page.tsx

import { getLicitacio } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: { id: string };
}

const EUR = (n: number | null) =>
  n != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : '—';

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await getLicitacio(params.id);
  if (!l) return { title: 'Licitación no encontrada — licilibre' };
  return {
    title: `${l.titulo.substring(0, 60)} — licilibre`,
    description: `${l.organismo} · ${EUR(l.pressupost_base)} · Cierre ${fmtDate(l.data_tancament)}`,
  };
}

const FONT_LABEL: Record<string, string> = {
  place: 'PLACE (Hacienda)', ted: 'TED (Comisión Europea)',
  pscp_cat: 'PSCP Catalunya', rtve: 'RTVE', aena: 'AENA', sepe: 'SEPE',
};

const ESTAT_LABEL: Record<string, { label: string; color: string }> = {
  publicada:            { label: 'Publicada',             color: '#2563eb' },
  activa:               { label: 'En plazo',              color: '#16a34a' },
  resolucio_provisional:{ label: 'Resolución provisional',color: '#9333ea' },
  adjudicada:           { label: 'Adjudicada',            color: '#9ca3af' },
  formalitzada:         { label: 'Formalizada',           color: '#9ca3af' },
  deserta:              { label: 'Desierta',              color: '#ef4444' },
  anulada:              { label: 'Anulada',               color: '#ef4444' },
};

export default async function LicitacioPage({ params }: Props) {
  const l = await getLicitacio(params.id);
  if (!l) notFound();

  const dies = l.data_tancament
    ? Math.ceil((new Date(l.data_tancament).getTime() - Date.now()) / 86400000)
    : null;

  const urgColor = (d: number | null) =>
    d == null ? '#9ca3af' : d <= 5 ? '#dc2626' : d <= 15 ? '#d97706' : '#16a34a';

  const estat = ESTAT_LABEL[l.estat] ?? { label: l.estat, color: '#9ca3af' };

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f3f4f6', gap: 20 }}>
      <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0, minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, background: '#2563eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>L</span>
          </div>
          <span style={{ fontWeight: 500, color: '#111827' }}>licilibre</span>
        </a>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 13, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {l.titulo.substring(0, 50)}…
        </span>
      </nav>

      <main style={{ maxWidth: 760, margin: '24px auto', padding: '0 16px' }}>

        {/* Capçalera */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          {/* Barra urgència */}
          <div style={{ height: 4, background: urgColor(dies) }} />

          <div style={{ padding: 24 }}>
            {/* Font + estat */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#E6F1FB', color: '#185FA5', border: '1px solid #B5D4F4' }}>
                {FONT_LABEL[l.fuente] ?? l.fuente}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: estat.color }}>
                ● {estat.label}
              </span>
            </div>

            {/* Títol */}
            <h1 style={{ fontSize: 20, fontWeight: 500, color: '#111827', lineHeight: 1.4, marginBottom: 12 }}>
              {l.titulo}
            </h1>

            {/* Organisme */}
            <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 20 }}>
              🏛️ {l.organismo}
            </p>

            {/* Mètriques principals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Presupuesto base', value: EUR(l.pressupost_base), sub: 'sin IVA' },
                { label: 'Días restantes', value: dies != null ? String(dies) : '—', sub: l.data_tancament ? `Cierre ${fmtDate(l.data_tancament)}` : '', color: urgColor(dies) },
                { label: 'Publicado', value: fmtDate(l.data_publicacio), sub: '' },
              ].map(m => (
                <div key={m.label} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: m.color ?? '#111827' }}>{m.value}</div>
                  {m.sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{m.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detall complet */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Información de la licitación</h2>

          <Row label="Expediente" value={l.id_origen} />
          {l.tipus_contracte && <Row label="Tipo de contrato" value={l.tipus_contracte} />}
          {l.procediment && <Row label="Procedimiento" value={l.procediment} />}
          {l.ccaa && <Row label="Comunidad autónoma" value={l.ccaa} />}
          {l.provincia && <Row label="Provincia" value={l.provincia} />}
          {l.pressupost_base && <Row label="Presupuesto base" value={EUR(l.pressupost_base) + ' (sin IVA)'} />}
          {l.pressupost_iva && <Row label="Presupuesto (con IVA)" value={EUR(l.pressupost_iva)} />}
          {l.valor_estimat && <Row label="Valor estimado" value={EUR(l.valor_estimat)} />}
          {l.cpv_codes?.length > 0 && (
            <Row label="CPV" value={
              <span>
                {l.cpv_codes.join(', ')}
                {l.cpv_descripcions?.[0] && (
                  <span style={{ color: '#9ca3af', marginLeft: 6, fontSize: 12 }}>
                    ({l.cpv_descripcions[0]})
                  </span>
                )}
              </span>
            } />
          )}
          <Row label="Publicación" value={fmtDate(l.data_publicacio)} />
          {l.data_tancament && <Row label="Límite presentación" value={fmtDate(l.data_tancament)} />}
          {l.data_adjudicacio && <Row label="Adjudicación" value={fmtDate(l.data_adjudicacio)} />}
          {l.empresa_adjudicataria && <Row label="Empresa adjudicataria" value={l.empresa_adjudicataria} />}
          {l.import_adjudicat && <Row label="Importe adjudicado" value={EUR(l.import_adjudicat)} />}
        </div>

        {/* Accions */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>Acciones</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {l.url_licitacio && (
              <a
                href={l.url_licitacio}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 8, fontSize: 13,
                  background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 500,
                }}
              >
                Ver convocatoria oficial ↗
              </a>
            )}
            {l.url_plec && (
              <a
                href={l.url_plec}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 8, fontSize: 13,
                  background: 'transparent', color: '#374151',
                  border: '1px solid #e5e7eb', textDecoration: 'none',
                }}
              >
                Pliego de condiciones ↗
              </a>
            )}
            <a
              href={`/alertas?organismo=${encodeURIComponent(l.organismo)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 8, fontSize: 13,
                background: 'transparent', color: '#374151',
                border: '1px solid #e5e7eb', textDecoration: 'none',
              }}
            >
              🔔 Crear alerta para este organismo
            </a>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          Datos de <strong style={{ color: '#6b7280' }}>{FONT_LABEL[l.fuente] ?? l.fuente}</strong> · licilibre no se hace responsable de errores en los datos originales.{' '}
          <a href="/" style={{ color: '#2563eb' }}>← Volver al buscador</a>
        </p>
      </main>
    </div>
  );
}

'use client';
// licilibre · web/components/FilterPanel.tsx

import { useRouter, useSearchParams } from 'next/navigation';
import type { FiltresRecerca } from '@/lib/types';
import { CCAAS } from '@/lib/types';

const URGENCIES = [
  { key: '',       label: 'Todas'       },
  { key: 'urgent', label: 'Urgente ≤5d' },
  { key: 'aviat',  label: 'Pronto ≤15d' },
  { key: 'ample',  label: 'Amplio +15d' },
];

const FONTS = [
  { key: '',        label: 'Todas'           },
  { key: 'place',   label: 'PLACE (Hacienda)'},
  { key: 'ted',     label: 'TED (UE)'        },
  { key: 'pscp_cat',label: 'PSCP Catalunya'  },
];

const TIPUS = [
  { key: '',                label: 'Todos'         },
  { key: 'Serveis',         label: 'Servicios'     },
  { key: 'Obres',           label: 'Obras'         },
  { key: 'Subministraments',label: 'Suministros'   },
];

const ORDERS = [
  { key: 'dies',      label: 'Cierra antes'   },
  { key: 'pressupost',label: 'Mayor importe'  },
  { key: 'recent',    label: 'Más recientes'  },
];

interface Props { filtresActius: FiltresRecerca }

export function FilterPanel({ filtresActius }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const set = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set(key, value) : p.delete(key);
    p.delete('page');
    router.push(`/?${p.toString()}`);
  };

  const cur = (key: string) => searchParams.get(key) ?? '';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {children}
      </div>
    </div>
  );

  const Pill = ({ k, label, filterKey }: { k: string; label: string; filterKey: string }) => {
    const active = cur(filterKey) === k;
    return (
      <button
        onClick={() => set(filterKey, k)}
        style={{
          textAlign: 'left', padding: '6px 10px', borderRadius: 8,
          fontSize: 13, cursor: 'pointer', border: 'none',
          background: active ? '#EFF6FF' : 'transparent',
          color: active ? '#1d4ed8' : '#6b7280',
          fontWeight: active ? 500 : 400,
          fontFamily: 'inherit',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ fontSize: 13 }}>
      <Section title="Urgencia">
        {URGENCIES.map(u => <Pill key={u.key} k={u.key} label={u.label} filterKey="urgencia" />)}
      </Section>

      <Section title="Fuente">
        {FONTS.map(f => <Pill key={f.key} k={f.key} label={f.label} filterKey="fuente" />)}
      </Section>

      <Section title="Tipo">
        {TIPUS.map(t => <Pill key={t.key} k={t.key} label={t.label} filterKey="tipus" />)}
      </Section>

      <Section title="Ordenar por">
        {ORDERS.map(o => <Pill key={o.key} k={o.key} label={o.label} filterKey="order" />)}
      </Section>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Comunidad autónoma
        </p>
        <select
          value={cur('ccaa')}
          onChange={e => set('ccaa', e.target.value)}
          style={{
            width: '100%', fontSize: 13, padding: '6px 8px',
            borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', fontFamily: 'inherit', color: '#374151',
            outline: 'none',
          }}
        >
          <option value="">Todas</option>
          {CCAAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Limpiar filtres */}
      {searchParams.toString() && (
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 8,
            fontSize: 13, cursor: 'pointer', border: '1px solid #e5e7eb',
            background: 'transparent', color: '#9ca3af', fontFamily: 'inherit',
          }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

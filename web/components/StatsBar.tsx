// licilibre · web/components/StatsBar.tsx
import type { FiltresRecerca } from '@/lib/types';

interface Props {
  total: number;
  filtresActius: FiltresRecerca;
}

export function StatsBar({ total }: Props) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      fontSize: 13, color: '#9ca3af', marginBottom: 16,
    }}>
      <span>
        <strong style={{ color: '#111827', fontWeight: 500 }}>
          {total.toLocaleString('es-ES')}
        </strong>
        {' '}licitaciones activas
      </span>
      <span>·</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#22c55e', display: 'inline-block',
        }} />
        Actualizado cada 24h
      </span>
      <span>·</span>
      <span style={{ color: '#2563eb' }}>Sin registro · 100% gratuito</span>
    </div>
  );
}

export const dynamic = 'force-dynamic';

﻿import { Suspense } from 'react';
import { cercarLicitacions } from '@/lib/supabase';
import type { FiltresRecerca } from '@/lib/types';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { LicitacionCard } from '@/components/LicitacionCard';
import { StatsBar } from '@/components/StatsBar';

interface PageProps {
  searchParams: { q?: string; ccaa?: string; fuente?: string; urgencia?: string; order?: string; page?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;
  const filtres: FiltresRecerca = {
    q: searchParams.q,
    ccaa: searchParams.ccaa,
    fuente: searchParams.fuente as any,
    urgencia: searchParams.urgencia as any,
    order: (searchParams.order as any) || 'dies',
    limit,
    offset: (page - 1) * limit,
  };

  let licitacions: any[] = [];
  let total = 0;

  try {
    const result = await cercarLicitacions(filtres);
    licitacions = result.licitacions;
    total = result.total;
  } catch (e) {
    console.error('Error Supabase:', e);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#2563eb', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>L</span>
          </div>
          <span style={{ fontWeight: 500, color: '#111827', fontSize: 15 }}>licilibre</span>
          <span style={{ fontSize: 11, color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 6px' }}>beta</span>
        </a>
        <div style={{ flex: 1, maxWidth: 600 }}>
          <Suspense fallback={<div style={{ height: 36 }} />}>
            <SearchBar defaultValue={searchParams.q} />
          </Suspense>
        </div>
        <a href="/alertas" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Alertas</a>
        <a href="https://github.com/ldvdp/licilibre" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>GitHub</a>
      </header>

      <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px', display: 'flex', gap: 24 }}>
        <aside style={{ width: 200, flexShrink: 0, display: 'none' }} className="lg-block">
          <Suspense fallback={null}>
            <FilterPanel filtresActius={filtres} />
          </Suspense>
        </aside>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StatsBar total={total} filtresActius={filtres} />
          {licitacions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Sin resultados</p>
              <p style={{ fontSize: 13 }}>La base de datos se pobla con el primer fetch diario</p>
            </div>
          ) : (
            licitacions.map(l => <LicitacionCard key={l.id} licitacio={l} />)
          )}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '16px 20px', textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
        Datos de <strong>PLACE (Hacienda)</strong> · <strong>TED (UE)</strong> · <strong>PSCP Catalunya</strong> · Actualizado cada 24h · <span style={{ color: '#2563eb' }}>100% gratuito · Sin registro</span>
        <br /><a href="https://github.com/ldvdp/licilibre" style={{ color: '#2563eb' }}>Open source · MIT</a> · La información pública debe ser pública de verdad.
      </footer>
    </div>
  );
}

export const revalidate = 3600;

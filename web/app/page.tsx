// licilibre · web/app/page.tsx
// Página principal: búsqueda + listado de licitaciones

import { Suspense } from 'react';
import { cercarLicitacions } from '@/lib/supabase';
import type { FiltresRecerca } from '@/lib/types';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { LicitacionCard } from '@/components/LicitacionCard';
import { StatsBar } from '@/components/StatsBar';

interface PageProps {
  searchParams: {
    q?: string;
    ccaa?: string;
    fuente?: string;
    tipus?: string;
    urgencia?: string;
    order?: string;
    page?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const filtres: FiltresRecerca = {
    q:       searchParams.q,
    ccaa:    searchParams.ccaa,
    fuente:  searchParams.fuente as any,
    tipus:   searchParams.tipus as any,
    urgencia: searchParams.urgencia as any,
    order:   (searchParams.order as any) || 'dies',
    limit,
    offset,
  };

  const { licitacions, total } = await cercarLicitacions(filtres);
  const totalPagines = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <span className="font-medium text-gray-900">licilibre</span>
            <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">beta</span>
          </a>

          <div className="flex-1 max-w-xl">
            <SearchBar defaultValue={searchParams.q} />
          </div>

          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-500">
            <a href="/alertas" className="hover:text-gray-900">Alertas</a>
            <a href="/sobre" className="hover:text-gray-900">Sobre</a>
            <a
              href="https://github.com/licilibre/licilibre"
              className="flex items-center gap-1 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar filtres */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <FilterPanel filtresActius={filtres} />
          </aside>

          {/* Resultats */}
          <div className="flex-1 min-w-0">

            {/* Stats bar */}
            <StatsBar
              total={total}
              filtresActius={filtres}
            />

            {/* Cards */}
            {licitacions.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium text-gray-600 mb-1">Sin resultados</p>
                <p className="text-sm">Prueba con otras palabras clave o cambia los filtros</p>
              </div>
            ) : (
              <div className="space-y-3">
                {licitacions.map(l => (
                  <LicitacionCard key={l.id} licitacio={l} />
                ))}
              </div>
            )}

            {/* Paginació */}
            {totalPagines > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: Math.min(totalPagines, 10) }, (_, i) => i + 1).map(p => (
                  <a
                    key={p}
                    href={`/?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                    className={`px-3 py-1 rounded text-sm border ${
                      p === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </a>
                ))}
                {totalPagines > 10 && (
                  <span className="px-3 py-1 text-sm text-gray-400">…{totalPagines}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-400">
        <p>
          Datos de{' '}
          <strong className="text-gray-600">PLACE (Hacienda)</strong> ·{' '}
          <strong className="text-gray-600">TED (UE)</strong> ·{' '}
          <strong className="text-gray-600">PSCP Catalunya</strong>
          {' '}· Actualizado cada 24h ·{' '}
          <span className="text-blue-600">100% gratuito · Sin registro</span>
        </p>
        <p className="mt-1">
          <a
            href="https://github.com/licilibre/licilibre"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open source · MIT
          </a>
          {' '}· La información pública debe ser pública de verdad.
        </p>
      </footer>
    </div>
  );
}

export const revalidate = 3600; // Revalidar cada hora

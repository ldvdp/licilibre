'use client';

// licilibre · web/components/SearchBar.tsx
// ─────────────────────────────────────────────────────────────────
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const go = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    q.trim() ? params.set('q', q.trim()) : params.delete('q');
    params.delete('page');
    startTransition(() => router.push(`/?${params.toString()}`));
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="1.5"
        viewBox="0 0 24 24" aria-hidden="true"
        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && go(value)}
        placeholder="Busca por palabras clave, organismo, CPV…"
        style={{
          width: '100%', paddingLeft: 32, paddingRight: isPending ? 32 : 12,
          height: 36, fontSize: 13, borderRadius: 8,
          border: '1px solid #d1d5db', background: '#f9fafb',
          outline: 'none', boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
      {isPending && (
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9ca3af' }}>
          …
        </span>
      )}
    </div>
  );
}

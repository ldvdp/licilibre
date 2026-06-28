// licilibre · web/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'licilibre — Licitaciones públicas gratis',
  description:
    'Todas las licitaciones públicas de España y la UE. Sin registro, sin paywalls. PLACE, TED, PSCP Catalunya y más.',
  keywords: ['licitaciones', 'contratación pública', 'PLACE', 'TED', 'concursos públicos', 'contratos públicos'],
  authors: [{ name: 'licilibre', url: 'https://github.com/licilibre' }],
  openGraph: {
    title: 'licilibre — Licitaciones públicas gratis',
    description: 'Todas las licitaciones de España y la UE. Sin registro.',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary',
    title: 'licilibre',
    description: 'Licitaciones públicas gratis. Sin registro.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: '#f9fafb', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

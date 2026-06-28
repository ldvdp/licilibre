/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita la compressió de resposta
  compress: true,

  // Headers de seguretat i cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache agressiu per a les pàgines de licitació (es revaliden cada hora)
        source: '/licitacion/:id',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },

  // Redirects útils
  async redirects() {
    return [
      // Versió antiga de URLs (per si cal)
      {
        source: '/licitaciones/:id',
        destination: '/licitacion/:id',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

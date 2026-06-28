# licilibre 🔓

**Acceso libre, completo y gratuito a todas las licitaciones públicas de España y la UE.**

> Hay empresas que cobran por darte acceso a información que ya es tuya.
> Esto existe para que eso no tenga sentido.

---

## ¿Qué es licilibre?

licilibre es una plataforma open source que agrega, normaliza y publica en tiempo real todas las licitaciones públicas de:

- 🇪🇸 **PLACE** — Plataforma de Contratación del Sector Público (Hacienda)
- 🇪🇺 **TED** — Tenders Electronic Daily (Comisión Europea)
- 🏛️ **Comunidades Autónomas** — PSCP Catalunya, plataformas autonómicas
- 🏢 **Organismos específicos** — RTVE, AENA, SEPE, RED.ES, IPYME…

**Sin registro. Sin paywalls. Sin límites.**

---

## Funcionalidades

- 🔍 Búsqueda full-text potente (título, organismo, CPV, objeto)
- 🚨 Sistema de urgencia visual (días restantes codificados por color)
- 🔔 Alertas personalizadas por email (institución, importe, sector CPV, fecha)
- 🗂️ Filtros por fuente, tipo, comunidad autónoma, presupuesto
- 🌐 Multiidioma: castellano, català, euskara, galego, english
- 📡 API pública para que otros proyectos consuman los datos
- 📊 Estadísticas de mercado abiertas

---

## Por qué existe este proyecto

La contratación pública española mueve más de **200.000 millones de euros al año**.
Toda esa información es pública por ley. Sin embargo:

- Las plataformas oficiales son lentas, fragmentadas y difíciles de usar
- Existen empresas que cobran suscripciones mensuales por agregar datos que son de todos
- Las PYMES, autónomos y pequeñas empresas quedan en desventaja informativa

licilibre nace para nivelar el campo de juego.

---

## Stack técnico (100% gratuito para empezar)

```
Fuentes de datos          Proceso                    Frontend
─────────────────         ──────────────────         ──────────────
PLACE Atom feeds    ─┐
TED API v3          ─┤→  GitHub Actions (cron) ──→  Supabase (PostgreSQL)  ──→  Vercel (Next.js)
PSCP Catalunya      ─┤    fetch + normalize +         full-text search
RTVE / AENA / SEPE  ─┘    upload diario               500 MB gratis
```

| Componente | Servicio | Coste |
|---|---|---|
| Base de datos | Supabase | Gratis (500MB) |
| Automatización | GitHub Actions | Gratis (2000 min/mes) |
| Hosting web | Vercel | Gratis |
| Dominio | TBD | ~10€/año |

---

## Estructura del proyecto

```
licilibre/
├── .github/
│   └── workflows/
│       ├── daily-fetch.yml      # Cron diario: fetch + normalize + upload
│       └── backfill.yml         # Carga histórica inicial
├── scripts/
│   ├── fetch-place.js           # Fetcher PLACE Atom (Hacienda)
│   ├── fetch-ted.js             # Fetcher TED API v3
│   ├── fetch-pscp-cat.js        # Fetcher PSCP Catalunya
│   ├── normalize.js             # Normalizador de datos al esquema común
│   └── upload.js                # Upload a Supabase
├── supabase/
│   └── migrations/
│       ├── 001_initial.sql      # Esquema principal
│       └── 002_alerts.sql       # Sistema de alertas
├── web/                         # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx             # Buscador principal
│   │   ├── licitacion/[id]/
│   │   │   └── page.tsx         # Detalle de licitación
│   │   ├── alertas/
│   │   │   └── page.tsx         # Configurar alertas
│   │   └── sobre/
│   │       └── page.tsx         # Sobre el proyecto
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── LicitacionCard.tsx
│   │   ├── FilterPanel.tsx
│   │   └── AlertForm.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── types.ts
│   └── i18n/
│       ├── es.json              # Castellano (principal)
│       ├── ca.json              # Català
│       ├── eu.json              # Euskara
│       ├── gl.json              # Galego
│       └── en.json              # English
└── docs/
    ├── CONTRIBUTING.md
    ├── API.md
    └── FUENTES.md
```

---

## Cómo contribuir

Este proyecto es tuyo. Todas las mejoras, correcciones y sugerencias son bienvenidas.

### Formas de ayudar

**Sin código:**
- Reportar fuentes de datos que faltan (abre un Issue)
- Mejorar traducciones
- Probar la plataforma y reportar errores
- Difundir el proyecto

**Con código:**
- Añadir nuevas fuentes de datos (ver `docs/FUENTES.md`)
- Mejorar el buscador
- Implementar nuevos idiomas
- Mejorar la accesibilidad

### Proceso

1. Fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-fuente-aena`
3. Commit con mensaje claro: `git commit -m "feat: añadir fetcher AENA"`
4. Pull Request describiendo el cambio

---

## Configuración para desarrollo

### Requisitos
- Node.js 20+
- Cuenta Supabase (gratis)
- Cuenta Vercel (gratis)

### Variables de entorno

```bash
# .env.local (web)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# .env (scripts)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

### Primeros pasos

```bash
# 1. Clonar
git clone https://github.com/licilibre/licilibre
cd licilibre

# 2. Base de datos
# Ir a supabase.com, crear proyecto, ejecutar migrations/001_initial.sql

# 3. Scripts de fetch (prueba manual)
cd scripts
npm install
node fetch-place.js --dry-run     # Ver qué traería sin guardar
node fetch-ted.js --dry-run

# 4. Web
cd web
npm install
npm run dev
# → http://localhost:3000
```

---

## API pública

licilibre expone una API REST pública sin autenticación:

```
GET /api/v1/licitaciones?q=audiovisual&ccaa=catalunya&limit=20
GET /api/v1/licitaciones/:id
GET /api/v1/estadisticas
GET /api/v1/fuentes
```

Ver documentación completa en `docs/API.md`.

---

## Licencia

**MIT** — Haz lo que quieras con esto. Si lo mejoras, comparte.

---

## Créditos

Proyecto iniciado por [David Delgado Pons](https://github.com/ldvdp) desde Lleida, Catalunya.

Datos públicos de: Ministerio de Hacienda (España) · Comisión Europea (TED) · PSCP Catalunya · y todos los organismos públicos que publican licitaciones.

---

*La información pública debe ser pública de verdad.*

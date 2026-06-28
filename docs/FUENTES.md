# Fuentes de datos de licilibre

Todas las fuentes son públicas y de acceso libre. Ningún dato de licilibre es de pago.

---

## Fuentes implementadas

### PLACE — Plataforma de Contratación del Sector Público
- **URL**: https://contrataciondelsectorpublico.gob.es
- **Open data**: https://www.hacienda.gob.es/GobiernoAbierto/Datos%20Abiertos/Paginas/LicitacionesContratante.aspx
- **Formato**: Atom XML (CODICE)
- **Actualización**: Diaria
- **Feed principal**: `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom`
- **Archivos históricos**: ZIP por año y mes en hacienda.gob.es
- **Cobertura**: Toda España (AGE + CCAA + Entidades Locales con perfil en PLACE)
- **Estado**: ✅ Implementado

### TED — Tenders Electronic Daily (UE)
- **URL**: https://ted.europa.eu
- **API**: https://api.ted.europa.eu/v3
- **Documentación**: https://docs.ted.europa.eu/api/latest/index.html
- **Formato**: JSON (API REST)
- **Actualización**: Diaria
- **Autenticación**: No requerida para búsquedas básicas
- **Cobertura**: Toda la UE (contratos +umbrales europeos)
- **Estado**: ✅ Implementado

### PSCP Catalunya — Plataforma de Serveis de Contractació Pública
- **URL**: https://contractaciopublica.cat
- **Formato**: Web scraping + API interna
- **Actualización**: Diaria
- **Cobertura**: Generalitat de Catalunya + Ajuntaments + Diputacions
- **Estado**: 🚧 En desarrollo

---

## Fuentes pendientes de implementar (PRs bienvenidos)

### RTVE
- **URL**: https://licitaciones.rtve.es
- **Formato**: Web (posiblemente ATOM feed disponible)
- **Prioridad**: Alta

### AENA
- **URL**: https://contratacion.aena.es/contratacion/principal?portal=licitaciones
- **Formato**: Web
- **Prioridad**: Media

### SEPE (Servicio Público de Empleo Estatal)
- **URL**: https://sede.sepe.gob.es/portalSede/es/licitaciones
- **Formato**: Web
- **Prioridad**: Media

### RED.ES
- **URL**: https://sede.red.gob.es/en/licitaciones
- **Formato**: Web
- **Prioridad**: Media

### IPYME (Instituto de la Pequeña y Mediana Empresa)
- **URL**: https://licitaciones.ipyme.org/Busqueda
- **Formato**: Web / posible API
- **Prioridad**: Alta (específico para PYMES)

### Plataforma PYME (Hacienda)
- **URL**: https://plataformapyme.es/es-es/herramientas-digitales/Paginas/buscador_licitaciones.aspx
- **Formato**: Web
- **Nota**: Consume de PLACE, puede ser redundante

### ONE (Observatorio Nacional de Estadística)
- **URL**: https://one.gob.es/es/contenidos/buscador-de-licitaciones
- **Formato**: Web
- **Prioridad**: Baja

### Plataformas autonómicas

| CCAA | URL | Formato | Estado |
|------|-----|---------|--------|
| Euskadi | https://www.contratacion.euskadi.eus | Web + feeds | Pendiente |
| Galicia | https://www.contratosdegalicia.es | Web | Pendiente |
| Andalucía | https://www.juntadeandalucia.es/hacienda/planificacion-y-presupuesto/contratacion | Web | Pendiente |
| Madrid | https://gestiona3.madrid.org/sipc_pub | Web | Pendiente |
| Valencia | https://contratacion.gva.es | Web | Pendiente |
| Aragón | https://contratacionsaludaragon.es | Web | Pendiente |
| Navarra | https://contratacionde.navarra.es | Web | Pendiente |

---

## Cómo añadir una nueva fuente

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para el proceso paso a paso.

El normalizador central (`scripts/normalize.js`) acepta cualquier fuente siempre que el objeto resultante cumpla el esquema definido en `supabase/migrations/001_initial.sql`.

---

## Política de robots.txt y uso responsable

- Siempre nos identificamos con `User-Agent: licilibre/1.0 (https://github.com/licilibre/licilibre)`
- Respetamos los `robots.txt` de cada plataforma
- Usamos delays entre requests para no sobrecargar los servidores
- En caso de que una plataforma pida que dejemos de acceder, lo respetamos

Si gestionas una plataforma de contratación y quieres que incluyamos tus datos o prefieres que no los agregemos, contacta abriendo un Issue en GitHub.

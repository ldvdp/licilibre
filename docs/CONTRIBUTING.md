# Cómo contribuir a licilibre

Gracias por querer contribuir. Este proyecto existe porque la información pública debe ser pública de verdad.

## Formas de contribuir

### Sin código

- **Reportar fuentes que faltan**: ¿Conoces una plataforma de licitaciones que no agregamos? Abre un [Issue](https://github.com/licilibre/licilibre/issues) con el enlace y el formato de los datos.
- **Mejorar traducciones**: Los ficheros de i18n están en `web/i18n/`. Puedes editar directamente en GitHub.
- **Reportar errores**: Si ves una licitación mal normalizada o con datos incorrectos, abre un Issue.
- **Difundir**: Comparte el proyecto con asociaciones de empresas, PYMES, autónomos y entidades públicas.

### Con código

#### Añadir una nueva fuente de datos

1. Crea `scripts/fetch-{nombre}.js` siguiendo el patrón de `fetch-place.js`
2. Añade el normalizador en `scripts/normalize.js` (función `normalize{Nombre}`)
3. Añade el job en `.github/workflows/daily-fetch.yml`
4. Documenta la fuente en `docs/FUENTES.md`

**Fuentes prioritarias que faltan:**
- RTVE (`licitaciones.rtve.es`) — ATOM feed disponible
- AENA (`contratacion.aena.es`)
- SEPE (`sede.sepe.gob.es`)
- RED.ES (`sede.red.gob.es`)
- Plataformas autonómicas de Euskadi, Galicia, Andalucía, Madrid

#### Mejorar el buscador

El buscador usa `tsvector` de PostgreSQL con la configuración `spanish`. Para mejorar:

- Añadir sinónimos de CPV en `normalize.js` → función `cpvToDescripcio`
- Mejorar la función `buscar_licitaciones` en la migración SQL
- Añadir búsqueda por código CPV directo

#### Mejorar la interfaz

El frontend es Next.js 14 con Tailwind CSS. Los componentes están en `web/components/`.

---

## Proceso de Pull Request

1. Fork → rama descriptiva (`feat/fetch-aena`, `fix/normalizador-ted`, `i18n/galego`)
2. Cambios pequeños y enfocados — un PR por tema
3. Descripción clara de qué hace el PR y por qué
4. Si añades una fuente nueva, incluye un `--dry-run` de muestra en la descripción

---

## Principios del proyecto

- **Los datos son de todos**: nunca añadiremos paywalls ni registros obligatorios para acceder
- **Calidad sobre cantidad**: mejor pocos datos bien normalizados que muchos inconsistentes
- **Transparencia total**: todo el código es público, incluidos los errores y limitaciones conocidas
- **Sostenibilidad**: el stack debe poder mantenerse con el free tier de los servicios

---

## Contacto

Abre un Issue o una discusión en GitHub. El proyecto es de la comunidad.

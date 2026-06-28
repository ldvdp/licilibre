# Guía de puesta en marcha de licilibre

**Tiempo estimado: 2-3 horas la primera vez. Después funciona solo.**

---

## Paso 1 — Crear la organización en GitHub

1. Ve a https://github.com/organizations/new
2. **Plan**: Free
3. **Organization account name**: `licilibre`
4. **Contact email**: tu email
5. Confirmar y crear

Luego crear el repositorio:
1. Ve a https://github.com/organizations/licilibre/repositories/new
2. **Repository name**: `licilibre`
3. **Visibility**: Public (es open source, debe ser público)
4. **NO** inicializar con README (ya tenemos los ficheros)
5. Crear repositorio

---

## Paso 2 — Subir el código

En tu ordenador (o pide a Claude que ejecute estos comandos):

```bash
# Descomprimir el archivo descargado
tar xzf licilibre-v0.1.tar.gz
cd licilibre

# Inicializar git
git init
git add .
git commit -m "feat: licilibre v0.1 — acceso libre a licitaciones públicas"

# Conectar con GitHub y subir
git remote add origin https://github.com/licilibre/licilibre.git
git branch -M main
git push -u origin main
```

✅ Ya está en GitHub. La gente puede ver el código, hacer fork y contribuir.

---

## Paso 3 — Crear el proyecto en Supabase

1. Ve a https://supabase.com → **New project**
2. **Organization**: tu cuenta personal o `licilibre`
3. **Project name**: `licilibre`
4. **Database Password**: guárdalo bien (no lo necesitarás a menudo)
5. **Region**: `West EU (Ireland)` — más cercano a España
6. Crear y esperar ~2 min

### Ejecutar las migraciones:

1. En el panel de Supabase: **SQL Editor** (icono de base de datos)
2. **New query**
3. Copiar y pegar el contenido de `supabase/migrations/001_initial.sql` → Run
4. Copiar y pegar el contenido de `supabase/migrations/002_auth_prep.sql` → Run

### Obtener las claves:

1. **Settings → API**
2. Copiar:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: la clave que empieza por `eyJ...` — es segura para el frontend
   - **service_role**: la clave secreta — SOLO para GitHub Actions, nunca en el frontend

---

## Paso 4 — Configurar los Secrets en GitHub

En el repo de GitHub: **Settings → Secrets and variables → Actions → New repository secret**

Añadir estos 3 secretos:

| Secret | Valor |
|--------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | La clave `service_role` de Supabase |
| `RESEND_API_KEY` | (ver Paso 5) |

### Variables del repositorio (no secretas):

**Settings → Secrets and variables → Actions → Variables → New repository variable**

| Variable | Valor |
|----------|-------|
| `FROM_EMAIL` | `alertes@licilibre.es` (o el dominio que tengas) |
| `SITE_URL` | `https://licilibre.es` (o la URL de Vercel de momento) |

---

## Paso 5 — Configurar el email de alertas (Resend)

Resend es la herramienta más sencilla para enviar emails. **Free tier: 3.000 emails/mes**.

1. Ve a https://resend.com → Signup gratuito
2. **API Keys → Create API Key** → nombre: `licilibre-prod`
3. Guardar la clave en el Secret `RESEND_API_KEY` de GitHub

Para enviar desde tu dominio (cuando lo tengas):
- Resend **Settings → Domains → Add domain** → seguir instrucciones DNS

---

## Paso 6 — Primera prueba del fetch (sin guardar nada)

En GitHub: **Actions → "Fetch diari de licitacions" → Run workflow**

Configuración:
- **fuente**: `place`
- **dry_run**: ✅ (marcado)

→ Tardará 1-2 minutos. En los logs verás las licitaciones que traería.

Si todo funciona bien, ejecutar SIN dry_run:
- **dry_run**: ❌ (desmarcado)

Esto pobla la base de datos con licitaciones reales de PLACE.

---

## Paso 7 — Desplegar el frontend en Vercel

1. Ve a https://vercel.com → **Add New → Project**
2. **Import Git Repository** → conectar tu GitHub → seleccionar `licilibre/licilibre`
3. **Root Directory**: `web` (¡importante! el frontend está en la subcarpeta web)
4. **Framework Preset**: Next.js (detectado automático)
5. **Environment Variables** — añadir:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave `anon public` de Supabase |

6. **Deploy** → esperar ~2 min

✅ El sitio estará en `https://licilibre-xxx.vercel.app`

---

## Paso 8 — Verificar que todo funciona

1. Abrir la URL de Vercel
2. Deberías ver el buscador con resultados reales
3. Probar búsqueda: "audiovisual", "fotografia"
4. Probar filtros: urgencia, fuente, CCAA
5. Abrir el detalle de una licitación
6. Crear una alerta de prueba con tu email

---

## Paso 9 — Dominio propio (opcional pero recomendado)

### Registrar el dominio:
- Verificar disponibilidad: https://www.nominalia.com o https://www.arsys.es
- Buscar: `licilibre.es` (10-15€/año)
- Si no está disponible: `licilibre.com`, `openlic.es`, `liciopen.es`

### Conectar con Vercel:
1. Vercel → tu proyecto → **Settings → Domains**
2. Añadir `licilibre.es`
3. Vercel te da los DNS records → copiarlos en tu registrador de dominio
4. En ~30 min el dominio funciona con HTTPS automático

---

## Paso 10 — El cron ya funciona solo

El GitHub Action está configurado para ejecutarse cada día a las 6:00 UTC.

Para verlo:
- **GitHub → Actions → Fetch diari** → verás los runs diarios

Recibirás un email de GitHub si algún run falla.

---

## Checklist de lanzamiento

- [ ] Código en GitHub (repo público)
- [ ] Supabase creado y migraciones ejecutadas
- [ ] GitHub Secrets configurados
- [ ] Primera prueba dry-run OK
- [ ] Primera carga real de datos OK
- [ ] Frontend desplegado en Vercel
- [ ] URL de Vercel funciona y muestra licitaciones reales
- [ ] Dominio registrado y conectado
- [ ] Email de alertas verificado con Resend
- [ ] Tweet anunciando el proyecto 🐦

---

## Cuando quieras añadir registro de usuarios

Todo está preparado en la migración 002. Cuando lo decidas:

1. Supabase Dashboard → **Authentication → Email Auth → Enable**
2. Añadir un botón "Inicia sesión" en el header
3. Crear `web/app/auth/login/page.tsx` con el formulario
4. Los perfiles y licitaciones guardadas ya tienen su tabla y RLS

Supabase gestiona passwords, sesiones, tokens y emails de confirmación. No hay que implementar nada de eso.

---

*licilibre — La información pública debe ser pública de verdad.*

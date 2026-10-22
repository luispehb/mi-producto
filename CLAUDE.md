# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## La app

1. Quién usa mi app: viajeros que están en una ciudad nueva y quieren conocer gente afín para hacer algo juntos. Entran con sesión iniciada. Además estás vos como admin, que ya tenés la tabla `admins` creada.
2. Qué registra (entidad principal): el Plan, o sea, algo concreto que un viajero propone hacer en una ciudad. Es la acción central que promete la landing: pasar de “hola” a un plan concreto en minutos.
3. Sus datos (3 a 5):
   * Ciudad, por ejemplo Lisboa
   * Qué hacer, en un título o descripción corta: “Atardecer y vinos en Alfama”
   * Fecha y hora
   * Energía: tranquilo, activo o fiestero (sale del match de tu landing)
   * Cupo, la cantidad de personas que busca sumar

   Además, en automático: `user_id` del creador y `created_at`.
4. Qué ve cada uno: el viajero ve y edita solo sus planes, en una sección “Mis planes”. El admin ve los planes de todos.
5. Qué quiero probar: si un viajero con sesión iniciada llega a crear un plan concreto, con ciudad, fecha y actividad, y no se queda en la lista de espera. También quiero ver qué ciudades y qué tipos de plan aparecen más, para decidir dónde lanzar primero.

## Reglas del proyecto

- Next.js con rutas de API. El navegador nunca habla con la base.
- La llave secreta solo se usa en las rutas del panel admin.
- El panel admin solo es para los emails de ADMIN_EMAILS.
- Las rutas de la app consultan la base con la llave pública y la sesión del usuario, siempre en el servidor, para que se aplique el RLS.
- Toda tabla nueva tiene RLS activo, con reglas en la misma migración.
- Los cambios en la base van como migración en supabase/migrations/ y los aplicas tú con la CLI de Supabase.
- No cambies el diseño sin que te lo pida.
- No hagas commits ni cargues datos de prueba sin que te lo pida.
- Es un prototipo: pagos e IA se simulan.

@AGENTS.md

## Producto

Hap: landing + lista de espera para una app que conecta viajeros afines en la ciudad donde están para armar planes juntos (el acceso es por invitación). El `README.md` guarda las notas de las pruebas con usuarios. Todo el contenido, la UI y los comentarios del código están en español rioplatense (voseo: "sumate", "probá"); mantené ese tono.

## Comandos

```bash
npm run dev          # Next.js en desarrollo (Turbopack)
npm run build        # build de producción; también detecta imports server-only en el cliente
npm run lint         # ESLint (eslint-config-next)
npx tsc --noEmit     # chequeo de tipos
```

No hay tests. La ruta del repo tiene espacios y acentos (iCloud Drive): poné siempre las rutas entre comillas en la shell.

## Arquitectura

Next.js 16 (App Router) + React 19 + Supabase (`@supabase/supabase-js` + `@supabase/ssr`). Alias `@/` → raíz del repo.

**Ojo:** `/api/signup`, `/api/feedback` y `/api/visit` son anteriores a las "Reglas del proyecto" y todavía usan la llave secreta, aunque no son rutas del panel admin. El código nuevo sigue las reglas.

**Supabase, todo desde el servidor** (`lib/supabase-server.ts`, con `server-only`):
- `supabaseUser()`: usa la llave publishable y la sesión del usuario guardada en cookies (`@supabase/ssr`), así que se aplica el RLS. Es el cliente de las rutas de la app.
- `supabaseAdmin()`: usa `SUPABASE_SECRET_KEY` y **saltea RLS**. Solo se usa en `/api/admin/*`, y la ruta tiene que validar y armar a mano cada campo que escribe.
- `getUser()`: valida la sesión con `auth.getUser()`. `isAdmin(email)` compara contra `ADMIN_EMAILS`. `safeNext()` limpia el `?next=` del login.

**Sesión y acceso:**
- `proxy.ts` (en Next 16 reemplaza a `middleware`) renueva las cookies de sesión en cada request. Sin sesión, `/planes/*` y `/admin/*` redirigen a `/login?next=…`; con sesión, `/login` y `/registro` mandan a `/planes`. Es solo el chequeo optimista: cada página y cada ruta vuelve a chequear con `getUser()`.
- Auth por API: `components/AuthForm.tsx` hace POST a `/api/auth/login` o `/api/auth/registro`, y `components/LogoutButton.tsx` a `/api/auth/logout`. Si el proyecto pide confirmar el email, el registro responde `{ confirm: true }` y el link vuelve a `app/auth/confirm/route.ts`. Recuperar contraseña: `/olvide` → `/api/auth/olvide` manda el email; el link pasa por `/auth/confirm?next=/nueva-clave`, que abre la sesión, y `/api/auth/nueva-clave` guarda la contraseña nueva. `/auth/confirm` acepta `token_hash` + `type` (`verifyOtp`, sirve en cualquier navegador; requiere la plantilla de email propia en Supabase) y `code` (PKCE, la plantilla por defecto; solo sirve en el navegador donde se pidió el link).
- Páginas de la app en el route group `app/(app)/` (`login`, `registro`, `olvide`, `nueva-clave`, `planes`); reusan `app/admin/admin.css`.
- Admin: `components/AdminGate.tsx` envuelve `/admin` y `/admin/metricas` (sin sesión redirige; si el email no está en `ADMIN_EMAILS`, muestra "Sin acceso"). Los datos salen de `/api/admin/data` y `/api/admin/metrics`, que vuelven a chequear con `requireAdmin()` (`lib/admin-auth.ts`). La tabla `admins` quedó sin uso.

**Planes (la entidad principal):**
- Tabla `plans` (migración `..._plans.sql`): RLS con las cuatro políticas por `auth.uid() = user_id`; `user_id` tiene `default auth.uid()`, pero la ruta igual lo manda.
- `lib/plans.ts` no importa nada de servidor: lo usan el formulario (client), la página y las rutas. `parsePlanInput()` valida y arma a mano cada campo con las mismas reglas que los `check` de la tabla; si cambiás una regla, cambiala en los dos lados.
- `starts_at` es `timestamp` **sin zona**: la hora local de la ciudad tal como la elige el viajero (`datetime-local`). En JS se trata como UTC y se formatea con `timeZone: "UTC"` para mostrarla igual; no la conviertas a la zona del navegador. "Ya pasó" usa un margen de un día (`yesterday()`) por las zonas horarias.
- `POST /api/planes` crea; `PATCH`/`DELETE /api/planes/[id]` usan `supabaseUser()` con `.select("id")`: si el RLS no devuelve filas (plan de otro o inexistente), responden 404.
- La skill `.claude/skills/nueva-entidad` replica este patrón para entidades nuevas (incluye `verificar-rls.sql` para probar con dos usuarios).
- Pendiente respecto de "La app": el panel admin todavía no muestra planes y `admin_metrics()` no cuenta ciudades ni tipos de plan.

**Flujos de datos de la landing:**
- Los formularios públicos (`SignupForm`, `FeedbackForm`, a través del hook `components/useFormSubmit.ts`) hacen POST a `app/api/signup` y `app/api/feedback`. El rol `anon` no tiene permiso de insert directo (lo cerró la migración `close_anon_inserts`). Un signup duplicado (`23505`) se responde como `{ duplicate: true }`, no como error.
- Las visitas: `VisitTracker` (client) → `POST /api/visit`, que pone una cookie httpOnly `hap_vid` con un uuid y hace upsert de una fila por visitante y día (UTC) en `landing_visits`. La tabla no tiene políticas: solo escribe el servidor.
- Visitas a la app: `/planes` y `/ciudad-actual` montan `<VisitTracker endpoint="/api/app-visit" />`; la ruta hace upsert con `supabaseUser()` de una fila por usuario y día (UTC) en `visits`, cuyo RLS solo deja insertar y leer las filas con `auth.uid() = user_id` (el select hace falta para el `on conflict`).
- Métricas (`/admin/metricas`): el RPC `admin_metrics()` (`security definer`, para leer `auth.users`) solo lo puede ejecutar `service_role`. Devuelve usuarios registrados, activación (crearon ≥1 plan), retorno (≥2 días en `visits`) y, por semana, usuarios nuevos y usuarios que entraron a la app. Las métricas de la lista de espera ya no se muestran.

**Base de datos:** el esquema vive solo en `supabase/migrations/*.sql` (el proyecto está vinculado con la Supabase CLI). Para cualquier cambio de esquema o permisos, creá una migración nueva con timestamp; no edites las ya aplicadas. Patrón que se viene usando: `enable row level security` + `revoke all ... from anon, authenticated` y después grants y políticas explícitas. Las métricas se calculan en SQL (`admin_metrics`), no en JS.

**Estilos:** CSS plano por sección (`app/landing.css`, `app/admin/admin.css`), sin Tailwind. Las Google Fonts se cargan con `<link>` en los layouts (URL en `lib/fonts.ts`) porque Turbopack descarta los `@import` remotos dentro del CSS.

`next.config.ts` mantiene redirects desde las URLs del sitio estático anterior (`/index.html`, `/admin.html`).

## Variables de entorno (`.env.local`)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (cliente), `SUPABASE_SECRET_KEY` (solo servidor) y `ADMIN_EMAILS` (emails separados por comas que entran al panel admin; también hay que cargarla en Vercel). Las demás variables del archivo vienen de la integración de Vercel y el código no las usa.

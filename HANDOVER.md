# Smarter Capture — handover

Last session: 2026-08-15 (evening). Project lives at `C:\Users\ADMIN\Desktop\camcue`
(folder name is still `camcue`; the product was renamed to **Smarter Capture**).

Run it: `npm run dev` → http://localhost:3000
Validate the camera data: `npm run validate`

---

## OPEN — do these next

### 1. Redesign again, in the style of insta360.com
The user's exact words: *"This also doesn't have a very camera feel to the site.
Wouldn't mind having a site this style — https://www.insta360.com/"*

The current design is a dark "camera chassis" look (near-black + bone + signal
orange, Archivo condensed uppercase, JetBrains Mono spec readouts). It reads as
premium gear, but **not** specifically like a camera brand's site.

What to study on insta360.com before rebuilding:
- Large full-bleed product/lifestyle imagery driving each section, not flat colour
- Big soft-cornered product cards on light backgrounds with generous whitespace
- Product-first hero: the camera itself is the hero image, huge, centred
- Smooth scroll-triggered reveals and hover states
- Rounded, friendly geometry rather than the hard technical edges used now
- Colour used sparingly against white/very light grey, with black type

Practical blocker: we have **no camera imagery** and must not hotlink or copy
manufacturer photos. Options to raise with the user:
  a) Buy/licence product shots, or use the user's own photos
  b) Commission/generate abstract camera-form illustrations (CSS/SVG)
  c) Keep type-and-colour-driven design but adopt Insta360's *layout* language
     (roundness, whitespace, big cards, light background, scroll reveals)
Ask which before rebuilding — this decides the whole direction.

### 2. Camera name truncation — FIXED and visually confirmed (2026-08-16)
The user reported names showing as "Osmo Acti…" / "HERO13 …".
Fixed in `app/globals.css`: `.camera-copy strong` no longer uses
`white-space: nowrap` + ellipsis (it wraps to two lines), and `.camera-grid`
minimum column width went 220px → 250px. **Verify this in the browser.**

### 3. Shipped — live at https://smartercapture.com
- Repo: https://github.com/exceldaily/SmarterCapture (public, branch `main`)
- Vercel project `smartercapture`, auto-deploys on push to `main`
- Domain registered at Cloudflare Registrar, DNS in Cloudflare with the **proxy
  off (grey cloud)** — the orange cloud stops Vercel issuing its certificate
- Apex 308-redirects to `www`
- Vercel flags "DNS Change Recommended" because the records use the legacy
  `76.76.21.21` / `cname.vercel-dns.com` pair. Harmless; newer per-project
  targets exist under "View DNS configuration" if the warning is worth clearing.

Deploy gotcha worth remembering: `/build` was gitignored as an output directory,
but `build/sites-vite-plugin.ts` is source that `vite.config.ts` imports, so
clean checkouts failed type-checking. Git will not descend into an excluded
directory, so the fix needs `/build/*` plus a negation, not `/build`.

### 5. Still unbuilt from the original brief
- Shot List Builder ("Going offshore fishing tomorrow" → full shoot plan)
- "Which of my cameras should I use?" ranking
- Per-camera pages (`/camera/[id]`) and shareable recipe URLs (`/recipe/[id]`)
- Admin interface for adding cameras/firmware without a rebuild
- Side-by-side comparison, community recipes, sample footage

---

## DONE this session

- **Redesign**: new design system in `app/globals.css` (~2,400 lines). Dark
  chassis, Archivo/Inter/JetBrains Mono, signal-orange accent, viewfinder corner
  brackets, perforated spec-ticket result card, dark "How it works" band, footer.
- **Cameras 9 → 49**: added Insta360 (6), Sony (12), Canon (6), Nikon (4),
  Fujifilm (5), Panasonic (6), plus GoPro HERO11. Category + brand filter rails
  added to the picker because the list outgrew a flat grid.
- **Accuracy work**:
  - `lib/camcue/data/cameras/README.md` documents the confidence standard
    (`verified` / `high` / `unverified`) and the no-guessing rules.
  - `scripts/validate.ts` runs the engine over every camera × scene × light
    combination (30,723) and asserts each recommendation is actually selectable.
    Currently **0 failures, 0 warnings**. Wired up as `npm run validate`.
  - Data provenance panel on the result view (source, sensor, review date,
    confidence chip, verify note).
- **Bugs fixed**:
  - Font variables were self-referential (`--font-display: var(--font-display)`),
    so every font silently fell back to system UI. next/font now exposes
    `--display-face` / `--sans-face` / `--mono-face`.
  - Cameras with a cropped high-FPS mode (Sony/Lumix/Canon 4K60) list the same
    resolution twice; the validator now checks the union of frame rates, and the
    crop note is surfaced to the user instead of hidden in the data.
  - GoPro Mission 1 carried invented specs ("GP-Log (assumed)"). Reduced to a
    placeholder flagged NOT VERIFIED — it must not be padded with guesses.
  - 33 camera `specialFeatures` pointed at scene IDs that do not exist
    (`travel`, `street`, `fish-strike`…), so those Camera Advantage callouts
    could never fire. Remapped to real scene IDs.
- **Rename**: CamCue → Smarter Capture, driven entirely from
  `lib/camcue/brand.ts` (name, wordmark, tagline, domain). One-line to change.

---

## Architecture notes

```
lib/camcue/
  brand.ts          product name / domain — single source of truth
  types.ts          CameraProfile + scenario + recommendation types
  engine.ts         deterministic engine: scenario → ideal profile →
                    capability fit → validated recommendation
  data/
    cameras/        one file per manufacturer + README with accuracy rules
    scenes.ts       57 scenes, each with shooting DNA + "don't mess this up"
    options.ts      light / movement / mount / platform choices
    recipes.ts      39 presets — stored as *scenario inputs*, not settings,
                    so they re-derive through the engine and stay valid
app/
  camcue-app.tsx    the whole UI (one client component, ~700 lines)
  globals.css       the design system
scripts/validate.ts capability validator
```

The engine rule that matters: it decides the *ideal* way to shoot first, then
fits that to the camera. It must never emit a mode the camera cannot select —
that is what `scripts/validate.ts` protects.


---

## 2026-08-15 evening — storefront shipped, fishing de-featured

- /gear storefront + admin + Stripe/webhook scaffolding (from the parallel
  session) reviewed, preserved, committed and deployed.
- Orders live in the shared **OrbitStack** Supabase project (ref
  pfagkivkytrvbkhsulvo), schema `smartercapture`, per the project's
  one-schema-per-app convention.
- Connection is a **direct Postgres pool** as role `smartercapture_app`
  (select/insert/update + execute only, no delete), via the IPv4 pooler
  aws-0-us-east-2.pooler.supabase.com:6543. No platform service key exists in
  this deployment; PostgREST does not expose the schema.
- **No accounts, on purpose**: Supabase Auth is project-wide, so logins here
  would share WanderBites' user pool. The site stays account-free.
- Admin Basic-auth credentials + DATABASE_URL are in `.env.local`
  (gitignored) and in Vercel production env (sensitive).
- Live-verified: /gear 200, admin 401 unauthenticated / 200 authenticated with
  "connection is ready, no paid orders", checkout 503 with Stripe unset,
  order function round-trip + idempotent replay tested against production and
  cleaned up (found+fixed a plpgsql ON CONFLICT/OUT-param collision).
- Fishing de-featured: motorcycle POV hero, neutral defaults/placeholders,
  8 fishing recipes removed (31 remain). The fishing scene itself remains.
- Still pending: Stripe keys (checkout stays gated), admin write controls,
  transactional email.

---

## 2026-08-16 — i18n v1 + multi-currency display

Seven locales: en, es, fr, de, pt, ja, th. Locale is client-side only
(localStorage key `sc-locale`, browser-language detection, fallback en); the
server always renders English and the client re-renders after hydration, so
there are no locale routes and no SEO change.

- `lib/i18n/index.ts` — Locale type, typed `Dictionary` interface (118 keys),
  `t()` with `{var}` interpolation, storage + detection helpers.
- `lib/i18n/dictionaries.ts` — hand-written translations, chrome strings only.
- `lib/i18n/currency.ts` — locale→currency (en USD, es/fr/de/pt EUR, ja JPY,
  th THB), static FX table (approx mid-Aug 2026), `formatPrice()`. Non-USD is
  always shown with a `≈` prefix plus the exact USD amount, because **USD is
  the only checkout currency** (Stripe Checkout handles buyer-local
  presentation on its own page).
- `app/locale-provider.tsx` — context via useSyncExternalStore; also exports
  `useT()` and a `<T k="..." />` leaf for server components.
- `app/language-switcher.tsx` — select showing each locale's own name; lives
  in the site header (hidden <700px), the gear header, and as a sixth
  mobile-nav tile.
- Wired into `app/camcue-app.tsx`, `app/gear/page.tsx`,
  `app/gear/gear-catalog.tsx`, `app/gear/[slug]/page.tsx` (price uses
  `app/gear/localized-price.tsx`).

**Deliberately still English in v1** (documented in `lib/i18n/index.ts`):
camera model names, setting VALUES (RockSteady, D-Log M, 4K, FPS), scene and
option names, and ALL engine-generated prose (why-it-works, warnings,
mistakes, what-if answers, on-camera menu paths). Machine-translating
settings advice risks accuracy, and camera menus are mostly English anyway.
Also untranslated: Learn cards, recipes/bag hero copy, provenance panel,
toasts, search placeholders, metadata titles, footer link columns.

Verified: `npx tsc --noEmit`, `npm run lint`, `npm run build`,
`npm run validate` all clean.

## 2026-08-17 — AI gateway shipped (commit 07bdd10)

The site is now an AI-native gateway as well as a website. One deterministic
engine (`lib/camcue/engine.ts`) now serves four surfaces: the UI, REST
`/api/v1`, the MCP server at `/mcp`, and markdown mirrors at `/md/*`.

- `lib/gateway/core.ts` — serializers, fuzzy resolvers, `runRecommendation()`.
  DATA_VERSION = engine version + max(lastVerified). All surfaces report it.
- `lib/gateway/http.ts` — envelopes, request ids, CORS, 16KB body cap,
  per-instance token-bucket rate limit (60/min/IP, honestly documented),
  agent classification + stdout JSON analytics (no IPs stored).
- REST: cameras / cameras/{slug} / scenarios / recommend / compare /
  accessories / health / version. OpenAPI 3.1 at /api/v1/openapi.json,
  discovery via RFC 9727 /.well-known/api-catalog. Success bodies return the
  resource directly; errors are `{error:{code,message,request_id}}`.
- MCP: mcp-handler 2.1.1. **API gotcha:** `server.registerTool(name, config,
  cb)` with `inputSchema: z.object(...)`, and `createMcpHandler(initFn,
  options)` — serverInfo goes INSIDE options; there is no third argument and
  no `server.tool()`.
- robots.txt: training crawlers (GPTBot, Google-Extended, CCBot, Bytespider)
  blocked — allowing them is an owner decision, not a default. Citation
  crawlers (OAI-SearchBot, PerplexityBot) allowed. llms.txt + sitemap live.
- /ai portal page renders its example request/response by calling the real
  engine at request time, so docs cannot drift from behavior.
- `npm run validate` now also fails if the OpenAPI spec and the route files
  on disk disagree, if the flagship fuzzy request ("DJI Osmo Action 6" +
  "fishing from a moving boat" + "bright tropical daylight") breaks, if
  output stops being deterministic, or if any camera/scene stops rendering
  to markdown.

Deferred deliberately (revisit when there's demand): WebMCP, Web Bot Auth /
HTTP Message Signatures, llms-full.txt, distributed rate limiting, API
keys/billing tiers (AgentIdentity stub ready in http.ts), MCP registry
publication, analytics dashboard (structured stdout logs exist).

Verified live on production: REST recommend, MCP initialize/tools/call
(same recommendation_id as REST), all discovery URLs 200.

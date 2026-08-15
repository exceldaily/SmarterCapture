# Smarter Capture — handover

Last session: 2026-08-15. Project lives at `C:\Users\ADMIN\Desktop\camcue`
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

### 2. Camera name truncation — FIXED, needs visual confirmation
The user reported names showing as "Osmo Acti…" / "HERO13 …".
Fixed in `app/globals.css`: `.camera-copy strong` no longer uses
`white-space: nowrap` + ellipsis (it wraps to two lines), and `.camera-grid`
minimum column width went 220px → 250px. **Verify this in the browser.**

### 3. Push to GitHub — approved but NOT done
The user approved pushing to the public repo `exceldaily/SmarterCapture`
(https://github.com/exceldaily/SmarterCapture, empty, default branch `main`).
Nothing has been pushed yet. The local git repo has 3 commits from earlier work
and the current changes are uncommitted.

### 4. Deploy
Domain purchased: **smartercapture.com**. Not yet connected.
The old plan (deploy under the Vercel `showcase` project at testswebsite.uk) is
superseded by the dedicated repo + domain.

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

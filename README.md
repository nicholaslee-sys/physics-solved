# Physics Solved

One shared, data-driven, CDN-hosted front-end bundle for **physicssolved.com**
(Squarespace 7.1). It replaces the giant hand-copied code blocks with a small set
of vanilla-JS components that mount onto `[data-ps-app]` elements and render from
JSON. **Add courses, sheets, questions, and projects by editing JSON — never JS.**

- No frameworks, no runtime dependencies. Vanilla ES2020.
- Every CSS selector is scoped under `.ps-*` — nothing leaks into your theme.
- WCAG AA contrast, keyboard support, `prefers-reduced-motion`, print styles.
- One design system: one button set, one card, one pill/tab, one token file.

---

## Repo layout

```
physics-solved/
  src/css/     tokens.css · components.css · print.css
  src/js/      core.js · grading-adapter.js · components/*.js
  data/        registry.json · equations/*.json · sheets/*.json · frq/physics.json · portfolio.json
  dist/        physics-solved.min.css · physics-solved.min.js   (build output)
  squarespace/ paste-ready snippets, one per site section
  scripts/     build.mjs
  worker/      README.md — future grading-proxy contract (not implemented)
  demo/        index.html — mounts every component locally
```

## How it works

1. The **header injection** loads `dist/physics-solved.min.css` + `.min.js` on every page.
2. `core.js` captures its own `<script>` tag, derives the **CDN base URL** from
   its `src` (e.g. `…/physics-solved@v1/`), and fetches data from `…/data/…`.
   Override the base with a `data-ps-base` attribute on the script tag.
3. On `DOMContentLoaded` it scans for `[data-ps-app="…"]` elements and renders
   the matching component, fetching the JSON that component needs.

`registry.json` is the **single source of truth**: the course carousel, the
formula-library tabs, and the FRQ filters all render from it, so they can never
disagree again.

---

## Editing content (the common case)

| You want to… | Edit this file |
| --- | --- |
| Add/rename a course, flip live ↔ coming-soon, change a carousel card | `data/registry.json` |
| Add a formula sheet or tab | add the sheet file under `data/sheets/` **and** list it in the course's `sheets:[]` in `registry.json` |
| Change equation-finder units/variables | `data/equations/<course>.json` |
| Add/replace FRQs | `data/frq/physics.json` (`courseId` must match a registry course id) |
| Edit portfolio projects | `data/portfolio.json` |

Commit the JSON, bump the release tag (below), and the site updates. No build is
needed for data-only changes **if** you point Squarespace at a moving tag — but
the recommended flow pins a version, so re-tag to publish (see Updating).

`status:"coming-soon"` renders a non-clickable card with a badge. Course `accent`
colors drive badge styling everywhere; keep them dark enough for AA text on white.

> **Placeholders:** the equation/sheet files contain standard-curriculum physics
> for the topics described, with clearly-labeled `PLACEHOLDER` units/rows where
> the exact syllabus content wasn't supplied. The 10 FRQs are correct **sample**
> problems (see the `_note` in `data/frq/physics.json`) — replace their text with
> your own. Nothing physics-related is invented and passed off as final.

---

## Build

**`dist/` is already built and committed** — you only need to rebuild after
editing files in `src/`. Data-only changes (the common case) never need a build.

```bash
node scripts/build.mjs
```

Writes `dist/physics-solved.min.css` and `dist/physics-solved.min.js`.

- If **esbuild** is installed (`npm i -D esbuild`), the bundles are truly minified.
- If not, the script safely concatenates the sources (still valid, just larger)
  and tells you so. Either way the output works.
- No Node installed? The committed `dist/` files are the concat output already, so
  you can edit data and deploy without ever building. Install Node only if you
  change `src/` and want to regenerate the bundle.

---

## Preview locally before touching Squarespace

The demo fetches JSON, so it needs an HTTP server (opening `file://` blocks fetch).
Use whichever you have:

```powershell
# Windows, no Node/Python needed — uses the bundled PowerShell server:
powershell -ExecutionPolicy Bypass -File scripts\serve.ps1
# then open http://localhost:8123/
```

```bash
# or, if you have Node or Python, from the physics-solved/ folder:
npx serve .
python -m http.server 8000
```

Then open the URL the server prints (the PowerShell server maps `/` to the demo
page). You should see all six components render: both carousels, the formula
library, FRQ practice, the equation finder, the kinematics simulator, and the
portfolio. This exact setup was used to verify the build.

---

## Deploy to jsDelivr

1. **Create a GitHub repo** named `physics-solved` (public) and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Physics Solved bundle"
   git branch -M main
   git remote add origin https://github.com/nicholaslee-sys/physics-solved.git
   git push -u origin main
   ```
2. **Tag a release** so the CDN URL is pinned and cached:
   ```bash
   git tag v1
   git push origin v1
   ```
3. Your CDN URLs (jsDelivr serves straight from the GitHub tag):
   ```
   https://cdn.jsdelivr.net/gh/nicholaslee-sys/physics-solved@v1/dist/physics-solved.min.css
   https://cdn.jsdelivr.net/gh/nicholaslee-sys/physics-solved@v1/dist/physics-solved.min.js
   ```
   Data files resolve automatically from the same base, e.g.
   `…/physics-solved@v1/data/registry.json`.

Username already set to `nicholaslee-sys` in `squarespace/site-header-injection.html`.

### Updating later
Commit changes, then move the tag to the new commit and push it:
```bash
git tag -f v1 && git push -f origin v1
```
jsDelivr caches tags aggressively (up to ~24h). To force an instant refresh, purge
the file at `https://purge.jsdelivr.net/gh/nicholaslee-sys/physics-solved@v1/dist/physics-solved.min.js`
(and the CSS), or publish a new tag like `v1.1` and update the header URLs.

---

## Which snippet goes where

Paste each file in `squarespace/` into a **Code block** on the matching page
(Squarespace: edit the page → add a Code block → paste). The header injection is
the exception — it goes in site settings.

| Snippet | Where it goes |
| --- | --- |
| `site-header-injection.html` | **Settings → Advanced → Code Injection → Header** (loads the bundle site-wide) |
| `home-carousels.html` | Home page, "Choose your course" section |
| `home-formula-library.html` | Home page, "Formula Sheet Library" section |
| `home-frq.html` | Home page, "FRQ Practice" section |
| `equation-finder.html` | Each course page — **set `data-course`** per the comment in the file (`ap-physics-1`, `ap-physics-2`, `ap-physics-c`, `ib-physics`, `college-physics`) |
| `ap1-simulator.html` | `/ap-physics-1` page, "Kinematics Simulator" section |
| `portfolio.html` | Your portfolio page |

Every snippet is ≤ 15 lines and wraps its content in `.ps-root`.

---

## Manual Squarespace settings (you must do these yourself)

The bundle can't change theme settings — do these in the Squarespace editor:

1. **Site title → "Physics Solved"** — Settings → General / Site title, and in
   the header/logo area.
2. **Navigation** — add nav links so `College Physics` and `IB Physics` are
   reachable (their pages already exist). The old carousel wrongly marked them
   "Coming Soon"; the registry now lists them `live`.
3. **Remove the old code blocks** — delete every hand-copied Equation Finder /
   Formula Library / FRQ / Simulator block; the new snippets replace them.
4. **Remove empty spacer sections** and reduce **section padding** (the old
   layout had large dead vertical space). Set top/bottom section padding to a
   small value so the components sit close together.
5. **Delete the broken API call** — the old FRQ block called the Anthropic API
   from the browser; that's removed here. Nothing to configure.

---

## Grading (removed, but pluggable)

There are **no** direct AI/API calls. FRQ runs in self-check mode. To add AI
feedback later via a serverless proxy, see [`worker/README.md`](worker/README.md)
— set `PS.grading.provider = { endpoint }` and nothing else changes.

## Accessibility & responsiveness

- Breakpoints at ≤640 / ≤960 / >960. Formula sheets 3→2→1 columns; FRQ two-pane
  stacks and the question list collapses to a dropdown on mobile; equation-finder
  variable grid 3→2→1.
- Tablist/tab semantics with arrow-key navigation, labeled inputs, visible focus
  rings, `aria-live` on the FRQ viewer, and full `prefers-reduced-motion` support.

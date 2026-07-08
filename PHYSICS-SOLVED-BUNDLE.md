# physics-solved — single-file bundle

This one file contains EVERY file in the physics-solved repository, concatenated.

## How to implement
Create a folder named `physics-solved/`. For each block delimited by
`===== FILE: <path> =====` and `===== END FILE =====`, create a file at that exact
relative path, containing exactly the lines between the two markers. Recreate the
folders as needed. Then follow README.md to deploy: push to GitHub, tag `v1`, serve
`dist/*.min.{css,js}` via jsDelivr, and paste the `squarespace/*.html` snippets into
the matching Squarespace code blocks.

Notes:
- `dist/` is pre-built (concatenated), so NO build step is required for data-only edits.
- Vanilla JS, zero runtime dependencies. Content is edited via JSON in `data/`, never JS.
- Replace `USER` with the GitHub username in `squarespace/site-header-injection.html`.

----

===== FILE: README.md =====
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
   git remote add origin https://github.com/USER/physics-solved.git
   git push -u origin main
   ```
2. **Tag a release** so the CDN URL is pinned and cached:
   ```bash
   git tag v1
   git push origin v1
   ```
3. Your CDN URLs (jsDelivr serves straight from the GitHub tag):
   ```
   https://cdn.jsdelivr.net/gh/USER/physics-solved@v1/dist/physics-solved.min.css
   https://cdn.jsdelivr.net/gh/USER/physics-solved@v1/dist/physics-solved.min.js
   ```
   Data files resolve automatically from the same base, e.g.
   `…/physics-solved@v1/data/registry.json`.

**Replace `USER`** with your GitHub username in `squarespace/site-header-injection.html`.

### Updating later
Commit changes, then move the tag to the new commit and push it:
```bash
git tag -f v1 && git push -f origin v1
```
jsDelivr caches tags aggressively (up to ~24h). To force an instant refresh, purge
the file at `https://purge.jsdelivr.net/gh/USER/physics-solved@v1/dist/physics-solved.min.js`
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

===== END FILE =====

===== FILE: data/equations/ap-physics-1.json =====
{
  "course": "ap-physics-1",
  "note": "Standard AP Physics 1 curriculum equations. Verify unit groupings and symbols against your syllabus, then edit freely — no JS changes needed.",
  "units": [
    {
      "title": "Unit 1 — Kinematics",
      "variables": [
        { "sym": "x", "name": "position" },
        { "sym": "x₀", "name": "initial position" },
        { "sym": "Δx", "name": "displacement" },
        { "sym": "v", "name": "final velocity" },
        { "sym": "v₀", "name": "initial velocity" },
        { "sym": "a", "name": "acceleration" },
        { "sym": "t", "name": "time" },
        { "sym": "g", "name": "free-fall acceleration", "note": "9.8 m/s² near Earth's surface" }
      ],
      "equations": [
        { "name": "Velocity (no position)", "expr": "v = v₀ + a·t", "uses": ["v", "v₀", "a", "t"] },
        { "name": "Position (no final velocity)", "expr": "Δx = v₀·t + ½·a·t²", "uses": ["Δx", "v₀", "t", "a"] },
        { "name": "Velocity (no time)", "expr": "v² = v₀² + 2·a·Δx", "uses": ["v", "v₀", "a", "Δx"] },
        { "name": "Displacement (average velocity)", "expr": "Δx = ½·(v₀ + v)·t", "uses": ["Δx", "v₀", "v", "t"] },
        { "name": "Position from displacement", "expr": "x = x₀ + Δx", "uses": ["x", "x₀", "Δx"] }
      ]
    },
    {
      "title": "Unit 2 — Dynamics (Forces)",
      "variables": [
        { "sym": "Fₙₑₜ", "name": "net force" },
        { "sym": "F", "name": "force" },
        { "sym": "m", "name": "mass" },
        { "sym": "a", "name": "acceleration" },
        { "sym": "g", "name": "free-fall acceleration" },
        { "sym": "F_g", "name": "weight (gravitational force)" },
        { "sym": "F_f", "name": "friction force" },
        { "sym": "μ", "name": "coefficient of friction" },
        { "sym": "N", "name": "normal force" }
      ],
      "equations": [
        { "name": "Newton's second law", "expr": "F_net = m·a", "uses": ["Fₙₑₜ", "m", "a"] },
        { "name": "Weight", "expr": "F_g = m·g", "uses": ["F_g", "m", "g"] },
        { "name": "Friction (max)", "expr": "F_f ≤ μ·N", "uses": ["F_f", "μ", "N"] }
      ]
    },
    {
      "title": "Unit 3 — Circular Motion & Gravitation",
      "variables": [
        { "sym": "a_c", "name": "centripetal acceleration" },
        { "sym": "F_c", "name": "centripetal force" },
        { "sym": "v", "name": "speed" },
        { "sym": "r", "name": "radius" },
        { "sym": "T", "name": "period" },
        { "sym": "m", "name": "mass" },
        { "sym": "M", "name": "central mass" },
        { "sym": "G", "name": "gravitational constant", "note": "6.67×10⁻¹¹ N·m²/kg²" }
      ],
      "equations": [
        { "name": "Centripetal acceleration", "expr": "a_c = v² / r", "uses": ["a_c", "v", "r"] },
        { "name": "Centripetal force", "expr": "F_c = m·v² / r", "uses": ["F_c", "m", "v", "r"] },
        { "name": "Speed from period", "expr": "v = 2π·r / T", "uses": ["v", "r", "T"] },
        { "name": "Newton's law of gravitation", "expr": "F_g = G·M·m / r²", "uses": ["G", "M", "m", "r"] }
      ]
    },
    {
      "title": "Unit 4 — Energy",
      "variables": [
        { "sym": "W", "name": "work" },
        { "sym": "F", "name": "force" },
        { "sym": "d", "name": "displacement" },
        { "sym": "θ", "name": "angle between F and d" },
        { "sym": "K", "name": "kinetic energy" },
        { "sym": "m", "name": "mass" },
        { "sym": "v", "name": "speed" },
        { "sym": "U_g", "name": "gravitational potential energy" },
        { "sym": "g", "name": "free-fall acceleration" },
        { "sym": "h", "name": "height" },
        { "sym": "U_s", "name": "elastic potential energy" },
        { "sym": "k", "name": "spring constant" },
        { "sym": "x", "name": "spring displacement" },
        { "sym": "P", "name": "power" },
        { "sym": "t", "name": "time" }
      ],
      "equations": [
        { "name": "Work", "expr": "W = F·d·cos θ", "uses": ["W", "F", "d", "θ"] },
        { "name": "Kinetic energy", "expr": "K = ½·m·v²", "uses": ["K", "m", "v"] },
        { "name": "Gravitational PE", "expr": "U_g = m·g·h", "uses": ["U_g", "m", "g", "h"] },
        { "name": "Elastic PE", "expr": "U_s = ½·k·x²", "uses": ["U_s", "k", "x"] },
        { "name": "Average power", "expr": "P = W / t", "uses": ["P", "W", "t"] }
      ]
    },
    {
      "title": "Unit 5 — Momentum",
      "variables": [
        { "sym": "p", "name": "momentum" },
        { "sym": "m", "name": "mass" },
        { "sym": "v", "name": "velocity" },
        { "sym": "J", "name": "impulse" },
        { "sym": "F", "name": "force" },
        { "sym": "Δt", "name": "time interval" },
        { "sym": "Δp", "name": "change in momentum" }
      ],
      "equations": [
        { "name": "Momentum", "expr": "p = m·v", "uses": ["p", "m", "v"] },
        { "name": "Impulse–momentum theorem", "expr": "J = F·Δt = Δp", "uses": ["J", "F", "Δt", "Δp"] }
      ]
    },
    {
      "title": "Unit 6 — Rotation",
      "variables": [
        { "sym": "τ", "name": "torque" },
        { "sym": "r", "name": "lever arm / radius" },
        { "sym": "F", "name": "force" },
        { "sym": "θ", "name": "angle between r and F" },
        { "sym": "I", "name": "moment of inertia" },
        { "sym": "α", "name": "angular acceleration" },
        { "sym": "ω", "name": "angular velocity" },
        { "sym": "ω₀", "name": "initial angular velocity" },
        { "sym": "t", "name": "time" },
        { "sym": "L", "name": "angular momentum" }
      ],
      "equations": [
        { "name": "Torque", "expr": "τ = r·F·sin θ", "uses": ["τ", "r", "F", "θ"] },
        { "name": "Rotational Newton's 2nd law", "expr": "τ_net = I·α", "uses": ["τ", "I", "α"] },
        { "name": "Angular velocity", "expr": "ω = ω₀ + α·t", "uses": ["ω", "ω₀", "α", "t"] },
        { "name": "Angular momentum", "expr": "L = I·ω", "uses": ["L", "I", "ω"] }
      ]
    },
    {
      "title": "Unit 7 — Simple Harmonic Motion",
      "variables": [
        { "sym": "T", "name": "period" },
        { "sym": "f", "name": "frequency" },
        { "sym": "m", "name": "mass" },
        { "sym": "k", "name": "spring constant" },
        { "sym": "L", "name": "pendulum length" },
        { "sym": "g", "name": "free-fall acceleration" }
      ],
      "equations": [
        { "name": "Period of a spring", "expr": "T = 2π·√(m / k)", "uses": ["T", "m", "k"] },
        { "name": "Period of a pendulum", "expr": "T = 2π·√(L / g)", "uses": ["T", "L", "g"] },
        { "name": "Period–frequency", "expr": "T = 1 / f", "uses": ["T", "f"] }
      ]
    },
    {
      "title": "Unit 8 — Waves & Sound",
      "variables": [
        { "sym": "v", "name": "wave speed" },
        { "sym": "f", "name": "frequency" },
        { "sym": "λ", "name": "wavelength" },
        { "sym": "T", "name": "period" }
      ],
      "equations": [
        { "name": "Wave speed", "expr": "v = f·λ", "uses": ["v", "f", "λ"] },
        { "name": "Frequency–period", "expr": "f = 1 / T", "uses": ["f", "T"] }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/equations/ap-physics-2.json =====
{
  "course": "ap-physics-2",
  "note": "Standard AP Physics 2 curriculum equations. The unit list below covers Fluids, Thermodynamics, and Electrostatics as real content; add the remaining units (Circuits, Magnetism, Optics, Modern) by copying the pattern.",
  "units": [
    {
      "title": "Unit 1 — Fluids",
      "variables": [
        { "sym": "ρ", "name": "density" },
        { "sym": "m", "name": "mass" },
        { "sym": "V", "name": "volume" },
        { "sym": "P", "name": "pressure" },
        { "sym": "P₀", "name": "surface pressure" },
        { "sym": "F", "name": "force" },
        { "sym": "A", "name": "area" },
        { "sym": "g", "name": "free-fall acceleration" },
        { "sym": "h", "name": "depth" },
        { "sym": "F_b", "name": "buoyant force" },
        { "sym": "v", "name": "flow speed" }
      ],
      "equations": [
        { "name": "Density", "expr": "ρ = m / V", "uses": ["ρ", "m", "V"] },
        { "name": "Pressure", "expr": "P = F / A", "uses": ["P", "F", "A"] },
        { "name": "Pressure with depth", "expr": "P = P₀ + ρ·g·h", "uses": ["P", "P₀", "ρ", "g", "h"] },
        { "name": "Buoyant force (Archimedes)", "expr": "F_b = ρ·V·g", "uses": ["F_b", "ρ", "V", "g"] },
        { "name": "Continuity equation", "expr": "A₁·v₁ = A₂·v₂", "uses": ["A", "v"] }
      ]
    },
    {
      "title": "Unit 2 — Thermodynamics",
      "variables": [
        { "sym": "P", "name": "pressure" },
        { "sym": "V", "name": "volume" },
        { "sym": "n", "name": "moles" },
        { "sym": "R", "name": "gas constant", "note": "8.31 J/(mol·K)" },
        { "sym": "T", "name": "temperature (K)" },
        { "sym": "Q", "name": "heat" },
        { "sym": "m", "name": "mass" },
        { "sym": "c", "name": "specific heat" },
        { "sym": "ΔT", "name": "temperature change" },
        { "sym": "ΔU", "name": "change in internal energy" },
        { "sym": "W", "name": "work done on gas" }
      ],
      "equations": [
        { "name": "Ideal gas law", "expr": "P·V = n·R·T", "uses": ["P", "V", "n", "R", "T"] },
        { "name": "Heat and temperature change", "expr": "Q = m·c·ΔT", "uses": ["Q", "m", "c", "ΔT"] },
        { "name": "First law of thermodynamics", "expr": "ΔU = Q + W", "uses": ["ΔU", "Q", "W"] }
      ]
    },
    {
      "title": "Unit 3 — Electrostatics",
      "variables": [
        { "sym": "F_E", "name": "electric force" },
        { "sym": "k", "name": "Coulomb constant", "note": "8.99×10⁹ N·m²/C²" },
        { "sym": "q₁", "name": "charge 1" },
        { "sym": "q₂", "name": "charge 2" },
        { "sym": "r", "name": "separation" },
        { "sym": "E", "name": "electric field" },
        { "sym": "q", "name": "test charge" },
        { "sym": "U_E", "name": "electric potential energy" },
        { "sym": "V", "name": "electric potential" }
      ],
      "equations": [
        { "name": "Coulomb's law", "expr": "F_E = k·q₁·q₂ / r²", "uses": ["F_E", "k", "q₁", "q₂", "r"] },
        { "name": "Electric field from force", "expr": "E = F_E / q", "uses": ["E", "F_E", "q"] },
        { "name": "Field of a point charge", "expr": "E = k·q / r²", "uses": ["E", "k", "q", "r"] },
        { "name": "Potential of a point charge", "expr": "V = k·q / r", "uses": ["V", "k", "q", "r"] }
      ]
    },
    {
      "title": "Unit 4 — More units (PLACEHOLDER — replace with your content)",
      "variables": [
        { "sym": "?", "name": "Add Circuits, Magnetism, Geometric & Physical Optics, and Modern Physics variables here." }
      ],
      "equations": [
        { "name": "Placeholder", "expr": "Copy the structure of the units above.", "uses": ["?"] }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/equations/ap-physics-c.json =====
{
  "course": "ap-physics-c",
  "note": "Standard AP Physics C (calculus-based) equations. Mechanics and E&M starter units are real; add remaining units by copying the pattern.",
  "units": [
    {
      "title": "Mechanics 1 — Kinematics (calculus)",
      "variables": [
        { "sym": "x", "name": "position" },
        { "sym": "v", "name": "velocity" },
        { "sym": "a", "name": "acceleration" },
        { "sym": "t", "name": "time" },
        { "sym": "v₀", "name": "initial velocity" },
        { "sym": "x₀", "name": "initial position" }
      ],
      "equations": [
        { "name": "Velocity as a derivative", "expr": "v = dx/dt", "uses": ["v", "x", "t"] },
        { "name": "Acceleration as a derivative", "expr": "a = dv/dt", "uses": ["a", "v", "t"] },
        { "name": "Velocity (constant a)", "expr": "v = v₀ + a·t", "uses": ["v", "v₀", "a", "t"] },
        { "name": "Position (constant a)", "expr": "x = x₀ + v₀·t + ½·a·t²", "uses": ["x", "x₀", "v₀", "t", "a"] }
      ]
    },
    {
      "title": "Mechanics 2 — Work, Energy & Power",
      "variables": [
        { "sym": "W", "name": "work" },
        { "sym": "F", "name": "force" },
        { "sym": "x", "name": "displacement" },
        { "sym": "K", "name": "kinetic energy" },
        { "sym": "m", "name": "mass" },
        { "sym": "v", "name": "speed" },
        { "sym": "P", "name": "power" },
        { "sym": "t", "name": "time" }
      ],
      "equations": [
        { "name": "Work (variable force)", "expr": "W = ∫ F · dx", "uses": ["W", "F", "x"] },
        { "name": "Kinetic energy", "expr": "K = ½·m·v²", "uses": ["K", "m", "v"] },
        { "name": "Instantaneous power", "expr": "P = dW/dt = F·v", "uses": ["P", "W", "t", "F", "v"] }
      ]
    },
    {
      "title": "E&M 1 — Electrostatics",
      "variables": [
        { "sym": "F_E", "name": "electric force" },
        { "sym": "k", "name": "Coulomb constant" },
        { "sym": "q₁", "name": "charge 1" },
        { "sym": "q₂", "name": "charge 2" },
        { "sym": "r", "name": "separation" },
        { "sym": "E", "name": "electric field" },
        { "sym": "Φ_E", "name": "electric flux" },
        { "sym": "A", "name": "area" },
        { "sym": "Q", "name": "enclosed charge" },
        { "sym": "ε₀", "name": "permittivity of free space" }
      ],
      "equations": [
        { "name": "Coulomb's law", "expr": "F_E = k·q₁·q₂ / r²", "uses": ["F_E", "k", "q₁", "q₂", "r"] },
        { "name": "Electric flux", "expr": "Φ_E = ∮ E · dA", "uses": ["Φ_E", "E", "A"] },
        { "name": "Gauss's law", "expr": "∮ E · dA = Q / ε₀", "uses": ["E", "A", "Q", "ε₀"] }
      ]
    },
    {
      "title": "More units (PLACEHOLDER — replace with your content)",
      "variables": [
        { "sym": "?", "name": "Add Systems of Particles/Momentum, Rotation, Oscillations, Gravitation, Conductors/Capacitors, Circuits, Magnetism, and Electromagnetism." }
      ],
      "equations": [
        { "name": "Placeholder", "expr": "Copy the structure of the units above.", "uses": ["?"] }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/equations/college-physics.json =====
{
  "course": "college-physics",
  "note": "Standard introductory algebra-based college physics equations. Mechanics and E&M starter units are real; expand as needed.",
  "units": [
    {
      "title": "Mechanics — Kinematics",
      "variables": [
        { "sym": "x", "name": "position" },
        { "sym": "x₀", "name": "initial position" },
        { "sym": "v", "name": "final velocity" },
        { "sym": "v₀", "name": "initial velocity" },
        { "sym": "a", "name": "acceleration" },
        { "sym": "t", "name": "time" }
      ],
      "equations": [
        { "name": "Velocity", "expr": "v = v₀ + a·t", "uses": ["v", "v₀", "a", "t"] },
        { "name": "Position", "expr": "x = x₀ + v₀·t + ½·a·t²", "uses": ["x", "x₀", "v₀", "t", "a"] },
        { "name": "Velocity² (no time)", "expr": "v² = v₀² + 2·a·(x − x₀)", "uses": ["v", "v₀", "a", "x", "x₀"] }
      ]
    },
    {
      "title": "Mechanics — Forces & Energy",
      "variables": [
        { "sym": "F", "name": "force" },
        { "sym": "m", "name": "mass" },
        { "sym": "a", "name": "acceleration" },
        { "sym": "W", "name": "work" },
        { "sym": "d", "name": "displacement" },
        { "sym": "θ", "name": "angle between F and d" },
        { "sym": "K", "name": "kinetic energy" },
        { "sym": "v", "name": "speed" }
      ],
      "equations": [
        { "name": "Newton's second law", "expr": "F = m·a", "uses": ["F", "m", "a"] },
        { "name": "Work", "expr": "W = F·d·cos θ", "uses": ["W", "F", "d", "θ"] },
        { "name": "Kinetic energy", "expr": "K = ½·m·v²", "uses": ["K", "m", "v"] }
      ]
    },
    {
      "title": "E&M — Electrostatics & Circuits",
      "variables": [
        { "sym": "F", "name": "electric force" },
        { "sym": "k", "name": "Coulomb constant" },
        { "sym": "q₁", "name": "charge 1" },
        { "sym": "q₂", "name": "charge 2" },
        { "sym": "r", "name": "separation" },
        { "sym": "V", "name": "voltage" },
        { "sym": "I", "name": "current" },
        { "sym": "R", "name": "resistance" },
        { "sym": "P", "name": "power" }
      ],
      "equations": [
        { "name": "Coulomb's law", "expr": "F = k·q₁·q₂ / r²", "uses": ["F", "k", "q₁", "q₂", "r"] },
        { "name": "Ohm's law", "expr": "V = I·R", "uses": ["V", "I", "R"] },
        { "name": "Electric power", "expr": "P = I·V", "uses": ["P", "I", "V"] }
      ]
    },
    {
      "title": "More units (PLACEHOLDER — replace with your content)",
      "variables": [
        { "sym": "?", "name": "Add Momentum, Rotation, Fluids, Thermodynamics, Waves, Magnetism, and Optics." }
      ],
      "equations": [
        { "name": "Placeholder", "expr": "Copy the structure of the units above.", "uses": ["?"] }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/equations/ib-physics.json =====
{
  "course": "ib-physics",
  "note": "Standard IB Physics equations (SL + HL). Starter units are real; expand with the remaining IB topics by copying the pattern.",
  "units": [
    {
      "title": "Topic — Mechanics",
      "variables": [
        { "sym": "s", "name": "displacement" },
        { "sym": "u", "name": "initial velocity" },
        { "sym": "v", "name": "final velocity" },
        { "sym": "a", "name": "acceleration" },
        { "sym": "t", "name": "time" },
        { "sym": "F", "name": "force" },
        { "sym": "m", "name": "mass" },
        { "sym": "p", "name": "momentum" }
      ],
      "equations": [
        { "name": "Velocity (suvat)", "expr": "v = u + a·t", "uses": ["v", "u", "a", "t"] },
        { "name": "Displacement (suvat)", "expr": "s = u·t + ½·a·t²", "uses": ["s", "u", "t", "a"] },
        { "name": "Velocity² (suvat)", "expr": "v² = u² + 2·a·s", "uses": ["v", "u", "a", "s"] },
        { "name": "Newton's second law", "expr": "F = m·a", "uses": ["F", "m", "a"] },
        { "name": "Momentum", "expr": "p = m·v", "uses": ["p", "m", "v"] }
      ]
    },
    {
      "title": "Topic — Thermal Physics",
      "variables": [
        { "sym": "Q", "name": "thermal energy" },
        { "sym": "m", "name": "mass" },
        { "sym": "c", "name": "specific heat capacity" },
        { "sym": "ΔT", "name": "temperature change" },
        { "sym": "L", "name": "specific latent heat" },
        { "sym": "P", "name": "pressure" },
        { "sym": "V", "name": "volume" },
        { "sym": "n", "name": "moles" },
        { "sym": "R", "name": "gas constant" },
        { "sym": "T", "name": "temperature (K)" }
      ],
      "equations": [
        { "name": "Sensible heat", "expr": "Q = m·c·ΔT", "uses": ["Q", "m", "c", "ΔT"] },
        { "name": "Latent heat", "expr": "Q = m·L", "uses": ["Q", "m", "L"] },
        { "name": "Ideal gas law", "expr": "P·V = n·R·T", "uses": ["P", "V", "n", "R", "T"] }
      ]
    },
    {
      "title": "More topics (PLACEHOLDER — replace with your content)",
      "variables": [
        { "sym": "?", "name": "Add Waves, Electricity & Magnetism, Circular Motion & Gravitation, Atomic/Nuclear/Particle, Energy Production, and HL options." }
      ],
      "equations": [
        { "name": "Placeholder", "expr": "Copy the structure of the topics above.", "uses": ["?"] }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/frq/physics.json =====
{
  "_note": "SAMPLE free-response questions with correct physics, provided so the tool renders and grades end-to-end. Replace scenario / part text / modelAnswer with your own FRQs. courseId must match a course id in registry.json (badge color is derived from the registry, not stored here).",
  "questions": [
    {
      "id": "frq-1",
      "courseId": "ap-physics-1",
      "unit": "Kinematics",
      "title": "Projectile launched from a cliff",
      "scenario": "A ball is launched horizontally at 15 m/s from the top of a 20 m cliff. Ignore air resistance and take g = 9.8 m/s².",
      "parts": [
        { "label": "Part (a)", "text": "How long is the ball in the air before it lands?", "modelAnswer": "Vertical motion: 20 = ½·g·t² → t = √(2·20/9.8) ≈ 2.02 s.", "points": 3 },
        { "label": "Part (b)", "text": "How far from the base of the cliff does it land?", "modelAnswer": "Horizontal range: x = v·t = 15 × 2.02 ≈ 30.3 m.", "points": 2 },
        { "label": "Part (c)", "text": "What is the ball's speed just before impact?", "modelAnswer": "v_y = g·t = 9.8 × 2.02 ≈ 19.8 m/s. Speed = √(15² + 19.8²) ≈ 24.8 m/s.", "points": 3 }
      ]
    },
    {
      "id": "frq-2",
      "courseId": "ap-physics-1",
      "unit": "Dynamics",
      "title": "Block on an inclined plane",
      "scenario": "A 4.0 kg block is released from rest on a frictionless incline angled at 30° above the horizontal.",
      "parts": [
        { "label": "Part (a)", "text": "Draw a free-body diagram and find the acceleration down the incline.", "modelAnswer": "Forces: weight mg down, normal force N perpendicular. a = g·sin30° = 9.8 × 0.5 = 4.9 m/s².", "points": 4 },
        { "label": "Part (b)", "text": "If the incline is 2.0 m long, how fast is the block moving at the bottom?", "modelAnswer": "v² = 2·a·d = 2 × 4.9 × 2.0 = 19.6 → v ≈ 4.4 m/s.", "points": 3 }
      ]
    },
    {
      "id": "frq-3",
      "courseId": "ap-physics-1",
      "unit": "Energy",
      "title": "Spring launches a cart",
      "scenario": "A spring (k = 800 N/m) is compressed 0.10 m and used to launch a 0.50 kg cart along a frictionless track.",
      "parts": [
        { "label": "Part (a)", "text": "How much elastic potential energy is stored in the compressed spring?", "modelAnswer": "U_s = ½·k·x² = ½ × 800 × 0.10² = 4.0 J.", "points": 2 },
        { "label": "Part (b)", "text": "What is the cart's launch speed?", "modelAnswer": "Energy conservation: ½·m·v² = 4.0 → v = √(2 × 4.0 / 0.50) = 4.0 m/s.", "points": 3 }
      ]
    },
    {
      "id": "frq-4",
      "courseId": "ap-physics-1",
      "unit": "Momentum",
      "title": "Perfectly inelastic collision",
      "scenario": "A 1200 kg car moving east at 20 m/s collides with a stationary 800 kg car and they lock together.",
      "parts": [
        { "label": "Part (a)", "text": "Find the velocity of the combined wreck immediately after the collision.", "modelAnswer": "Conserve momentum: (1200)(20) = (1200+800)·v → v = 24000/2000 = 12 m/s east.", "points": 3 },
        { "label": "Part (b)", "text": "How much kinetic energy is lost in the collision?", "modelAnswer": "K_i = ½·1200·20² = 240000 J. K_f = ½·2000·12² = 144000 J. Lost = 96000 J (96 kJ).", "points": 3 }
      ]
    },
    {
      "id": "frq-5",
      "courseId": "ap-physics-2",
      "unit": "Fluids",
      "title": "Pressure at depth in a tank",
      "scenario": "A water tank is open to the atmosphere. Water density ρ = 1000 kg/m³ and P₀ = 1.0×10⁵ Pa.",
      "parts": [
        { "label": "Part (a)", "text": "Find the absolute pressure 3.0 m below the surface.", "modelAnswer": "P = P₀ + ρ·g·h = 1.0×10⁵ + 1000 × 9.8 × 3.0 = 1.29×10⁵ Pa.", "points": 3 },
        { "label": "Part (b)", "text": "A 0.020 m² hatch sits at that depth. What net force must its hinges withstand from the water gauge pressure?", "modelAnswer": "Gauge pressure = ρ·g·h = 29400 Pa. F = P·A = 29400 × 0.020 ≈ 588 N.", "points": 3 }
      ]
    },
    {
      "id": "frq-6",
      "courseId": "ap-physics-2",
      "unit": "Thermodynamics",
      "title": "Heating a gas at constant volume",
      "scenario": "2.0 mol of an ideal gas is held in a rigid container and 500 J of heat is added.",
      "parts": [
        { "label": "Part (a)", "text": "How much work does the gas do on its surroundings?", "modelAnswer": "Constant volume → ΔV = 0, so W = 0. The gas does no work.", "points": 2 },
        { "label": "Part (b)", "text": "Using the first law, find the change in the gas's internal energy.", "modelAnswer": "ΔU = Q + W_on = 500 + 0 = 500 J. Internal energy increases by 500 J.", "points": 3 }
      ]
    },
    {
      "id": "frq-7",
      "courseId": "ap-physics-2",
      "unit": "Electrostatics",
      "title": "Force between two point charges",
      "scenario": "Two point charges, q₁ = +3.0 µC and q₂ = −5.0 µC, are 0.20 m apart. k = 8.99×10⁹ N·m²/C².",
      "parts": [
        { "label": "Part (a)", "text": "Calculate the magnitude of the electric force between them.", "modelAnswer": "F = k·|q₁·q₂|/r² = 8.99×10⁹ × (3.0×10⁻⁶)(5.0×10⁻⁶)/0.20² ≈ 3.37 N.", "points": 3 },
        { "label": "Part (b)", "text": "State whether the force is attractive or repulsive and why.", "modelAnswer": "Attractive — the charges have opposite signs, so they pull toward each other.", "points": 2 }
      ]
    },
    {
      "id": "frq-8",
      "courseId": "ap-physics-c",
      "unit": "Mechanics · Work & Energy",
      "title": "Work done by a variable force",
      "scenario": "A force F(x) = 6x (in newtons, x in meters) acts on a 2.0 kg object moving along the x-axis from x = 0 to x = 3.0 m, starting from rest.",
      "parts": [
        { "label": "Part (a)", "text": "Find the work done by the force over this interval.", "modelAnswer": "W = ∫₀³ 6x dx = 3x² |₀³ = 3(9) = 27 J.", "points": 3 },
        { "label": "Part (b)", "text": "Use the work–energy theorem to find the object's speed at x = 3.0 m.", "modelAnswer": "W = ΔK = ½·m·v² → 27 = ½·2.0·v² → v = √27 ≈ 5.2 m/s.", "points": 3 }
      ]
    },
    {
      "id": "frq-9",
      "courseId": "ap-physics-c",
      "unit": "Mechanics · Rotation",
      "title": "Torque and angular acceleration of a disk",
      "scenario": "A uniform solid disk (I = ½·M·R²) has M = 3.0 kg and R = 0.40 m. A constant tangential force of 12 N is applied at its rim.",
      "parts": [
        { "label": "Part (a)", "text": "Find the moment of inertia and the net torque about the center.", "modelAnswer": "I = ½ × 3.0 × 0.40² = 0.24 kg·m². τ = R·F = 0.40 × 12 = 4.8 N·m.", "points": 3 },
        { "label": "Part (b)", "text": "Determine the angular acceleration of the disk.", "modelAnswer": "τ = I·α → α = 4.8 / 0.24 = 20 rad/s².", "points": 2 }
      ]
    },
    {
      "id": "frq-10",
      "courseId": "ap-physics-c",
      "unit": "E&M · Gauss's Law",
      "title": "Field of a charged sphere",
      "scenario": "A solid insulating sphere of radius R carries total charge Q uniformly distributed. Use Gauss's law.",
      "parts": [
        { "label": "Part (a)", "text": "Derive the electric field outside the sphere (r > R).", "modelAnswer": "By symmetry E·4πr² = Q/ε₀ → E = Q / (4π·ε₀·r²) = k·Q/r², directed radially.", "points": 3 },
        { "label": "Part (b)", "text": "Derive the electric field inside the sphere (r < R).", "modelAnswer": "Enclosed charge q = Q·(r³/R³). E·4πr² = q/ε₀ → E = k·Q·r / R³, radially outward.", "points": 4 }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/portfolio.json =====
{
  "_note": "PLACEHOLDER projects — edit freely. tags may include any of: 'engineering', 'coding', 'physics-tools'. featured:true renders the card larger. images is an array of URLs (leave [] to use a generated gradient cover).",
  "intro": "Engineering and software projects — plus the physics study tools that power this site.",
  "projects": [
    {
      "id": "proj-cansat",
      "title": "CanSat Telemetry System",
      "tags": ["engineering", "coding"],
      "year": 2025,
      "summary": "A soda-can-sized satellite that logs altitude, pressure, and temperature during descent and radios live telemetry to a ground station.",
      "description": "Designed and built the avionics stack for a CanSat competition entry. A microcontroller samples a barometric pressure sensor and IMU at 10 Hz, timestamps each reading, and transmits packets over a 433 MHz radio link. A Python ground-station dashboard plots altitude and vertical speed in real time and writes a CSV flight log. Recovered clean descent-rate data across three test drops. (Replace this description with your own project write-up.)",
      "tech": ["C++", "Arduino", "Python", "matplotlib", "KiCad"],
      "links": [
        { "label": "GitHub", "url": "https://github.com/USER/cansat" },
        { "label": "Write-up", "url": "#" }
      ],
      "images": [],
      "featured": true
    },
    {
      "id": "proj-physics-solved",
      "title": "Physics Solved Study Tools",
      "tags": ["coding", "physics-tools"],
      "year": 2026,
      "summary": "The data-driven front-end bundle behind physicssolved.com — equation finder, formula library, FRQ practice, and simulators, all configured from JSON.",
      "description": "A vanilla-JS component library that mounts interactive study tools onto a Squarespace site from a shared CDN bundle. New courses, formula sheets, and questions are added by editing JSON — no JavaScript changes. Fully scoped CSS, WCAG AA contrast, keyboard and screen-reader support, and a print-optimized formula-sheet mode. (This is a real project on this site — keep or replace as you like.)",
      "tech": ["JavaScript (ES2020)", "CSS", "esbuild", "jsDelivr"],
      "links": [
        { "label": "Live site", "url": "https://physicssolved.com" },
        { "label": "GitHub", "url": "https://github.com/USER/physics-solved" }
      ],
      "images": [],
      "featured": true
    },
    {
      "id": "proj-motor-dyno",
      "title": "Brushless Motor Test Bench",
      "tags": ["engineering"],
      "year": 2024,
      "summary": "A benchtop dynamometer that measures thrust, current, and RPM for small BLDC motors to characterize propeller efficiency.",
      "description": "Built a load-cell test stand to compare motor/propeller combinations for a drone project. A Hall-effect sensor reads RPM, an INA219 measures current and voltage, and a load cell reads thrust; an Arduino streams the data to a laptop for plotting thrust-vs-power curves. Used the results to pick a combo that improved hover efficiency by roughly 15%. (Replace with your own numbers and details.)",
      "tech": ["Arduino", "Load cell + HX711", "Python", "Fusion 360"],
      "links": [
        { "label": "GitHub", "url": "https://github.com/USER/motor-dyno" }
      ],
      "images": [],
      "featured": false
    }
  ]
}

===== END FILE =====

===== FILE: data/registry.json =====
{
  "_comment": "Single source of truth. Carousel cards, formula-library tabs, and FRQ filters all render from this file so they can never disagree. Edit JSON only — never JS. status: 'live' | 'coming-soon'. accent drives badge color (must stay dark enough for AA text on white).",
  "subjects": [
    {
      "id": "physics",
      "label": "Physics",
      "courses": [
        {
          "id": "ap-physics-1",
          "label": "AP Physics 1",
          "eyebrow": "Mechanics",
          "blurb": "Kinematics, dynamics, energy, momentum, rotation, and waves.",
          "url": "/ap-physics-1",
          "status": "live",
          "accent": "#2547d0",
          "image": null,
          "features": ["equation-finder", "sheet", "frq", "simulator"],
          "sheets": [
            { "id": "ap-physics-1", "label": "AP Physics 1", "file": "sheets/ap-physics-1.json" }
          ]
        },
        {
          "id": "ap-physics-2",
          "label": "AP Physics 2",
          "eyebrow": "Fluids · Thermo · E&M",
          "blurb": "Fluids, thermodynamics, electrostatics, circuits, magnetism, optics, and modern physics.",
          "url": "/ap-physics-2",
          "status": "live",
          "accent": "#1a7f4e",
          "image": null,
          "features": ["equation-finder", "sheet", "frq"],
          "sheets": [
            { "id": "ap-physics-2", "label": "AP Physics 2", "file": "sheets/ap-physics-2.json" }
          ]
        },
        {
          "id": "ap-physics-c",
          "label": "AP Physics C",
          "eyebrow": "Calculus-based",
          "blurb": "Calculus-based mechanics and electricity & magnetism.",
          "url": "/ap-physics-c",
          "status": "live",
          "accent": "#b4530a",
          "image": null,
          "features": ["equation-finder", "sheet", "frq"],
          "sheets": [
            { "id": "ap-physics-c-mechanics", "label": "AP Physics C · Mechanics", "file": "sheets/ap-physics-c-mechanics.json" },
            { "id": "ap-physics-c-em", "label": "AP Physics C · E&M", "file": "sheets/ap-physics-c-em.json" }
          ]
        },
        {
          "id": "college-physics",
          "label": "College Physics",
          "eyebrow": "Algebra-based",
          "blurb": "Introductory algebra-based mechanics and electricity & magnetism.",
          "url": "/college-physics",
          "status": "live",
          "accent": "#5a3fb8",
          "image": null,
          "features": ["equation-finder", "sheet"],
          "sheets": [
            { "id": "college-mechanics", "label": "College · Mechanics", "file": "sheets/college-mechanics.json" },
            { "id": "college-em", "label": "College · E&M", "file": "sheets/college-em.json" }
          ]
        },
        {
          "id": "ib-physics",
          "label": "IB Physics",
          "eyebrow": "HL + SL",
          "blurb": "International Baccalaureate physics for Higher and Standard Level.",
          "url": "/ib-physics",
          "status": "live",
          "accent": "#0b6b93",
          "image": null,
          "features": ["equation-finder", "sheet"],
          "sheets": [
            { "id": "ib-physics", "label": "IB Physics", "file": "sheets/ib-physics.json" }
          ]
        }
      ]
    },
    {
      "id": "chemistry",
      "label": "Chemistry",
      "courses": [
        {
          "id": "ap-chemistry",
          "label": "AP Chemistry",
          "eyebrow": "Coming soon",
          "blurb": "Atomic structure, bonding, kinetics, equilibrium, thermodynamics, and electrochemistry.",
          "url": null,
          "status": "coming-soon",
          "accent": "#8a5a1b",
          "image": null,
          "features": []
        },
        {
          "id": "ib-chemistry",
          "label": "IB Chemistry",
          "eyebrow": "Coming soon",
          "blurb": "International Baccalaureate chemistry for Higher and Standard Level.",
          "url": null,
          "status": "coming-soon",
          "accent": "#6b7280",
          "image": null,
          "features": []
        }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/sheets/ap-physics-1.json =====
{
  "course": "ap-physics-1",
  "title": "AP Physics 1 Formula Sheet",
  "tagline": "Mechanics · waves · the essentials on one page.",
  "constants": [
    { "sym": "g", "value": "9.8 m/s²" },
    { "sym": "G", "value": "6.67×10⁻¹¹ N·m²/kg²" },
    { "sym": "k", "value": "8.99×10⁹ N·m²/C²" },
    { "sym": "e", "value": "1.60×10⁻¹⁹ C" },
    { "sym": "1 eV", "value": "1.60×10⁻¹⁹ J" }
  ],
  "categories": [
    {
      "title": "Kinematics",
      "rows": [
        { "name": "Velocity", "expr": "v = v₀ + a·t" },
        { "name": "Displacement", "expr": "Δx = v₀·t + ½·a·t²" },
        { "name": "Velocity (no time)", "expr": "v² = v₀² + 2·a·Δx" },
        { "name": "Average velocity", "expr": "v̄ = Δx / t" }
      ]
    },
    {
      "title": "Forces",
      "rows": [
        { "name": "Newton's 2nd law", "expr": "F_net = m·a" },
        { "name": "Weight", "expr": "F_g = m·g" },
        { "name": "Friction (max)", "expr": "F_f ≤ μ·N" }
      ]
    },
    {
      "title": "Circular Motion & Gravity",
      "rows": [
        { "name": "Centripetal accel.", "expr": "a_c = v² / r" },
        { "name": "Centripetal force", "expr": "F_c = m·v² / r" },
        { "name": "Gravitation", "expr": "F_g = G·M·m / r²" }
      ]
    },
    {
      "title": "Energy",
      "rows": [
        { "name": "Work", "expr": "W = F·d·cos θ" },
        { "name": "Kinetic energy", "expr": "K = ½·m·v²" },
        { "name": "Gravitational PE", "expr": "U_g = m·g·h" },
        { "name": "Elastic PE", "expr": "U_s = ½·k·x²" },
        { "name": "Power", "expr": "P = W / t" }
      ]
    },
    {
      "title": "Momentum",
      "rows": [
        { "name": "Momentum", "expr": "p = m·v" },
        { "name": "Impulse", "expr": "J = F·Δt = Δp" }
      ]
    },
    {
      "title": "Rotation",
      "rows": [
        { "name": "Torque", "expr": "τ = r·F·sin θ" },
        { "name": "Rotational 2nd law", "expr": "τ_net = I·α" },
        { "name": "Angular momentum", "expr": "L = I·ω" }
      ]
    },
    {
      "title": "Simple Harmonic Motion",
      "rows": [
        { "name": "Spring period", "expr": "T = 2π·√(m / k)" },
        { "name": "Pendulum period", "expr": "T = 2π·√(L / g)" },
        { "name": "Frequency", "expr": "f = 1 / T" }
      ]
    },
    {
      "title": "Waves",
      "rows": [
        { "name": "Wave speed", "expr": "v = f·λ" }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/sheets/ap-physics-2.json =====
{
  "course": "ap-physics-2",
  "title": "AP Physics 2 Formula Sheet",
  "tagline": "Fluids · thermodynamics · electricity & magnetism.",
  "constants": [
    { "sym": "g", "value": "9.8 m/s²" },
    { "sym": "k", "value": "8.99×10⁹ N·m²/C²" },
    { "sym": "e", "value": "1.60×10⁻¹⁹ C" },
    { "sym": "R", "value": "8.31 J/(mol·K)" },
    { "sym": "1 eV", "value": "1.60×10⁻¹⁹ J" }
  ],
  "categories": [
    {
      "title": "Fluids",
      "rows": [
        { "name": "Density", "expr": "ρ = m / V" },
        { "name": "Pressure", "expr": "P = F / A" },
        { "name": "Pressure with depth", "expr": "P = P₀ + ρ·g·h" },
        { "name": "Buoyant force", "expr": "F_b = ρ·V·g" },
        { "name": "Continuity", "expr": "A₁·v₁ = A₂·v₂" }
      ]
    },
    {
      "title": "Thermodynamics",
      "rows": [
        { "name": "Ideal gas law", "expr": "P·V = n·R·T" },
        { "name": "Heat", "expr": "Q = m·c·ΔT" },
        { "name": "First law", "expr": "ΔU = Q + W" }
      ]
    },
    {
      "title": "Electrostatics",
      "rows": [
        { "name": "Coulomb's law", "expr": "F_E = k·q₁·q₂ / r²" },
        { "name": "Electric field", "expr": "E = F_E / q" },
        { "name": "Point-charge field", "expr": "E = k·q / r²" },
        { "name": "Potential", "expr": "V = k·q / r" }
      ]
    },
    {
      "title": "Circuits",
      "rows": [
        { "name": "Ohm's law", "expr": "V = I·R" },
        { "name": "Power", "expr": "P = I·V" },
        { "name": "Series resistance", "expr": "R_s = R₁ + R₂ + …" },
        { "name": "Parallel resistance", "expr": "1/R_p = 1/R₁ + 1/R₂ + …" }
      ]
    },
    {
      "title": "Magnetism (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "Force on a charge", "expr": "F = q·v·B·sin θ" },
        { "name": "Add more…", "expr": "Copy this row structure." }
      ]
    },
    {
      "title": "Optics & Modern (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "Add your equations", "expr": "Snell's law, thin lens, photon energy, etc." }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/sheets/ap-physics-c-em.json =====
{
  "course": "ap-physics-c-em",
  "title": "AP Physics C · E&M Formula Sheet",
  "tagline": "Calculus-based electricity & magnetism.",
  "constants": [
    { "sym": "k", "value": "8.99×10⁹ N·m²/C²" },
    { "sym": "ε₀", "value": "8.85×10⁻¹² C²/(N·m²)" },
    { "sym": "μ₀", "value": "4π×10⁻⁷ T·m/A" },
    { "sym": "e", "value": "1.60×10⁻¹⁹ C" }
  ],
  "categories": [
    {
      "title": "Electrostatics",
      "rows": [
        { "name": "Coulomb's law", "expr": "F = k·q₁·q₂ / r²" },
        { "name": "Electric field", "expr": "E = F / q" },
        { "name": "Gauss's law", "expr": "∮ E · dA = Q_enc / ε₀" },
        { "name": "Potential", "expr": "V = k·q / r" }
      ]
    },
    {
      "title": "Capacitance",
      "rows": [
        { "name": "Capacitance", "expr": "C = Q / V" },
        { "name": "Parallel-plate", "expr": "C = ε₀·A / d" },
        { "name": "Stored energy", "expr": "U = ½·C·V²" }
      ]
    },
    {
      "title": "Circuits",
      "rows": [
        { "name": "Current", "expr": "I = dQ/dt" },
        { "name": "Ohm's law", "expr": "V = I·R" },
        { "name": "Power", "expr": "P = I·V" }
      ]
    },
    {
      "title": "Magnetism (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "Force on a charge", "expr": "F = q·v × B" },
        { "name": "Ampère's law", "expr": "∮ B · dl = μ₀·I_enc" },
        { "name": "Add more…", "expr": "Faraday's law, inductance, etc." }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/sheets/ap-physics-c-mechanics.json =====
{
  "course": "ap-physics-c-mechanics",
  "title": "AP Physics C · Mechanics Formula Sheet",
  "tagline": "Calculus-based mechanics on one page.",
  "constants": [
    { "sym": "g", "value": "9.8 m/s²" },
    { "sym": "G", "value": "6.67×10⁻¹¹ N·m²/kg²" }
  ],
  "categories": [
    {
      "title": "Kinematics",
      "rows": [
        { "name": "Velocity", "expr": "v = dx/dt" },
        { "name": "Acceleration", "expr": "a = dv/dt" },
        { "name": "Constant-a velocity", "expr": "v = v₀ + a·t" },
        { "name": "Constant-a position", "expr": "x = x₀ + v₀·t + ½·a·t²" }
      ]
    },
    {
      "title": "Newton's Laws & Momentum",
      "rows": [
        { "name": "Second law", "expr": "F = dp/dt = m·a" },
        { "name": "Momentum", "expr": "p = m·v" },
        { "name": "Impulse", "expr": "J = ∫ F · dt = Δp" }
      ]
    },
    {
      "title": "Work, Energy & Power",
      "rows": [
        { "name": "Work", "expr": "W = ∫ F · dx" },
        { "name": "Kinetic energy", "expr": "K = ½·m·v²" },
        { "name": "Power", "expr": "P = dW/dt = F·v" }
      ]
    },
    {
      "title": "Rotation",
      "rows": [
        { "name": "Torque", "expr": "τ = r × F = I·α" },
        { "name": "Moment of inertia", "expr": "I = ∫ r² · dm" },
        { "name": "Angular momentum", "expr": "L = I·ω" },
        { "name": "Rotational KE", "expr": "K_rot = ½·I·ω²" }
      ]
    },
    {
      "title": "Oscillations & Gravitation (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "SHM", "expr": "x = A·cos(ω·t + φ)" },
        { "name": "Add more…", "expr": "Copy this row structure." }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/sheets/college-em.json =====
{
  "course": "college-em",
  "title": "College Physics · E&M Formula Sheet",
  "tagline": "Algebra-based electricity & magnetism essentials.",
  "constants": [
    { "sym": "k", "value": "8.99×10⁹ N·m²/C²" },
    { "sym": "e", "value": "1.60×10⁻¹⁹ C" },
    { "sym": "ε₀", "value": "8.85×10⁻¹² C²/(N·m²)" }
  ],
  "categories": [
    {
      "title": "Electrostatics",
      "rows": [
        { "name": "Coulomb's law", "expr": "F = k·q₁·q₂ / r²" },
        { "name": "Electric field", "expr": "E = F / q" },
        { "name": "Potential", "expr": "V = k·q / r" }
      ]
    },
    {
      "title": "Circuits",
      "rows": [
        { "name": "Ohm's law", "expr": "V = I·R" },
        { "name": "Power", "expr": "P = I·V" },
        { "name": "Series resistance", "expr": "R_s = R₁ + R₂ + …" },
        { "name": "Parallel resistance", "expr": "1/R_p = 1/R₁ + 1/R₂ + …" }
      ]
    },
    {
      "title": "Magnetism & Waves (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "Force on a charge", "expr": "F = q·v·B·sin θ" },
        { "name": "Add more…", "expr": "Copy this row structure." }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/sheets/college-mechanics.json =====
{
  "course": "college-mechanics",
  "title": "College Physics · Mechanics Formula Sheet",
  "tagline": "Algebra-based mechanics essentials.",
  "constants": [
    { "sym": "g", "value": "9.8 m/s²" },
    { "sym": "G", "value": "6.67×10⁻¹¹ N·m²/kg²" }
  ],
  "categories": [
    {
      "title": "Kinematics",
      "rows": [
        { "name": "Velocity", "expr": "v = v₀ + a·t" },
        { "name": "Position", "expr": "x = x₀ + v₀·t + ½·a·t²" },
        { "name": "Velocity (no time)", "expr": "v² = v₀² + 2·a·(x − x₀)" }
      ]
    },
    {
      "title": "Forces",
      "rows": [
        { "name": "Newton's 2nd law", "expr": "F = m·a" },
        { "name": "Weight", "expr": "F_g = m·g" },
        { "name": "Friction", "expr": "F_f = μ·N" }
      ]
    },
    {
      "title": "Energy & Momentum",
      "rows": [
        { "name": "Work", "expr": "W = F·d·cos θ" },
        { "name": "Kinetic energy", "expr": "K = ½·m·v²" },
        { "name": "Gravitational PE", "expr": "U = m·g·h" },
        { "name": "Momentum", "expr": "p = m·v" }
      ]
    },
    {
      "title": "Rotation & Fluids (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "Torque", "expr": "τ = r·F·sin θ" },
        { "name": "Add more…", "expr": "Copy this row structure." }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: data/sheets/ib-physics.json =====
{
  "course": "ib-physics",
  "title": "IB Physics Formula Sheet",
  "tagline": "Core equations for SL and HL.",
  "constants": [
    { "sym": "g", "value": "9.81 m/s²" },
    { "sym": "G", "value": "6.67×10⁻¹¹ N·m²/kg²" },
    { "sym": "k", "value": "8.99×10⁹ N·m²/C²" },
    { "sym": "e", "value": "1.60×10⁻¹⁹ C" },
    { "sym": "R", "value": "8.31 J/(mol·K)" }
  ],
  "categories": [
    {
      "title": "Mechanics",
      "rows": [
        { "name": "suvat (velocity)", "expr": "v = u + a·t" },
        { "name": "suvat (displacement)", "expr": "s = u·t + ½·a·t²" },
        { "name": "suvat (no time)", "expr": "v² = u² + 2·a·s" },
        { "name": "Newton's 2nd law", "expr": "F = m·a" },
        { "name": "Momentum", "expr": "p = m·v" }
      ]
    },
    {
      "title": "Energy & Power",
      "rows": [
        { "name": "Work", "expr": "W = F·s·cos θ" },
        { "name": "Kinetic energy", "expr": "E_k = ½·m·v²" },
        { "name": "Gravitational PE", "expr": "ΔE_p = m·g·Δh" },
        { "name": "Power", "expr": "P = W / t" },
        { "name": "Efficiency", "expr": "η = useful out / total in" }
      ]
    },
    {
      "title": "Thermal Physics",
      "rows": [
        { "name": "Sensible heat", "expr": "Q = m·c·ΔT" },
        { "name": "Latent heat", "expr": "Q = m·L" },
        { "name": "Ideal gas law", "expr": "P·V = n·R·T" }
      ]
    },
    {
      "title": "Waves & Circular Motion (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "Wave speed", "expr": "c = f·λ" },
        { "name": "Centripetal accel.", "expr": "a = v² / r" },
        { "name": "Add more…", "expr": "Copy this row structure." }
      ]
    },
    {
      "title": "Fields & Atomic (PLACEHOLDER — replace with your rows)",
      "rows": [
        { "name": "Add your equations", "expr": "Gravitational/electric fields, nuclear, quantum, etc." }
      ]
    }
  ]
}

===== END FILE =====

===== FILE: demo/index.html =====
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Physics Solved — component demo</title>
  <!-- Loads the built bundle. data-ps-base="../" points data fetches at ../data/. -->
  <link rel="stylesheet" href="../dist/physics-solved.min.css">
  <script defer src="../dist/physics-solved.min.js" data-ps-base="../"></script>
  <style>
    /* Demo-page chrome only (this file is NOT part of the Squarespace site). */
    body { margin: 0; background: #fafaf8; color: #101426;
      font-family: "Inter", system-ui, sans-serif; }
    .demo-topbar { background: #101426; color: #fff; padding: 14px 20px; }
    .demo-topbar h1 { margin: 0; font-size: 18px; font-weight: 700; }
    .demo-topbar p { margin: 4px 0 0; font-size: 13px; color: #aab3dd; }
    .demo-block { border-top: 1px solid #e5e7ee; }
    .demo-block:nth-child(even) { background: #fff; }
    .demo-tag { max-width: 1120px; margin: 0 auto; padding: 20px 16px 0;
      font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #5a6072; }
  </style>
</head>
<body>
  <header class="demo-topbar">
    <h1>Physics Solved — component demo</h1>
    <p>Every component mounted locally from <code>../data/</code>. Serve this folder over HTTP (see README) — opening via file:// blocks data fetches.</p>
  </header>

  <div class="demo-block">
    <div class="demo-tag">carousel — physics &amp; chemistry</div>
    <div class="ps-root">
      <section class="ps-section">
        <div class="ps-section-head">
          <div class="ps-eyebrow">Study tools</div>
          <h2 class="ps-h2">Choose your course</h2>
          <p>Interactive equation finders, formula sheets, and practice — one set per class.</p>
        </div>
        <h3 class="ps-h3" style="margin-bottom:12px">Physics</h3>
        <div data-ps-app="carousel" data-subject="physics"></div>
        <h3 class="ps-h3" style="margin:32px 0 12px">Chemistry</h3>
        <div data-ps-app="carousel" data-subject="chemistry"></div>
      </section>
    </div>
  </div>

  <div class="demo-block">
    <div class="demo-tag">formula-library</div>
    <div class="ps-root">
      <section class="ps-section">
        <div class="ps-section-head">
          <div class="ps-eyebrow">Reference</div>
          <h2 class="ps-h2">Formula Sheet Library</h2>
          <p>Every constant and equation, grouped by topic and ready to print.</p>
        </div>
        <div data-ps-app="formula-library" data-subject="physics"></div>
      </section>
    </div>
  </div>

  <div class="demo-block">
    <div class="demo-tag">frq</div>
    <div class="ps-root">
      <section class="ps-section">
        <div class="ps-section-head">
          <div class="ps-eyebrow">Practice</div>
          <h2 class="ps-h2">Free-Response Practice</h2>
          <p>Work a problem part by part, then check against the model answer.</p>
        </div>
        <div data-ps-app="frq"></div>
      </section>
    </div>
  </div>

  <div class="demo-block">
    <div class="demo-tag">equation-finder — data-course="ap-physics-1"</div>
    <div class="ps-root">
      <section class="ps-section">
        <div data-ps-app="equation-finder" data-course="ap-physics-1"></div>
      </section>
    </div>
  </div>

  <div class="demo-block">
    <div class="demo-tag">simulator-kinematics</div>
    <div class="ps-root">
      <section class="ps-section">
        <div data-ps-app="simulator-kinematics"></div>
      </section>
    </div>
  </div>

  <div class="demo-block">
    <div class="demo-tag">portfolio</div>
    <div class="ps-root">
      <section class="ps-section">
        <div class="ps-section-head">
          <div class="ps-eyebrow">Portfolio</div>
          <h2 class="ps-h2">Engineering &amp; coding projects</h2>
        </div>
        <div data-ps-app="portfolio"></div>
      </section>
    </div>
  </div>
</body>
</html>

===== END FILE =====

===== FILE: dist/physics-solved.min.css =====
/* Physics Solved bundle — generated by scripts/build.mjs. Edit src/, not dist/. */
/* --- src/css/tokens.css --- */
/* Physics Solved — design tokens ("clean light academic").
 * Scoped to .ps-root so nothing leaks into the Squarespace theme.
 * Fonts: Inter (UI) + JetBrains Mono (equations, values, constants).
 */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");

.ps-root {
  /* Color */
  --ps-bg: #fafaf8;
  --ps-surface: #ffffff;
  --ps-ink: #101426;
  --ps-muted: #5a6072;
  --ps-accent: #2547d0;
  --ps-accent-hover: #1c38a8;
  --ps-success: #1a7f4e;
  --ps-border: #e5e7ee;

  /* Shape */
  --ps-radius: 10px;
  --ps-radius-sm: 7px;
  --ps-shadow: 0 1px 3px rgb(16 20 38 / .08);
  --ps-shadow-md: 0 6px 20px rgb(16 20 38 / .10);

  /* Type scale — 13 / 15 / 17 / 22 / 28 / 36 */
  --ps-fs-xs: 13px;
  --ps-fs-sm: 15px;
  --ps-fs-md: 17px;
  --ps-fs-lg: 22px;
  --ps-fs-xl: 28px;
  --ps-fs-2xl: 36px;

  /* Spacing — 4 / 8 / 12 / 16 / 24 / 32 / 48 */
  --ps-s1: 4px;
  --ps-s2: 8px;
  --ps-s3: 12px;
  --ps-s4: 16px;
  --ps-s5: 24px;
  --ps-s6: 32px;
  --ps-s7: 48px;

  /* Fonts */
  --ps-font-ui: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --ps-font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", "Menlo", "Consolas", monospace;

  /* Base */
  color: var(--ps-ink);
  font-family: var(--ps-font-ui);
  font-size: var(--ps-fs-sm);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
/* --- src/css/components.css --- */
/* Physics Solved — component styles.
 * Every selector is scoped under .ps-* (or .ps-root descendant). No *, body,
 * or html rules — nothing leaks into the Squarespace theme.
 * Breakpoints: >960 (default), <=960 (tablet), <=640 (mobile).
 */

/* ============================ Base / utilities ======================= */
.ps-root { box-sizing: border-box; }
.ps-root *,
.ps-root *::before,
.ps-root *::after { box-sizing: inherit; }

.ps-root :focus-visible {
  outline: 2px solid var(--ps-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.ps-mono { font-family: var(--ps-font-mono); }
.ps-muted { color: var(--ps-muted); }

.ps-h2 { font-size: var(--ps-fs-xl); font-weight: 700; line-height: 1.15; margin: 0; letter-spacing: -.01em; }
.ps-h3 { font-size: var(--ps-fs-lg); font-weight: 700; line-height: 1.2; margin: 0; }

.ps-eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
  color: var(--ps-accent);
}

.ps-section { margin: 0 auto; max-width: 1120px; padding: var(--ps-s6) var(--ps-s4); }
.ps-section-head { margin-bottom: var(--ps-s5); }
.ps-section-head .ps-h2 { margin-top: var(--ps-s1); }
.ps-section-head p { color: var(--ps-muted); margin: var(--ps-s2) 0 0; max-width: 60ch; }

.ps-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; line-height: 1;
  padding: 4px 9px; border-radius: 999px;
  color: var(--ps-accent);
  background: color-mix(in srgb, var(--ps-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--ps-accent) 22%, transparent);
  white-space: nowrap;
}
.ps-badge--muted {
  color: var(--ps-muted);
  background: color-mix(in srgb, var(--ps-muted) 12%, transparent);
  border-color: var(--ps-border);
}

/* Loading / error states */
.ps-state {
  display: flex; align-items: center; justify-content: center;
  min-height: 100px; padding: var(--ps-s5);
  color: var(--ps-muted); font-size: var(--ps-fs-sm);
  text-align: center;
}
.ps-state--error { color: #a12525; }

/* First-reveal animation (<=200ms). Disabled for reduced motion. */
.ps-reveal { opacity: 0; transform: translateY(8px); }
.ps-reveal.is-in { opacity: 1; transform: none; transition: opacity 200ms ease, transform 200ms ease; }
@media (prefers-reduced-motion: reduce) {
  .ps-reveal, .ps-reveal.is-in { opacity: 1; transform: none; transition: none; }
}

/* ============================ Buttons =============================== */
.ps-btn {
  --btn-bg: var(--ps-accent);
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-sm); font-weight: 600;
  line-height: 1; cursor: pointer;
  padding: 10px 16px; border-radius: var(--ps-radius-sm);
  border: 1px solid transparent; background: var(--btn-bg); color: #fff;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.ps-btn:hover { --btn-bg: var(--ps-accent-hover); }
.ps-btn:disabled { opacity: .55; cursor: default; }

.ps-btn--ghost {
  background: transparent; color: var(--ps-accent);
  border-color: var(--ps-border);
}
.ps-btn--ghost:hover {
  background: color-mix(in srgb, var(--ps-accent) 8%, transparent);
  border-color: color-mix(in srgb, var(--ps-accent) 40%, transparent);
}
.ps-btn--dark {
  background: var(--ps-ink); color: #fff; border-color: var(--ps-ink);
}
.ps-btn--dark:hover { --btn-bg: var(--ps-ink); background: #1e2540; }
.ps-btn--on-dark {
  background: transparent; color: #eef1fb;
  border-color: rgba(255,255,255,.28);
}
.ps-btn--on-dark:hover { background: rgba(255,255,255,.10); }

/* ============================ Card ================================= */
.ps-card {
  background: var(--ps-surface);
  border: 1px solid var(--ps-border);
  border-radius: var(--ps-radius);
  box-shadow: var(--ps-shadow);
}

/* ============================ Pills / Tabs / Segment =============== */
.ps-pills { display: flex; flex-wrap: wrap; gap: var(--ps-s2); }
.ps-pill {
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600;
  cursor: pointer; padding: 7px 14px; border-radius: 999px;
  border: 1px solid var(--ps-border); background: var(--ps-surface); color: var(--ps-muted);
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.ps-pill:hover { color: var(--ps-ink); border-color: color-mix(in srgb, var(--ps-ink) 20%, var(--ps-border)); }
.ps-pill[aria-selected="true"] {
  color: #fff; background: var(--ps-accent); border-color: var(--ps-accent);
}

.ps-tabs { display: flex; flex-wrap: wrap; gap: var(--ps-s2); border-bottom: 1px solid var(--ps-border); padding-bottom: var(--ps-s3); }
.ps-tab {
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600;
  cursor: pointer; padding: 8px 14px; border-radius: 999px;
  border: 1px solid var(--ps-border); background: var(--ps-surface); color: var(--ps-muted);
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.ps-tab:hover { color: var(--ps-ink); }
.ps-tab[aria-selected="true"] {
  color: #fff;
  background: var(--ps-accent, #2547d0);
  border-color: var(--ps-accent, #2547d0);
}
.ps-tabpanel { padding-top: var(--ps-s5); }

.ps-segment {
  display: inline-flex; border: 1px solid var(--ps-border); border-radius: 999px;
  overflow: hidden; background: var(--ps-surface);
}
.ps-segment-btn {
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600;
  cursor: pointer; padding: 6px 13px; border: 0; background: transparent; color: var(--ps-muted);
  border-right: 1px solid var(--ps-border);
}
.ps-segment-btn:last-child { border-right: 0; }
.ps-segment-btn[aria-pressed="true"] { background: var(--ps-accent); color: #fff; }

.ps-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ps-chip {
  font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px;
  color: var(--ps-muted); background: var(--ps-bg); border: 1px solid var(--ps-border);
}
.ps-link { color: var(--ps-accent); font-weight: 600; text-decoration: none; font-size: var(--ps-fs-sm); }
.ps-link:hover { text-decoration: underline; }

/* ============================ Carousel ============================= */
.ps-carousel { position: relative; display: flex; align-items: center; gap: var(--ps-s2); }
.ps-carousel-viewport { position: relative; flex: 1; overflow: hidden; }
.ps-carousel-viewport::before,
.ps-carousel-viewport::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 40px; z-index: 2;
  pointer-events: none; opacity: 0; transition: opacity 150ms ease;
}
.ps-carousel-viewport::before { left: 0; background: linear-gradient(90deg, var(--ps-bg), transparent); }
.ps-carousel-viewport::after { right: 0; background: linear-gradient(270deg, var(--ps-bg), transparent); }
.ps-carousel.has-fade-start .ps-carousel-viewport::before { opacity: 1; }
.ps-carousel.has-fade-end .ps-carousel-viewport::after { opacity: 1; }

.ps-carousel-track {
  display: flex; gap: var(--ps-s4); overflow-x: auto; scroll-snap-type: x mandatory;
  scroll-behavior: smooth; padding: var(--ps-s2) var(--ps-s1) var(--ps-s4);
  scrollbar-width: thin;
}
.ps-carousel-item { scroll-snap-align: start; flex: 0 0 clamp(240px, 30%, 300px); }

.ps-carousel-arrow {
  flex: 0 0 auto; width: 40px; height: 40px; border-radius: 999px;
  display: grid; place-items: center; cursor: pointer;
  background: var(--ps-surface); color: var(--ps-ink);
  border: 1px solid var(--ps-border); box-shadow: var(--ps-shadow);
  transition: background 120ms ease, opacity 120ms ease;
}
.ps-carousel-arrow:hover { background: var(--ps-bg); }
.ps-carousel-arrow:disabled { opacity: .35; cursor: default; }

.ps-course-card { display: flex; flex-direction: column; overflow: hidden; height: 100%; text-decoration: none; color: inherit; transition: box-shadow 150ms ease, transform 150ms ease; }
a.ps-course-card:hover { box-shadow: var(--ps-shadow-md); transform: translateY(-2px); }
.ps-course-card.is-coming { opacity: .92; }
.ps-course-cover {
  height: 96px; position: relative;
  background: linear-gradient(135deg, var(--ps-accent), color-mix(in srgb, var(--ps-accent) 45%, #101426));
  display: grid; place-items: center;
}
.ps-course-cover-mark { font-family: var(--ps-font-mono); font-weight: 500; font-size: 26px; color: rgba(255,255,255,.92); letter-spacing: .04em; }
.ps-course-body { padding: var(--ps-s4); display: flex; flex-direction: column; gap: var(--ps-s2); flex: 1; }
.ps-course-title { font-size: var(--ps-fs-md); font-weight: 700; margin: 0; }
.ps-course-blurb { font-size: var(--ps-fs-xs); color: var(--ps-muted); margin: 0; flex: 1; }
.ps-course-cta { font-size: var(--ps-fs-xs); font-weight: 600; color: var(--ps-accent); margin-top: var(--ps-s1); }

/* ============================ Equation finder ====================== */
.ps-ef-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ps-s4); flex-wrap: wrap; margin-bottom: var(--ps-s3); }
.ps-ef-head-text .ps-muted { margin: var(--ps-s1) 0 0; font-size: var(--ps-fs-xs); }
.ps-ef-note { font-size: var(--ps-fs-xs); color: var(--ps-muted); background: var(--ps-bg); border: 1px dashed var(--ps-border); border-radius: var(--ps-radius-sm); padding: var(--ps-s2) var(--ps-s3); margin: 0 0 var(--ps-s4); }

.ps-accordion { display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-accordion-item { border: 1px solid var(--ps-border); border-radius: var(--ps-radius); background: var(--ps-surface); overflow: hidden; }
.ps-accordion-head {
  width: 100%; display: flex; align-items: center; gap: var(--ps-s3);
  padding: var(--ps-s4); background: transparent; border: 0; cursor: pointer;
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-md); font-weight: 600; color: var(--ps-ink); text-align: left;
}
.ps-accordion-title { flex: 1; }
.ps-accordion-meta { color: var(--ps-muted); font-weight: 500; font-size: var(--ps-fs-xs); }
.ps-ef-count { font-size: var(--ps-fs-xs); font-weight: 600; color: var(--ps-accent); }
.ps-accordion-caret { width: 10px; height: 10px; border-right: 2px solid var(--ps-muted); border-bottom: 2px solid var(--ps-muted); transform: rotate(45deg); transition: transform 150ms ease; }
.ps-accordion-head[aria-expanded="true"] .ps-accordion-caret { transform: rotate(-135deg); }
.ps-accordion-panel { padding: 0 var(--ps-s4) var(--ps-s4); }

.ps-var-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--ps-s2); margin-bottom: var(--ps-s4); }
.ps-var {
  display: flex; align-items: center; gap: var(--ps-s2); cursor: pointer;
  padding: 8px 10px; border: 1px solid var(--ps-border); border-radius: var(--ps-radius-sm);
  background: var(--ps-bg); transition: border-color 120ms ease, background 120ms ease;
}
.ps-var:hover { border-color: color-mix(in srgb, var(--ps-accent) 35%, var(--ps-border)); }
.ps-var input { accent-color: var(--ps-accent); width: 15px; height: 15px; }
.ps-var:has(input:checked) { border-color: var(--ps-accent); background: color-mix(in srgb, var(--ps-accent) 8%, transparent); }
.ps-var-sym { font-size: var(--ps-fs-sm); font-weight: 500; }
.ps-var-name { font-size: 12px; color: var(--ps-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ps-eq-list { display: flex; flex-direction: column; gap: var(--ps-s1); }
.ps-eq {
  display: flex; align-items: baseline; justify-content: space-between; gap: var(--ps-s4);
  padding: 10px 12px; border-radius: var(--ps-radius-sm); background: var(--ps-bg);
  border: 1px solid transparent;
}
.ps-eq.is-hidden { display: none; }
.ps-eq-name { font-size: var(--ps-fs-xs); color: var(--ps-muted); }
.ps-eq-expr { font-size: var(--ps-fs-sm); font-weight: 500; color: var(--ps-ink); text-align: right; }

/* ============================ Formula library ===================== */
.ps-sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ps-s4); flex-wrap: wrap; margin-bottom: var(--ps-s4); }
.ps-sheet-title { font-size: var(--ps-fs-lg); font-weight: 700; margin: 0; }
.ps-sheet-tagline { font-size: var(--ps-fs-xs); margin: var(--ps-s1) 0 0; }

.ps-constants {
  display: flex; flex-wrap: wrap; gap: var(--ps-s2);
  padding: var(--ps-s3); border-radius: var(--ps-radius); background: var(--ps-bg);
  border: 1px solid var(--ps-border); margin-bottom: var(--ps-s5);
}
.ps-constant { display: inline-flex; align-items: baseline; gap: 6px; font-size: var(--ps-fs-xs); padding: 4px 10px; background: var(--ps-surface); border: 1px solid var(--ps-border); border-radius: 999px; }
.ps-constant-sym { font-weight: 500; color: var(--ps-accent); }
.ps-constant-val { color: var(--ps-ink); }

.ps-sheet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--ps-s4); }
.ps-sheet-card { padding: var(--ps-s4); }
.ps-sheet-cat { font-size: var(--ps-fs-sm); font-weight: 700; margin: 0 0 var(--ps-s3); padding-bottom: var(--ps-s2); border-bottom: 1px solid var(--ps-border); }
.ps-sheet-rows { display: flex; flex-direction: column; gap: var(--ps-s2); }
.ps-sheet-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--ps-s3); }
.ps-sheet-row-name { font-size: 12px; color: var(--ps-muted); }
.ps-sheet-row-expr { font-size: var(--ps-fs-xs); font-weight: 500; text-align: right; }

/* ============================ FRQ ================================= */
.ps-frq-controls { display: flex; align-items: center; justify-content: space-between; gap: var(--ps-s4); flex-wrap: wrap; margin-bottom: var(--ps-s5); }
.ps-frq-panes { display: grid; grid-template-columns: minmax(240px, 320px) 1fr; gap: var(--ps-s5); align-items: start; }
.ps-frq-select { display: none; width: 100%; padding: 10px 12px; border: 1px solid var(--ps-border); border-radius: var(--ps-radius-sm); font-family: var(--ps-font-ui); font-size: var(--ps-fs-sm); background: var(--ps-surface); color: var(--ps-ink); }
.ps-frq-list { display: flex; flex-direction: column; gap: var(--ps-s2); max-height: 560px; overflow-y: auto; padding-right: 2px; }
.ps-frq-item {
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  text-align: left; cursor: pointer; padding: var(--ps-s3); width: 100%;
  border: 1px solid var(--ps-border); border-radius: var(--ps-radius); background: var(--ps-surface);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.ps-frq-item:hover { border-color: color-mix(in srgb, var(--ps-accent) 40%, var(--ps-border)); }
.ps-frq-item[aria-current="true"] { border-color: var(--ps-accent); box-shadow: inset 3px 0 0 var(--ps-accent); }
.ps-frq-item-unit { font-size: 12px; color: var(--ps-muted); }
.ps-frq-item-title { font-size: var(--ps-fs-sm); font-weight: 600; }

.ps-frq-viewer { border: 1px solid var(--ps-border); border-radius: var(--ps-radius); background: var(--ps-surface); padding: var(--ps-s5); min-height: 320px; }
.ps-frq-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--ps-s2); min-height: 280px; text-align: center; }
.ps-frq-empty-icon { font-size: 34px; opacity: .8; }
.ps-frq-empty-title { font-size: var(--ps-fs-md); font-weight: 700; margin: 0; }
.ps-frq-empty .ps-muted { margin: 0; }

.ps-frq-qhead { display: flex; align-items: center; flex-wrap: wrap; gap: var(--ps-s2); margin-bottom: var(--ps-s3); }
.ps-frq-qunit { font-size: var(--ps-fs-xs); color: var(--ps-muted); }
.ps-frq-qtitle { flex-basis: 100%; font-size: var(--ps-fs-lg); font-weight: 700; margin: var(--ps-s1) 0 0; }
.ps-frq-scenario { font-size: var(--ps-fs-md); line-height: 1.55; margin: 0 0 var(--ps-s4); }

.ps-frq-part { padding: var(--ps-s4) 0; border-top: 1px solid var(--ps-border); }
.ps-frq-part-label { display: flex; align-items: center; gap: var(--ps-s2); font-weight: 700; font-size: var(--ps-fs-sm); }
.ps-frq-part-tag { color: var(--ps-ink); }
.ps-frq-points { font-size: 12px; font-weight: 600; color: var(--ps-muted); }
.ps-frq-part-text { font-size: var(--ps-fs-sm); margin: var(--ps-s2) 0; }
.ps-frq-answer { width: 100%; resize: vertical; padding: 10px 12px; font-family: var(--ps-font-ui); font-size: var(--ps-fs-sm); border: 1px solid var(--ps-border); border-radius: var(--ps-radius-sm); background: var(--ps-surface); color: var(--ps-ink); }
.ps-frq-answer:focus { border-color: var(--ps-accent); }

.ps-frq-reveal { margin-top: var(--ps-s3); display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-frq-model { background: color-mix(in srgb, var(--ps-success) 8%, transparent); border: 1px solid color-mix(in srgb, var(--ps-success) 30%, transparent); border-radius: var(--ps-radius-sm); padding: var(--ps-s3); display: flex; flex-direction: column; gap: 4px; }
.ps-frq-model-tag { font-size: 12px; font-weight: 700; color: var(--ps-success); text-transform: uppercase; letter-spacing: .04em; }
.ps-frq-model-text { font-size: var(--ps-fs-sm); color: var(--ps-ink); line-height: 1.5; }
.ps-frq-actions { display: flex; align-items: center; gap: var(--ps-s4); flex-wrap: wrap; margin-top: var(--ps-s4); padding-top: var(--ps-s4); border-top: 1px solid var(--ps-border); }
.ps-frq-summary { font-size: var(--ps-fs-sm); font-weight: 600; color: var(--ps-ink); }

/* ============================ Simulator (dark accent) ============= */
.ps-sim--dark {
  background: var(--ps-ink); color: #eef1fb;
  border-radius: var(--ps-radius); padding: var(--ps-s5);
}
.ps-sim-head { margin-bottom: var(--ps-s4); }
.ps-sim-title { font-size: var(--ps-fs-lg); font-weight: 700; margin: 0; color: #fff; }
.ps-sim-sub { font-size: var(--ps-fs-xs); color: rgba(238,241,251,.65); margin: var(--ps-s1) 0 0; }
.ps-sim-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--ps-s5); align-items: start; }
.ps-sim-left { display: flex; flex-direction: column; gap: var(--ps-s3); min-width: 0; }
.ps-sim-canvas { width: 100%; height: auto; display: block; background: #0b0f1e; border: 1px solid rgba(255,255,255,.12); border-radius: var(--ps-radius-sm); }
.ps-sim-eqstrip { display: flex; flex-wrap: wrap; gap: var(--ps-s2); }
.ps-sim-eq { font-size: 12px; padding: 5px 9px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 999px; color: #cfd6f5; }

.ps-sim-right { display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-sim-controls { display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-sim-control { display: flex; flex-direction: column; gap: 6px; }
.ps-sim-label { display: flex; align-items: center; justify-content: space-between; font-size: var(--ps-fs-xs); font-weight: 600; color: #cfd6f5; }
.ps-sim-val { color: #fff; }
.ps-sim-range { width: 100%; accent-color: #5f7cf0; }
.ps-sim-select { width: 100%; padding: 8px 10px; border-radius: var(--ps-radius-sm); border: 1px solid rgba(255,255,255,.18); background: #0b0f1e; color: #eef1fb; font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); }
.ps-sim-buttons { display: flex; gap: var(--ps-s2); }
.ps-sim-readout { font-size: var(--ps-fs-xs); color: #cfd6f5; }
.ps-sim-tablewrap { overflow-x: auto; }
.ps-sim-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ps-sim-table th, .ps-sim-table td { text-align: right; padding: 5px 8px; border-bottom: 1px solid rgba(255,255,255,.1); }
.ps-sim-table th { color: #aab3dd; font-weight: 600; }
.ps-sim-table td { color: #eef1fb; }

/* ============================ Portfolio =========================== */
.ps-portfolio-intro { font-size: var(--ps-fs-md); color: var(--ps-muted); max-width: 60ch; margin: 0 0 var(--ps-s4); }
.ps-portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--ps-s4); margin-top: var(--ps-s5); align-items: start; }
.ps-portfolio-card { display: flex; flex-direction: column; overflow: hidden; }
.ps-portfolio-card.is-featured { grid-column: span 2; }
.ps-portfolio-cover { height: 120px; overflow: hidden; }
.ps-portfolio-card.is-featured .ps-portfolio-cover { height: 170px; }
.ps-portfolio-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ps-portfolio-cover--gradient { display: grid; place-items: center; background: linear-gradient(135deg, hsl(var(--ps-h) 55% 42%), hsl(var(--ps-h) 60% 24%)); }
.ps-portfolio-cover-mark { font-family: var(--ps-font-mono); font-size: 32px; color: rgba(255,255,255,.9); }
.ps-portfolio-body { padding: var(--ps-s4); display: flex; flex-direction: column; gap: var(--ps-s2); }
.ps-portfolio-titlerow { display: flex; align-items: baseline; justify-content: space-between; gap: var(--ps-s3); }
.ps-portfolio-title { font-size: var(--ps-fs-md); font-weight: 700; margin: 0; }
.ps-portfolio-year { font-size: var(--ps-fs-xs); color: var(--ps-muted); }
.ps-portfolio-summary { font-size: var(--ps-fs-sm); color: var(--ps-ink); margin: 0; }
.ps-tech { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: var(--ps-s1) 0 0; }
.ps-tech-item { font-size: 11px; color: var(--ps-muted); background: var(--ps-bg); border: 1px solid var(--ps-border); border-radius: 5px; padding: 2px 7px; }
.ps-portfolio-links { display: flex; flex-wrap: wrap; gap: var(--ps-s3); margin-top: var(--ps-s1); }
.ps-portfolio-toggle { align-self: flex-start; margin-top: var(--ps-s1); font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600; color: var(--ps-accent); background: transparent; border: 0; cursor: pointer; padding: 0; }
.ps-portfolio-toggle:hover { text-decoration: underline; }
.ps-portfolio-desc { font-size: var(--ps-fs-sm); color: var(--ps-ink); line-height: 1.55; border-top: 1px solid var(--ps-border); padding-top: var(--ps-s3); margin-top: var(--ps-s1); }
.ps-portfolio-desc p { margin: 0; }

/* ============================ Responsive ========================== */
@media (max-width: 960px) {
  .ps-sheet-grid { grid-template-columns: repeat(2, 1fr); }
  .ps-var-grid { grid-template-columns: repeat(2, 1fr); }
  .ps-frq-panes { grid-template-columns: 1fr; }
  .ps-frq-list { max-height: none; }
  .ps-sim-grid { grid-template-columns: 1fr; }
  .ps-portfolio-card.is-featured { grid-column: span 1; }
}
@media (max-width: 640px) {
  .ps-section { padding: var(--ps-s5) var(--ps-s3); }
  .ps-sheet-grid { grid-template-columns: 1fr; }
  .ps-var-grid { grid-template-columns: 1fr; }
  .ps-portfolio-grid { grid-template-columns: 1fr; }
  .ps-frq-select { display: block; }
  .ps-frq-list { display: none; }
  .ps-frq-controls { flex-direction: column; align-items: stretch; }
  .ps-carousel-item { flex-basis: 78%; }
  .ps-h2 { font-size: var(--ps-fs-lg); }
}
/* --- src/css/print.css --- */
/* Physics Solved — print styles for formula sheets.
 * Applies both to the dedicated print popup (opened by "Print / Save PDF")
 * and to a direct browser print of the page. Sheets go black-on-white,
 * two compact columns, with category cards kept whole across page breaks.
 * Still fully scoped under .ps-root — no body/html rules.
 */
@media print {
  .ps-root {
    --ps-ink: #000;
    --ps-muted: #333;
    --ps-border: #999;
    background: #fff;
    color: #000;
  }

  /* Hide all interactive chrome when printing. */
  .ps-tabs,
  .ps-pills,
  .ps-btn,
  .ps-segment,
  .ps-carousel-arrow,
  .ps-portfolio-toggle,
  .ps-frq-controls,
  .ps-sim--dark { display: none !important; }

  .ps-tabpanel { padding-top: 0; }

  .ps-sheet { color: #000; }
  .ps-sheet-title { font-size: 20px; }
  .ps-sheet-tagline { color: #333; }

  .ps-constants { background: transparent; border: 1px solid #999; }
  .ps-constant { background: transparent; border: 1px solid #bbb; }
  .ps-constant-sym { color: #000; }

  .ps-sheet-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ps-sheet-card {
    background: transparent;
    border: 1px solid #000;
    box-shadow: none;
    padding: 10px 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .ps-sheet-cat { border-bottom: 1px solid #000; }
  .ps-sheet-row-name { color: #222; }

  /* The dedicated print popup wraps the sheet in .ps-print-doc. */
  .ps-print-doc { max-width: none; padding: 0; }
  .ps-print-body { margin: 0; }
}

===== END FILE =====

===== FILE: dist/physics-solved.min.js =====
/* Physics Solved bundle — generated by scripts/build.mjs. Edit src/, not dist/. */
/* --- src/js/core.js --- */
/* Physics Solved — core mount system.
 * Scans the page for [data-ps-app] elements, resolves the CDN base URL,
 * fetches the JSON each component needs, and renders. Vanilla ES2020, no deps.
 * Components register themselves on window.PS via PS.register(name, fn).
 */
(function () {
  "use strict";

  // Capture the <script> that loaded this bundle NOW (synchronously), while
  // document.currentScript is still valid. Used to derive the data base URL.
  var CURRENT = document.currentScript;

  var PS = (window.PS = window.PS || {});
  PS.components = PS.components || {};

  /* ---- Base URL resolution -------------------------------------------- */
  // Priority: data-ps-base attribute on the script tag -> derived from the
  // script src (strip trailing "dist/<file>") -> "" (same-origin relative).
  function resolveBase() {
    var attr = CURRENT && CURRENT.getAttribute && CURRENT.getAttribute("data-ps-base");
    if (attr) return attr.replace(/\/?$/, "/"); // ensure trailing slash
    var src = (CURRENT && CURRENT.src) || "";
    if (!src) return "";
    // .../physics-solved@v1/dist/physics-solved.min.js -> .../physics-solved@v1/
    var base = src.replace(/dist\/[^\/]*$/, "");
    if (base === src) base = src.replace(/[^\/]*$/, ""); // fallback: script dir
    return base;
  }

  PS.base = resolveBase();
  PS.dataUrl = function (path) {
    return PS.base + "data/" + String(path).replace(/^\/+/, "");
  };

  /* ---- Fetch with in-memory cache ------------------------------------- */
  var cache = Object.create(null);
  PS.fetchJSON = function (path) {
    var url = /^https?:|^\.\.?\//.test(path) ? path : PS.dataUrl(path);
    if (cache[url]) return cache[url];
    cache[url] = fetch(url, { credentials: "omit" }).then(function (r) {
      if (!r.ok) throw new Error("PS: failed to load " + url + " (" + r.status + ")");
      return r.json();
    });
    return cache[url];
  };

  PS.getRegistry = function () {
    return PS.fetchJSON("registry.json");
  };

  /* ---- Small DOM helpers ---------------------------------------------- */
  // h("div.cls#id", {attrs}, [children | "text"])
  PS.h = function (spec, attrs, children) {
    var tag = "div", id = null, cls = [];
    spec.replace(/([.#]?[^.#]+)/g, function (m) {
      if (m[0] === ".") cls.push(m.slice(1));
      else if (m[0] === "#") id = m.slice(1);
      else tag = m;
    });
    var node = document.createElement(tag);
    if (id) node.id = id;
    if (cls.length) node.className = cls.join(" ");
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") node.className += (node.className ? " " : "") + v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (Array.isArray(children) ? children : children != null ? [children] : []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return node;
  };

  PS.escape = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  PS.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // First-reveal fade/rise (<=200ms). No-op under prefers-reduced-motion.
  PS.reveal = function (node) {
    if (PS.reducedMotion()) return;
    node.classList.add("ps-reveal");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        node.classList.add("is-in");
      });
    });
  };

  PS.register = function (name, fn) {
    PS.components[name] = fn;
  };

  /* ---- Error + loading placeholders ----------------------------------- */
  function setState(el, cls, msg) {
    el.innerHTML = "";
    el.appendChild(PS.h("div.ps-state." + cls, { role: "status" }, msg));
  }

  /* ---- Mount ---------------------------------------------------------- */
  PS.mount = function (root) {
    root = root || document;
    var nodes = root.querySelectorAll("[data-ps-app]");
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.__psMounted) return;
      el.__psMounted = true;
      var type = el.getAttribute("data-ps-app");
      var comp = PS.components[type];
      if (!comp) {
        setState(el, "ps-state--error", 'Unknown component "' + type + '".');
        return;
      }
      if (!el.getAttribute("data-ps-quiet")) setState(el, "ps-state--loading", "Loading…");
      try {
        Promise.resolve(comp(el)).catch(function (err) {
          console.error(err);
          setState(el, "ps-state--error", "Could not load this section.");
        });
      } catch (err) {
        console.error(err);
        setState(el, "ps-state--error", "Could not load this section.");
      }
    });
  };

  function boot() {
    PS.mount();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    // Defer to a macrotask so the rest of a concatenated bundle registers its
    // components BEFORE we scan the page (core.js runs before them in the file).
    setTimeout(boot, 0);
  }
})();
/* --- src/js/grading-adapter.js --- */
/* Physics Solved — FRQ grading adapter.
 * All direct Anthropic API calls have been removed. Grading is pluggable:
 * with no provider set, the UI runs in self-check mode (reveal model answers +
 * self-assessment). To enable AI feedback later, set PS.grading.provider to an
 * object with an { endpoint } that points at a serverless proxy (e.g. a
 * Cloudflare Worker). No other file needs to change — see worker/README.md.
 */
(function () {
  "use strict";
  var PS = (window.PS = window.PS || {});

  PS.grading = {
    // provider: { endpoint: "https://your-worker.example.workers.dev/grade" }
    provider: null,

    /**
     * Grade a question given the student's per-part answers.
     * @param {object} question  the FRQ object (id, parts, ...)
     * @param {object} answers   map of part label -> student text
     * @returns {Promise<object>} result shape consumed by the FRQ UI:
     *   self-check:  { mode: "self-check" }
     *   graded:      { mode: "graded", parts: [{ label, score, max, feedback }],
     *                  score, max }
     */
    async grade(question, answers) {
      if (!this.provider || !this.provider.endpoint) {
        return { mode: "self-check" };
      }
      // Future: POST { question, answers } to the proxy and return its JSON.
      // The proxy holds the API key server-side; the browser never sees it.
      var res = await fetch(this.provider.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question, answers: answers })
      });
      if (!res.ok) throw new Error("Grading proxy error " + res.status);
      return res.json(); // expected: { mode: "graded", parts: [...], score, max }
    }
  };
})();
/* --- src/js/components/carousel.js --- */
/* Physics Solved — course carousel.
 * <div data-ps-app="carousel" data-subject="physics"></div>
 * Renders one card per course in the given subject, straight from registry.json.
 * Scroll-snap track, prev/next arrows, edge-fade masks, keyboard arrows.
 */
(function () {
  "use strict";
  var PS = window.PS;

  function card(course) {
    var live = course.status === "live" && course.url;
    var accent = course.accent || "#2547d0";
    var cover = PS.h("div.ps-course-cover", {
      style: "--ps-accent:" + accent,
      "aria-hidden": "true"
    }, PS.h("span.ps-course-cover-mark", {}, initials(course.label)));

    var body = PS.h("div.ps-course-body", {}, [
      course.eyebrow ? PS.h("div.ps-eyebrow", {}, course.eyebrow) : null,
      PS.h("h3.ps-course-title", {}, course.label),
      course.blurb ? PS.h("p.ps-course-blurb", {}, course.blurb) : null,
      course.status === "coming-soon"
        ? PS.h("span.ps-badge.ps-badge--muted", {}, "Coming soon")
        : PS.h("span.ps-course-cta", { "aria-hidden": "true" }, "Open course →")
    ]);

    if (live) {
      return PS.h("a.ps-card.ps-course-card", {
        href: course.url,
        style: "--ps-accent:" + accent,
        "aria-label": course.label + (course.eyebrow ? " — " + course.eyebrow : "")
      }, [cover, body]);
    }
    return PS.h("div.ps-card.ps-course-card.is-coming", {
      style: "--ps-accent:" + accent,
      "aria-disabled": "true"
    }, [cover, body]);
  }

  function initials(label) {
    return String(label || "")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w[0]; })
      .join("")
      .toUpperCase();
  }

  PS.register("carousel", async function (el) {
    var subjectId = el.getAttribute("data-subject") || "physics";
    var reg = await PS.getRegistry();
    var subject = (reg.subjects || []).find(function (s) { return s.id === subjectId; });
    el.innerHTML = "";
    if (!subject || !subject.courses || !subject.courses.length) {
      el.appendChild(PS.h("div.ps-state", {}, "No courses found for “" + subjectId + "”."));
      return;
    }

    var track = PS.h("div.ps-carousel-track", { role: "list", tabindex: "0",
      "aria-label": subject.label + " courses" });
    subject.courses.forEach(function (c) {
      var wrap = PS.h("div.ps-carousel-item", { role: "listitem" }, card(c));
      track.appendChild(wrap);
    });

    var prev = PS.h("button.ps-carousel-arrow.ps-carousel-arrow--prev", {
      type: "button", "aria-label": "Previous courses" }, arrow("left"));
    var next = PS.h("button.ps-carousel-arrow.ps-carousel-arrow--next", {
      type: "button", "aria-label": "Next courses" }, arrow("right"));

    var viewport = PS.h("div.ps-carousel-viewport", {}, track);
    var carousel = PS.h("div.ps-carousel", {}, [prev, viewport, next]);
    el.appendChild(carousel);

    function step() {
      var item = track.querySelector(".ps-carousel-item");
      return item ? item.getBoundingClientRect().width + 16 : 280;
    }
    function scrollBy(dir) {
      track.scrollBy({ left: dir * step(), behavior: PS.reducedMotion() ? "auto" : "smooth" });
    }
    prev.addEventListener("click", function () { scrollBy(-1); });
    next.addEventListener("click", function () { scrollBy(1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollBy(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); scrollBy(-1); }
    });

    function update() {
      var maxScroll = track.scrollWidth - track.clientWidth - 1;
      var x = track.scrollLeft;
      prev.disabled = x <= 0;
      next.disabled = x >= maxScroll;
      carousel.classList.toggle("has-fade-start", x > 4);
      carousel.classList.toggle("has-fade-end", x < maxScroll - 4);
    }
    track.addEventListener("scroll", function () {
      window.requestAnimationFrame(update);
    });
    window.addEventListener("resize", update);
    update();
    PS.reveal(carousel);
  });

  function arrow(dir) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }
})();
/* --- src/js/components/equation-finder.js --- */
/* Physics Solved — equation finder.
 * <div data-ps-app="equation-finder" data-course="ap-physics-1"></div>
 * Accordion of units; check the variables you know and the equations that use
 * them are revealed. Match mode is "any" (>=1 checked) or "all" (every use
 * checked). data-course selects data/equations/<course>.json.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("equation-finder", async function (el) {
    var course = el.getAttribute("data-course");
    if (!course) {
      el.innerHTML = "";
      el.appendChild(PS.h("div.ps-state.ps-state--error", {},
        'equation-finder needs a data-course attribute (e.g. "ap-physics-1").'));
      return;
    }
    var data = await PS.fetchJSON("equations/" + course + ".json");
    el.innerHTML = "";

    var mode = "any";
    var units = [];

    var head = PS.h("div.ps-ef-head", {}, [
      PS.h("div.ps-ef-head-text", {}, [
        PS.h("h3.ps-h3", {}, "Equation Finder"),
        PS.h("p.ps-muted", {}, "Check the variables you have — matching equations appear.")
      ]),
      matchToggle()
    ]);
    el.appendChild(head);
    if (data.note) el.appendChild(PS.h("p.ps-ef-note", {}, data.note));

    var acc = PS.h("div.ps-accordion", {});
    (data.units || []).forEach(function (unit, i) {
      acc.appendChild(renderUnit(unit, i));
    });
    el.appendChild(acc);
    PS.reveal(acc);

    function matchToggle() {
      var group = PS.h("div.ps-segment", { role: "group", "aria-label": "Match mode" });
      ["any", "all"].forEach(function (m) {
        var btn = PS.h("button.ps-segment-btn", {
          type: "button",
          "aria-pressed": m === mode ? "true" : "false",
          "data-mode": m
        }, m === "any" ? "Match any" : "Match all");
        btn.addEventListener("click", function () {
          mode = m;
          group.querySelectorAll(".ps-segment-btn").forEach(function (b) {
            b.setAttribute("aria-pressed", b.getAttribute("data-mode") === mode ? "true" : "false");
          });
          units.forEach(function (u) { u.apply(); });
        });
        group.appendChild(btn);
      });
      return group;
    }

    function renderUnit(unit, index) {
      var checked = Object.create(null);
      var vars = unit.variables || [];
      var eqs = unit.equations || [];
      var open = index === 0;

      var count = PS.h("span.ps-ef-count", { "aria-live": "polite" }, "");
      var caret = PS.h("span.ps-accordion-caret", { "aria-hidden": "true" });
      var panelId = "ps-ef-" + course + "-" + index;
      var btn = PS.h("button.ps-accordion-head", {
        type: "button",
        "aria-expanded": open ? "true" : "false",
        "aria-controls": panelId
      }, [
        PS.h("span.ps-accordion-title", {}, [
          unit.title,
          PS.h("span.ps-accordion-meta", {}, " · " + vars.length + " variable" + (vars.length === 1 ? "" : "s"))
        ]),
        count,
        caret
      ]);

      var grid = PS.h("div.ps-var-grid", {});
      vars.forEach(function (v) {
        var id = panelId + "-v-" + slug(v.sym);
        var input = PS.h("input", { type: "checkbox", id: id, "data-sym": v.sym });
        input.addEventListener("change", function () {
          if (input.checked) checked[v.sym] = true; else delete checked[v.sym];
          apply();
        });
        var label = PS.h("label.ps-var", { for: id, title: v.name + (v.note ? " — " + v.note : "") }, [
          input,
          PS.h("span.ps-var-sym.ps-mono", {}, v.sym),
          PS.h("span.ps-var-name", {}, v.name)
        ]);
        grid.appendChild(label);
      });

      var list = PS.h("div.ps-eq-list", {});
      var rows = eqs.map(function (eq) {
        var row = PS.h("div.ps-eq", {}, [
          PS.h("span.ps-eq-name", {}, eq.name),
          PS.h("span.ps-eq-expr.ps-mono", {}, eq.expr)
        ]);
        return { node: row, uses: eq.uses || [] };
      });
      rows.forEach(function (r) { list.appendChild(r.node); });

      var panel = PS.h("div.ps-accordion-panel", { id: panelId, hidden: !open }, [
        vars.length ? grid : null,
        list
      ]);

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        panel.hidden = isOpen;
      });

      function apply() {
        var keys = Object.keys(checked);
        var active = keys.length > 0;
        var shown = 0;
        rows.forEach(function (r) {
          var match;
          if (!active) match = true;
          else if (mode === "any") match = r.uses.some(function (u) { return checked[u]; });
          else match = r.uses.length > 0 && r.uses.every(function (u) { return checked[u]; });
          r.node.classList.toggle("is-hidden", !match);
          if (match) shown++;
        });
        count.textContent = active ? shown + " match" + (shown === 1 ? "" : "es") : "";
      }
      apply();
      units.push({ apply: apply });
      return PS.h("div.ps-accordion-item", {}, [btn, panel]);
    }
  });

  function slug(s) {
    return String(s).replace(/[^A-Za-z0-9]/g, function (c) { return "_" + c.charCodeAt(0); });
  }
})();
/* --- src/js/components/formula-library.js --- */
/* Physics Solved — formula sheet library.
 * <div data-ps-app="formula-library"></div>
 * Tab pills are built from every sheet declared on the physics courses in
 * registry.json (so tabs and courses can never disagree). Sheets load lazily.
 * Tablist semantics + arrow-key navigation. Print opens a clean sheet-only page.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("formula-library", async function (el) {
    var subjectId = el.getAttribute("data-subject") || "physics";
    var reg = await PS.getRegistry();
    var subject = (reg.subjects || []).find(function (s) { return s.id === subjectId; });
    el.innerHTML = "";

    // Flatten sheets across the subject's courses -> tab list.
    var tabs = [];
    (subject ? subject.courses : []).forEach(function (course) {
      (course.sheets || []).forEach(function (sh) {
        tabs.push({ id: sh.id, label: sh.label, file: sh.file, accent: course.accent });
      });
    });
    if (!tabs.length) {
      el.appendChild(PS.h("div.ps-state", {}, "No formula sheets are configured."));
      return;
    }

    var tablist = PS.h("div.ps-tabs", { role: "tablist", "aria-label": "Formula sheets" });
    var panel = PS.h("div.ps-tabpanel", { role: "tabpanel", tabindex: "0", "aria-live": "polite" });
    var buttons = [];

    tabs.forEach(function (tab, i) {
      var btn = PS.h("button.ps-tab", {
        type: "button",
        role: "tab",
        id: "ps-tab-" + tab.id,
        "aria-controls": panel.id || "ps-fl-panel",
        "aria-selected": i === 0 ? "true" : "false",
        tabindex: i === 0 ? "0" : "-1",
        style: "--ps-accent:" + (tab.accent || "#2547d0")
      }, tab.label);
      btn.addEventListener("click", function () { select(i); });
      buttons.push(btn);
      tablist.appendChild(btn);
    });
    panel.id = "ps-fl-panel";
    tablist.addEventListener("keydown", onKeydown);

    el.appendChild(tablist);
    el.appendChild(panel);

    var current = -1;
    var loaded = Object.create(null);
    select(0);

    function onKeydown(e) {
      var i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      var n = buttons.length, j = i;
      if (e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      else return;
      e.preventDefault();
      buttons[j].focus();
      select(j);
    }

    function select(i) {
      if (i === current) return;
      current = i;
      buttons.forEach(function (b, k) {
        var on = k === i;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", buttons[i].id);
      renderSheet(tabs[i]);
    }

    async function renderSheet(tab) {
      panel.innerHTML = "";
      panel.appendChild(PS.h("div.ps-state.ps-state--loading", {}, "Loading sheet…"));
      var data;
      try {
        data = loaded[tab.id] || (loaded[tab.id] = await PS.fetchJSON(tab.file));
      } catch (err) {
        panel.innerHTML = "";
        panel.appendChild(PS.h("div.ps-state.ps-state--error", {}, "Could not load this sheet."));
        return;
      }
      panel.innerHTML = "";
      panel.appendChild(sheetNode(data, tab.accent));
    }
  });

  function sheetNode(data, accent) {
    var sheet = PS.h("div.ps-sheet", { style: "--ps-accent:" + (accent || "#2547d0") });

    var header = PS.h("div.ps-sheet-head", {}, [
      PS.h("div", {}, [
        PS.h("h3.ps-sheet-title", {}, data.title || "Formula Sheet"),
        data.tagline ? PS.h("p.ps-sheet-tagline.ps-muted", {}, data.tagline) : null
      ]),
      printButton(sheet, data.title || "Formula Sheet")
    ]);
    sheet.appendChild(header);

    if (data.constants && data.constants.length) {
      var strip = PS.h("div.ps-constants", { "aria-label": "Constants" });
      data.constants.forEach(function (c) {
        strip.appendChild(PS.h("span.ps-constant", {}, [
          PS.h("span.ps-constant-sym.ps-mono", {}, c.sym),
          PS.h("span.ps-constant-val.ps-mono", {}, c.value)
        ]));
      });
      sheet.appendChild(strip);
    }

    var grid = PS.h("div.ps-sheet-grid");
    (data.categories || []).forEach(function (cat) {
      var card = PS.h("div.ps-card.ps-sheet-card", {}, [
        PS.h("h4.ps-sheet-cat", {}, cat.title)
      ]);
      var rows = PS.h("div.ps-sheet-rows");
      (cat.rows || []).forEach(function (row) {
        rows.appendChild(PS.h("div.ps-sheet-row", {}, [
          PS.h("span.ps-sheet-row-name", {}, row.name),
          PS.h("span.ps-sheet-row-expr.ps-mono", {}, row.expr)
        ]));
      });
      card.appendChild(rows);
      grid.appendChild(card);
    });
    sheet.appendChild(grid);
    return sheet;
  }

  function printButton(sheet, title) {
    var btn = PS.h("button.ps-btn.ps-btn--dark", { type: "button" }, "Print / Save PDF");
    btn.addEventListener("click", function () { printSheet(sheet, title); });
    return btn;
  }

  // Print just the sheet in a clean popup, styled by the CDN stylesheet, so the
  // surrounding Squarespace page is never touched (no body/html rules needed).
  function printSheet(sheet, title) {
    var win = window.open("", "_blank", "width=900,height=1000");
    if (!win) { window.print(); return; } // popup blocked -> best effort
    // Absolute URL so it resolves inside the about:blank popup (base may be relative).
    var css = new URL(PS.base + "dist/physics-solved.min.css", document.baseURI).href;
    win.document.open();
    win.document.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<title>' + PS.escape(title) + '</title>' +
      '<link rel="stylesheet" href="' + PS.escape(css) + '">' +
      '</head><body class="ps-print-body"><div class="ps-root ps-print-doc">' +
      sheet.outerHTML + "</div></body></html>"
    );
    win.document.close();
    var go = function () { win.focus(); win.print(); };
    // Give the stylesheet a moment to load, then print.
    if (win.document.readyState === "complete") setTimeout(go, 250);
    else win.addEventListener("load", function () { setTimeout(go, 150); });
  }
})();
/* --- src/js/components/frq.js --- */
/* Physics Solved — FRQ practice.
 * <div data-ps-app="frq"></div>
 * Filter pills + question list (left) and a viewer (right). Students type
 * answers per part; "Check my work" runs PS.grading.grade(). With no grading
 * provider set it reveals model answers with a self-assessment score. Filters
 * and badges are derived from registry.json; there are NO direct API calls.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("frq", async function (el) {
    var reg = await PS.getRegistry();
    var data = await PS.fetchJSON("frq/physics.json");
    el.innerHTML = "";

    var physics = (reg.subjects || []).find(function (s) { return s.id === "physics"; }) || { courses: [] };
    var courseById = {};
    physics.courses.forEach(function (c) { courseById[c.id] = c; });
    var frqCourses = physics.courses.filter(function (c) {
      return (c.features || []).indexOf("frq") !== -1;
    });
    var questions = data.questions || [];
    var filter = "all";
    var selectedId = null;

    /* ---- Filter pills (from registry) -------------------------------- */
    var pills = PS.h("div.ps-pills", { role: "tablist", "aria-label": "Filter questions by course" });
    var pillDefs = [{ id: "all", label: "All" }].concat(frqCourses.map(function (c) {
      return { id: c.id, label: c.label, accent: c.accent };
    }));
    var pillBtns = {};
    pillDefs.forEach(function (p) {
      var btn = PS.h("button.ps-pill", {
        type: "button", role: "tab",
        "aria-selected": p.id === filter ? "true" : "false",
        style: p.accent ? "--ps-accent:" + p.accent : null
      }, p.label);
      btn.addEventListener("click", function () { setFilter(p.id); });
      pillBtns[p.id] = btn;
      pills.appendChild(btn);
    });

    var randomBtn = PS.h("button.ps-btn.ps-btn--ghost", { type: "button" }, "🎲 Random question");
    randomBtn.addEventListener("click", pickRandom);

    var controls = PS.h("div.ps-frq-controls", {}, [pills, randomBtn]);

    /* ---- Layout ------------------------------------------------------ */
    var listWrap = PS.h("div.ps-frq-list", { role: "list", "aria-label": "Questions" });
    var mobileSelect = PS.h("select.ps-frq-select", { "aria-label": "Choose a question" });
    mobileSelect.addEventListener("change", function () {
      if (mobileSelect.value) selectQuestion(mobileSelect.value);
    });
    var listCol = PS.h("div.ps-frq-listcol", {}, [mobileSelect, listWrap]);

    var viewer = PS.h("div.ps-frq-viewer", {
      role: "region", "aria-live": "polite", "aria-label": "Question viewer"
    });
    var panes = PS.h("div.ps-frq-panes", {}, [listCol, viewer]);

    el.appendChild(controls);
    el.appendChild(panes);
    PS.reveal(panes);

    renderList();
    showEmpty();

    /* ---- Behaviour --------------------------------------------------- */
    function visibleQuestions() {
      return questions.filter(function (q) { return filter === "all" || q.courseId === filter; });
    }

    function setFilter(id) {
      filter = id;
      Object.keys(pillBtns).forEach(function (k) {
        pillBtns[k].setAttribute("aria-selected", k === id ? "true" : "false");
      });
      renderList();
      var vis = visibleQuestions();
      if (!vis.some(function (q) { return q.id === selectedId; })) showEmpty();
    }

    function renderList() {
      listWrap.innerHTML = "";
      mobileSelect.innerHTML = "";
      mobileSelect.appendChild(PS.h("option", { value: "" }, "Select a question…"));
      var vis = visibleQuestions();
      if (!vis.length) {
        listWrap.appendChild(PS.h("div.ps-state", {}, "No questions in this filter yet."));
        return;
      }
      vis.forEach(function (q) {
        var course = courseById[q.courseId] || {};
        var item = PS.h("button.ps-frq-item", {
          type: "button", role: "listitem",
          "data-id": q.id,
          "aria-current": q.id === selectedId ? "true" : "false"
        }, [
          PS.h("span.ps-badge", { style: "--ps-accent:" + (course.accent || "#2547d0") },
            course.label || q.courseId),
          PS.h("span.ps-frq-item-unit", {}, q.unit || ""),
          PS.h("span.ps-frq-item-title", {}, q.title || "Untitled")
        ]);
        item.addEventListener("click", function () { selectQuestion(q.id); });
        listWrap.appendChild(item);

        var opt = PS.h("option", { value: q.id }, (course.label ? course.label + " — " : "") + (q.title || "Untitled"));
        mobileSelect.appendChild(opt);
      });
      if (selectedId) mobileSelect.value = selectedId;
    }

    function pickRandom() {
      var vis = visibleQuestions();
      if (!vis.length) return;
      var q = vis[Math.floor(Math.random() * vis.length)];
      selectQuestion(q.id);
    }

    function markActive(id) {
      listWrap.querySelectorAll(".ps-frq-item").forEach(function (b) {
        b.setAttribute("aria-current", b.getAttribute("data-id") === id ? "true" : "false");
      });
      mobileSelect.value = id;
    }

    function showEmpty() {
      selectedId = null;
      markActive(null);
      viewer.innerHTML = "";
      viewer.appendChild(PS.h("div.ps-frq-empty", {}, [
        PS.h("div.ps-frq-empty-icon", { "aria-hidden": "true" }, "📝"),
        PS.h("p.ps-frq-empty-title", {}, "Pick a question to get started"),
        PS.h("p.ps-muted", {}, "Select a question from the list — or try a random one.")
      ]));
    }

    function selectQuestion(id) {
      var q = questions.find(function (x) { return x.id === id; });
      if (!q) return;
      selectedId = id;
      markActive(id);
      renderQuestion(q);
    }

    function renderQuestion(q) {
      var course = courseById[q.courseId] || {};
      viewer.innerHTML = "";

      var header = PS.h("div.ps-frq-qhead", {}, [
        PS.h("span.ps-badge", { style: "--ps-accent:" + (course.accent || "#2547d0") },
          course.label || q.courseId),
        q.unit ? PS.h("span.ps-frq-qunit", {}, q.unit) : null,
        PS.h("h3.ps-frq-qtitle", {}, q.title || "Untitled")
      ]);
      viewer.appendChild(header);
      if (q.scenario) viewer.appendChild(PS.h("p.ps-frq-scenario", {}, q.scenario));

      var partNodes = [];
      var parts = q.parts || [];
      parts.forEach(function (part, i) {
        var taId = "ps-frq-" + q.id + "-p" + i;
        var ta = PS.h("textarea.ps-frq-answer", {
          id: taId, rows: "3", placeholder: "Your answer…"
        });
        var reveal = PS.h("div.ps-frq-reveal", { hidden: true });
        var block = PS.h("div.ps-frq-part", {}, [
          PS.h("label.ps-frq-part-label", { for: taId }, [
            PS.h("span.ps-frq-part-tag", {}, part.label || "Part " + (i + 1)),
            part.points ? PS.h("span.ps-frq-points", {}, part.points + " pt" + (part.points === 1 ? "" : "s")) : null
          ]),
          part.text ? PS.h("p.ps-frq-part-text", {}, part.text) : null,
          ta,
          reveal
        ]);
        partNodes.push({ part: part, ta: ta, reveal: reveal, points: part.points || 1 });
        viewer.appendChild(block);
      });

      var checkBtn = PS.h("button.ps-btn", { type: "button" }, "Check my work");
      var summary = PS.h("div.ps-frq-summary", { role: "status", "aria-live": "polite", hidden: true });
      var actions = PS.h("div.ps-frq-actions", {}, [checkBtn, summary]);
      viewer.appendChild(actions);

      checkBtn.addEventListener("click", async function () {
        var answers = {};
        partNodes.forEach(function (p, i) {
          answers[(p.part.label || "Part " + (i + 1))] = p.ta.value;
        });
        checkBtn.disabled = true;
        checkBtn.textContent = "Checking…";
        var result;
        try {
          result = await PS.grading.grade(q, answers);
        } catch (err) {
          console.error(err);
          checkBtn.disabled = false;
          checkBtn.textContent = "Check my work";
          summary.hidden = false;
          summary.textContent = "Grading service unavailable — try again later.";
          return;
        }
        checkBtn.textContent = "Answers revealed";
        if (result && result.mode === "graded" && result.parts) {
          renderGraded(result);
        } else {
          renderSelfCheck();
        }
      });

      // Self-check: reveal model answers + self-assessment scoring.
      function renderSelfCheck() {
        var state = {}; // index -> "got" | "partial" | "missed"
        partNodes.forEach(function (p, i) {
          p.reveal.hidden = false;
          p.reveal.innerHTML = "";
          if (p.part.modelAnswer) {
            p.reveal.appendChild(PS.h("div.ps-frq-model", {}, [
              PS.h("span.ps-frq-model-tag", {}, "Model answer"),
              PS.h("span.ps-frq-model-text.ps-mono", {}, p.part.modelAnswer)
            ]));
          }
          var seg = PS.h("div.ps-segment.ps-frq-selfassess", { role: "group",
            "aria-label": "How did you do on " + (p.part.label || "this part") + "?" });
          [["got", "Got it"], ["partial", "Partially"], ["missed", "Missed"]].forEach(function (opt) {
            var b = PS.h("button.ps-segment-btn", { type: "button", "data-v": opt[0],
              "aria-pressed": "false" }, opt[1]);
            b.addEventListener("click", function () {
              state[i] = opt[0];
              seg.querySelectorAll(".ps-segment-btn").forEach(function (x) {
                x.setAttribute("aria-pressed", x.getAttribute("data-v") === opt[0] ? "true" : "false");
              });
              updateSummary();
            });
            seg.appendChild(b);
          });
          p.reveal.appendChild(seg);
        });

        function updateSummary() {
          var total = 0, earned = 0, answered = 0;
          partNodes.forEach(function (p, i) {
            total += p.points;
            if (state[i]) {
              answered++;
              earned += state[i] === "got" ? p.points : state[i] === "partial" ? p.points / 2 : 0;
            }
          });
          summary.hidden = false;
          if (!answered) {
            summary.textContent = "Rate each part to see your self-score.";
          } else {
            summary.textContent = "Self-score: " + round(earned) + " / " + total +
              " pts (" + answered + " of " + partNodes.length + " parts rated)";
          }
        }
        updateSummary();
      }

      // Graded mode (enabled by setting PS.grading.provider later).
      function renderGraded(result) {
        partNodes.forEach(function (p, i) {
          var fb = (result.parts[i]) || {};
          p.reveal.hidden = false;
          p.reveal.innerHTML = "";
          p.reveal.appendChild(PS.h("div.ps-frq-model", {}, [
            PS.h("span.ps-frq-model-tag", {}, "Feedback" +
              (fb.score != null ? " · " + fb.score + "/" + (fb.max != null ? fb.max : p.points) : "")),
            PS.h("span.ps-frq-model-text", {}, fb.feedback || "—")
          ]));
        });
        summary.hidden = false;
        summary.textContent = result.score != null
          ? "Score: " + result.score + " / " + (result.max != null ? result.max : "") + " pts"
          : "Graded.";
      }
    }
  });

  function round(n) { return Math.round(n * 10) / 10; }
})();
/* --- src/js/components/simulator-kinematics.js --- */
/* Physics Solved — projectile / kinematics simulator.
 * <div data-ps-app="simulator-kinematics"></div>
 * A dark-panel accent (uses the #101426 ink token, not a separate palette).
 * Launch controls -> canvas trajectory + live data table + equation strip.
 * Honors prefers-reduced-motion (draws the full path instantly).
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("simulator-kinematics", async function (el) {
    el.innerHTML = "";
    var state = { v: 20, angle: 45, h: 0, g: 9.8 };

    var canvas = PS.h("canvas.ps-sim-canvas", { role: "img",
      "aria-label": "Projectile trajectory" });
    var ctx = canvas.getContext("2d");

    var readout = PS.h("div.ps-sim-readout", { "aria-live": "polite" });
    var tableWrap = PS.h("div.ps-sim-tablewrap");
    var eqStrip = PS.h("div.ps-sim-eqstrip.ps-mono");

    var controls = PS.h("div.ps-sim-controls", {}, [
      slider("Launch speed", "v", 1, 60, 1, "m/s"),
      slider("Angle", "angle", 0, 90, 1, "°"),
      slider("Initial height", "h", 0, 50, 1, "m"),
      gravitySelect()
    ]);

    var launchBtn = PS.h("button.ps-btn", { type: "button" }, "▶ Launch");
    var resetBtn = PS.h("button.ps-btn.ps-btn--ghost.ps-btn--on-dark", { type: "button" }, "Reset");
    launchBtn.addEventListener("click", function () { run(); });
    resetBtn.addEventListener("click", function () { compute(); drawStatic(); });
    var buttons = PS.h("div.ps-sim-buttons", {}, [launchBtn, resetBtn]);

    var panel = PS.h("div.ps-sim.ps-sim--dark", {}, [
      PS.h("div.ps-sim-head", {}, [
        PS.h("h3.ps-sim-title", {}, "Kinematics Simulator"),
        PS.h("p.ps-sim-sub", {}, "Projectile launcher — adjust the controls and launch.")
      ]),
      PS.h("div.ps-sim-grid", {}, [
        PS.h("div.ps-sim-left", {}, [canvas, eqStrip]),
        PS.h("div.ps-sim-right", {}, [controls, buttons, readout, tableWrap])
      ])
    ]);
    el.appendChild(panel);
    PS.reveal(panel);

    var traj = [];
    var meta = {};
    var raf = null;

    function slider(label, key, min, max, step, unit) {
      var id = "ps-sim-" + key;
      var out = PS.h("output.ps-sim-val.ps-mono", { for: id }, state[key] + unit);
      var input = PS.h("input.ps-sim-range", {
        id: id, type: "range", min: min, max: max, step: step, value: state[key]
      });
      input.addEventListener("input", function () {
        state[key] = parseFloat(input.value);
        out.textContent = state[key] + unit;
        compute(); drawStatic();
      });
      return PS.h("div.ps-sim-control", {}, [
        PS.h("label.ps-sim-label", { for: id }, [label, out]),
        input
      ]);
    }

    function gravitySelect() {
      var id = "ps-sim-g";
      var sel = PS.h("select.ps-sim-select", { id: id });
      [["Earth", 9.8], ["Moon", 1.6], ["Mars", 3.7], ["Jupiter", 24.8]].forEach(function (o) {
        sel.appendChild(PS.h("option", { value: o[1] }, o[0] + " (" + o[1] + " m/s²)"));
      });
      sel.value = String(state.g);
      sel.addEventListener("change", function () {
        state.g = parseFloat(sel.value); compute(); drawStatic();
      });
      return PS.h("div.ps-sim-control", {}, [
        PS.h("label.ps-sim-label", { for: id }, "Gravity"),
        sel
      ]);
    }

    function compute() {
      var rad = state.angle * Math.PI / 180;
      var vx = state.v * Math.cos(rad);
      var vy0 = state.v * Math.sin(rad);
      var g = state.g, h = state.h;
      var tFlight = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h)) / g;
      var range = vx * tFlight;
      var maxH = h + (vy0 * vy0) / (2 * g);
      meta = { vx: vx, vy0: vy0, tFlight: tFlight, range: range, maxH: maxH };

      traj = [];
      var N = 240;
      for (var i = 0; i <= N; i++) {
        var t = tFlight * i / N;
        traj.push({ t: t, x: vx * t, y: Math.max(0, h + vy0 * t - 0.5 * g * t * t),
          vx: vx, vy: vy0 - g * t });
      }

      eqStrip.innerHTML = "";
      [
        "x = v₀cosθ · t",
        "y = y₀ + v₀sinθ · t − ½gt²",
        "R = " + meta.range.toFixed(1) + " m",
        "t = " + meta.tFlight.toFixed(2) + " s",
        "H = " + meta.maxH.toFixed(1) + " m"
      ].forEach(function (s) { eqStrip.appendChild(PS.h("span.ps-sim-eq", {}, s)); });

      readout.textContent = "Range " + meta.range.toFixed(1) + " m · flight time " +
        meta.tFlight.toFixed(2) + " s · peak height " + meta.maxH.toFixed(1) + " m.";

      renderTable();
    }

    function renderTable() {
      tableWrap.innerHTML = "";
      var table = PS.h("table.ps-sim-table", {});
      var thead = PS.h("thead", {}, PS.h("tr", {}, ["t (s)", "x (m)", "y (m)", "vₓ (m/s)", "v_y (m/s)"].map(function (h) {
        return PS.h("th", { scope: "col" }, h);
      })));
      var tbody = PS.h("tbody");
      var rows = 8;
      for (var i = 0; i <= rows; i++) {
        var p = traj[Math.round(traj.length ? (traj.length - 1) * i / rows : 0)] || { t: 0, x: 0, y: 0, vx: 0, vy: 0 };
        tbody.appendChild(PS.h("tr", {}, [
          p.t.toFixed(2), p.x.toFixed(1), p.y.toFixed(1), p.vx.toFixed(1), p.vy.toFixed(1)
        ].map(function (c) { return PS.h("td.ps-mono", {}, c); })));
      }
      table.appendChild(thead); table.appendChild(tbody);
      tableWrap.appendChild(table);
    }

    function fit() {
      var w = canvas.clientWidth || 480;
      var h = Math.max(220, Math.round(w * 0.6));
      var dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h };
    }

    function mapper(size) {
      var pad = 28;
      var maxX = Math.max(meta.range, 1);
      var maxY = Math.max(meta.maxH, state.h, 1) * 1.1;
      var sx = (size.w - pad * 2) / maxX;
      var sy = (size.h - pad * 2) / maxY;
      return {
        X: function (x) { return pad + x * sx; },
        Y: function (y) { return size.h - pad - y * sy; }
      };
    }

    function drawFrame(upto) {
      var size = fit();
      var m = mapper(size);
      ctx.clearRect(0, 0, size.w, size.h);
      // ground
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, m.Y(0)); ctx.lineTo(size.w - 12, m.Y(0)); ctx.stroke();
      // full faint path
      strokePath(m, traj.length - 1, "rgba(255,255,255,.15)", 1.5);
      // travelled path
      strokePath(m, upto, "#5f7cf0", 2.5);
      // projectile
      var p = traj[Math.min(upto, traj.length - 1)];
      if (p) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(m.X(p.x), m.Y(p.y), 5, 0, Math.PI * 2); ctx.fill();
      }
      // apex marker
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText("apex " + meta.maxH.toFixed(1) + " m", m.X(meta.range / 2) - 24, m.Y(meta.maxH) - 8);
    }

    function strokePath(m, upto, color, width) {
      if (!traj.length) return;
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath();
      for (var i = 0; i <= upto && i < traj.length; i++) {
        var q = traj[i];
        if (i === 0) ctx.moveTo(m.X(q.x), m.Y(q.y));
        else ctx.lineTo(m.X(q.x), m.Y(q.y));
      }
      ctx.stroke();
    }

    function drawStatic() { drawFrame(traj.length - 1); }

    function run() {
      if (raf) cancelAnimationFrame(raf);
      if (PS.reducedMotion()) { drawStatic(); return; }
      var start = null;
      var duration = Math.min(2400, Math.max(700, meta.tFlight * 600));
      function tick(ts) {
        if (start == null) start = ts;
        var k = Math.min(1, (ts - start) / duration);
        drawFrame(Math.round(k * (traj.length - 1)));
        if (k < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawStatic, 120);
    });

    compute();
    // Canvas needs layout before first draw.
    requestAnimationFrame(drawStatic);
  });
})();
/* --- src/js/components/portfolio.js --- */
/* Physics Solved — portfolio.
 * <div data-ps-app="portfolio"></div>
 * Hero intro, filter pills (All / Engineering / Coding / Physics Tools), a
 * responsive card grid (featured cards larger) that expands in place — no modal.
 * Data from data/portfolio.json.
 */
(function () {
  "use strict";
  var PS = window.PS;

  var TAGS = [
    { id: "all", label: "All" },
    { id: "engineering", label: "Engineering" },
    { id: "coding", label: "Coding" },
    { id: "physics-tools", label: "Physics Tools" }
  ];
  var TAG_LABEL = { engineering: "Engineering", coding: "Coding", "physics-tools": "Physics Tools" };

  PS.register("portfolio", async function (el) {
    var data = await PS.fetchJSON("portfolio.json");
    el.innerHTML = "";
    var projects = data.projects || [];
    var filter = "all";

    if (data.intro) el.appendChild(PS.h("p.ps-portfolio-intro", {}, data.intro));

    var pills = PS.h("div.ps-pills", { role: "tablist", "aria-label": "Filter projects" });
    var pillBtns = {};
    TAGS.forEach(function (t) {
      var btn = PS.h("button.ps-pill", { type: "button", role: "tab",
        "aria-selected": t.id === filter ? "true" : "false" }, t.label);
      btn.addEventListener("click", function () { setFilter(t.id); });
      pillBtns[t.id] = btn;
      pills.appendChild(btn);
    });
    el.appendChild(pills);

    var grid = PS.h("div.ps-portfolio-grid");
    el.appendChild(grid);
    PS.reveal(grid);

    var cards = projects.map(function (p) { return { project: p, node: card(p) }; });
    cards.forEach(function (c) { grid.appendChild(c.node); });
    apply();

    function setFilter(id) {
      filter = id;
      Object.keys(pillBtns).forEach(function (k) {
        pillBtns[k].setAttribute("aria-selected", k === id ? "true" : "false");
      });
      apply();
    }

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var tags = c.project.tags || [];
        var match = filter === "all" || tags.indexOf(filter) !== -1;
        c.node.hidden = !match;
        if (match) shown++;
      });
      var empty = grid.querySelector(".ps-portfolio-empty");
      if (!shown && !empty) grid.appendChild(PS.h("div.ps-portfolio-empty.ps-state", {}, "No projects in this filter."));
      else if (shown && empty) empty.remove();
    }
  });

  function card(p) {
    var featured = !!p.featured;
    var cover = coverNode(p);

    var chips = PS.h("div.ps-chips", {}, (p.tags || []).map(function (t) {
      return PS.h("span.ps-chip", {}, TAG_LABEL[t] || t);
    }));

    var tech = (p.tech && p.tech.length)
      ? PS.h("ul.ps-tech", { "aria-label": "Tech used" }, p.tech.map(function (t) {
          return PS.h("li.ps-tech-item.ps-mono", {}, t);
        }))
      : null;

    var links = (p.links && p.links.length)
      ? PS.h("div.ps-portfolio-links", {}, p.links.map(function (l) {
          return PS.h("a.ps-link", { href: l.url,
            target: /^https?:/.test(l.url || "") ? "_blank" : null,
            rel: /^https?:/.test(l.url || "") ? "noopener" : null }, l.label);
        }))
      : null;

    var descId = "ps-proj-" + (p.id || Math.random().toString(36).slice(2));
    var desc = PS.h("div.ps-portfolio-desc", { id: descId, hidden: true },
      PS.h("p", {}, p.description || ""));

    var toggle = p.description
      ? PS.h("button.ps-portfolio-toggle", { type: "button",
          "aria-expanded": "false", "aria-controls": descId }, "Read more")
      : null;
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        toggle.textContent = open ? "Read more" : "Show less";
        desc.hidden = open;
      });
    }

    return PS.h("article.ps-card.ps-portfolio-card" + (featured ? ".is-featured" : ""), {}, [
      cover,
      PS.h("div.ps-portfolio-body", {}, [
        PS.h("div.ps-portfolio-titlerow", {}, [
          PS.h("h3.ps-portfolio-title", {}, p.title || "Untitled"),
          p.year ? PS.h("span.ps-portfolio-year.ps-mono", {}, String(p.year)) : null
        ]),
        chips,
        p.summary ? PS.h("p.ps-portfolio-summary", {}, p.summary) : null,
        tech,
        links,
        toggle,
        desc
      ])
    ]);
  }

  function coverNode(p) {
    if (p.images && p.images.length) {
      return PS.h("div.ps-portfolio-cover", {}, PS.h("img.ps-portfolio-img", {
        src: p.images[0], alt: p.title || "", loading: "lazy" }));
    }
    var hue = hash(p.title || p.id || "x") % 360;
    return PS.h("div.ps-portfolio-cover.ps-portfolio-cover--gradient", {
      style: "--ps-h:" + hue, "aria-hidden": "true"
    }, PS.h("span.ps-portfolio-cover-mark", {}, (p.title || "•").slice(0, 1).toUpperCase()));
  }

  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
})();

===== END FILE =====

===== FILE: scripts/build.mjs =====
/* Physics Solved — build.
 * Concatenates the source CSS + JS in a fixed order and writes the two dist
 * bundles. If esbuild is installed it is used to minify; otherwise a safe
 * concat (with light CSS whitespace stripping) is written instead — so the
 * build always works with zero required dependencies.
 *
 *   node scripts/build.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Order matters: tokens define the vars components use; core defines PS before
// components register on it.
const CSS_FILES = [
  "src/css/tokens.css",
  "src/css/components.css",
  "src/css/print.css"
];
const JS_FILES = [
  "src/js/core.js",
  "src/js/grading-adapter.js",
  "src/js/components/carousel.js",
  "src/js/components/equation-finder.js",
  "src/js/components/formula-library.js",
  "src/js/components/frq.js",
  "src/js/components/simulator-kinematics.js",
  "src/js/components/portfolio.js"
];

const BANNER = "/* Physics Solved bundle — generated by scripts/build.mjs. Edit src/, not dist/. */\n";

async function concat(files) {
  const parts = [];
  for (const f of files) {
    parts.push("/* --- " + f + " --- */");
    parts.push(await readFile(path.join(ROOT, f), "utf8"));
  }
  return parts.join("\n");
}

// Conservative CSS minifier: strips comments and needless whitespace WITHOUT
// touching whitespace around ":" (would break descendant selectors like
// ".ps-root :focus-visible").
function lightCssMinify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

async function loadEsbuild() {
  try {
    return await import("esbuild");
  } catch {
    return null;
  }
}

function kb(str) {
  return (Buffer.byteLength(str, "utf8") / 1024).toFixed(1) + " KB";
}

async function run() {
  await mkdir(path.join(ROOT, "dist"), { recursive: true });
  const esbuild = await loadEsbuild();

  const cssSrc = await concat(CSS_FILES);
  const jsSrc = await concat(JS_FILES);

  let cssOut, jsOut, mode;
  if (esbuild) {
    mode = "esbuild (minified)";
    cssOut = (await esbuild.transform(cssSrc, { loader: "css", minify: true })).code;
    jsOut = (await esbuild.transform(jsSrc, { loader: "js", minify: true, target: "es2020" })).code;
  } else {
    mode = "concat (esbuild not found — install it for true minification)";
    cssOut = lightCssMinify(cssSrc);
    jsOut = jsSrc;
  }

  const cssPath = path.join(ROOT, "dist", "physics-solved.min.css");
  const jsPath = path.join(ROOT, "dist", "physics-solved.min.js");
  await writeFile(cssPath, BANNER + cssOut + "\n");
  await writeFile(jsPath, BANNER + jsOut + "\n");

  console.log("Physics Solved build — " + mode);
  console.log("  dist/physics-solved.min.css  " + kb(cssOut));
  console.log("  dist/physics-solved.min.js   " + kb(jsOut));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

===== END FILE =====

===== FILE: scripts/serve.ps1 =====
# Physics Solved — zero-dependency static server for previewing the demo on
# Windows (no Node or Python required). Serves the repo root; "/" -> demo page.
#
#   powershell -ExecutionPolicy Bypass -File scripts\serve.ps1
#   then open http://localhost:8123/
#
param(
  [int]$Port = 8123,
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Could not bind to port $Port. Is it already in use? $($_.Exception.Message)"
  exit 1
}
Write-Host "Physics Solved demo: http://localhost:$Port/   (serving $Root)"
Write-Host "Press Ctrl+C to stop."

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".mjs"  = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq "/" -or $path -eq "") { $path = "/demo/index.html" }
    $rel = $path.TrimStart("/") -replace "/", "\"
    $file = Join-Path $Root $rel
    $res.AddHeader("Access-Control-Allow-Origin", "*")
    if ((Test-Path $file) -and -not (Get-Item $file).PSIsContainer) {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $res.OutputStream.Write($buf, 0, $buf.Length)
    }
  } catch {
    Write-Host "ERR $($_.Exception.Message)"
  } finally {
    try { $res.OutputStream.Close() } catch {}
  }
}

===== END FILE =====

===== FILE: squarespace/ap1-simulator.html =====
<!-- ============================================================
     PHYSICS SOLVED — /ap-physics-1 page, "Kinematics Simulator" section.
     Add a Code block here and paste this in.
     ============================================================ -->
<div class="ps-root">
  <section class="ps-section">
    <div data-ps-app="simulator-kinematics"></div>
  </section>
</div>

===== END FILE =====

===== FILE: squarespace/equation-finder.html =====
<!-- ============================================================
     PHYSICS SOLVED — COURSE pages, "Equation Finder" section.
     Add a Code block here and paste this in. Change data-course to
     match the page you are on (this is the ONLY thing that varies):
        /ap-physics-1    -> data-course="ap-physics-1"
        /ap-physics-2    -> data-course="ap-physics-2"
        /ap-physics-c    -> data-course="ap-physics-c"
        /ib-physics      -> data-course="ib-physics"
        /college-physics -> data-course="college-physics"
     ============================================================ -->
<div class="ps-root">
  <section class="ps-section">
    <div data-ps-app="equation-finder" data-course="ap-physics-1"></div>
  </section>
</div>

===== END FILE =====

===== FILE: squarespace/home-carousels.html =====
<!-- ============================================================
     PHYSICS SOLVED — HOME page, "Choose your course" section.
     Add a Code block here and paste this in.
     ============================================================ -->
<div class="ps-root">
  <section class="ps-section">
    <div class="ps-section-head">
      <div class="ps-eyebrow">Study tools</div>
      <h2 class="ps-h2">Choose your course</h2>
      <p>Interactive equation finders, formula sheets, and practice — one set per class.</p>
    </div>
    <h3 class="ps-h3" style="margin-bottom:12px">Physics</h3>
    <div data-ps-app="carousel" data-subject="physics"></div>
    <h3 class="ps-h3" style="margin:32px 0 12px">Chemistry</h3>
    <div data-ps-app="carousel" data-subject="chemistry"></div>
  </section>
</div>

===== END FILE =====

===== FILE: squarespace/home-formula-library.html =====
<!-- ============================================================
     PHYSICS SOLVED — HOME page, "Formula Sheet Library" section.
     Add a Code block here and paste this in. Tabs are built from
     registry.json, so they stay in sync with your courses.
     ============================================================ -->
<div class="ps-root">
  <section class="ps-section">
    <div class="ps-section-head">
      <div class="ps-eyebrow">Reference</div>
      <h2 class="ps-h2">Formula Sheet Library</h2>
      <p>Every constant and equation, grouped by topic and ready to print.</p>
    </div>
    <div data-ps-app="formula-library" data-subject="physics"></div>
  </section>
</div>

===== END FILE =====

===== FILE: squarespace/home-frq.html =====
<!-- ============================================================
     PHYSICS SOLVED — HOME page, "FRQ Practice" section.
     Add a Code block here and paste this in. Filters come from
     registry.json; questions come from data/frq/physics.json.
     ============================================================ -->
<div class="ps-root">
  <section class="ps-section">
    <div class="ps-section-head">
      <div class="ps-eyebrow">Practice</div>
      <h2 class="ps-h2">Free-Response Practice</h2>
      <p>Work a problem part by part, then check against the model answer.</p>
    </div>
    <div data-ps-app="frq"></div>
  </section>
</div>

===== END FILE =====

===== FILE: squarespace/portfolio.html =====
<!-- ============================================================
     PHYSICS SOLVED — PORTFOLIO page.
     Add a Code block here and paste this in. Projects come from
     data/portfolio.json.
     ============================================================ -->
<div class="ps-root">
  <section class="ps-section">
    <div class="ps-section-head">
      <div class="ps-eyebrow">Portfolio</div>
      <h2 class="ps-h2">Engineering &amp; coding projects</h2>
    </div>
    <div data-ps-app="portfolio"></div>
  </section>
</div>

===== END FILE =====

===== FILE: squarespace/site-header-injection.html =====
<!-- ============================================================
     PHYSICS SOLVED — SITE HEADER INJECTION
     Paste into: Settings → Advanced → Code Injection → HEADER
     Replace USER with your GitHub username (see README).
     Loads the one shared CSS + JS bundle from jsDelivr for every page.
     Each page section is wrapped in .ps-root by its own snippet, so the
     design tokens never leak into your Squarespace theme.
     ============================================================ -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/USER/physics-solved@v1/dist/physics-solved.min.css">
<script defer src="https://cdn.jsdelivr.net/gh/USER/physics-solved@v1/dist/physics-solved.min.js"></script>

===== END FILE =====

===== FILE: src/css/components.css =====
/* Physics Solved — component styles.
 * Every selector is scoped under .ps-* (or .ps-root descendant). No *, body,
 * or html rules — nothing leaks into the Squarespace theme.
 * Breakpoints: >960 (default), <=960 (tablet), <=640 (mobile).
 */

/* ============================ Base / utilities ======================= */
.ps-root { box-sizing: border-box; }
.ps-root *,
.ps-root *::before,
.ps-root *::after { box-sizing: inherit; }

.ps-root :focus-visible {
  outline: 2px solid var(--ps-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.ps-mono { font-family: var(--ps-font-mono); }
.ps-muted { color: var(--ps-muted); }

.ps-h2 { font-size: var(--ps-fs-xl); font-weight: 700; line-height: 1.15; margin: 0; letter-spacing: -.01em; }
.ps-h3 { font-size: var(--ps-fs-lg); font-weight: 700; line-height: 1.2; margin: 0; }

.ps-eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
  color: var(--ps-accent);
}

.ps-section { margin: 0 auto; max-width: 1120px; padding: var(--ps-s6) var(--ps-s4); }
.ps-section-head { margin-bottom: var(--ps-s5); }
.ps-section-head .ps-h2 { margin-top: var(--ps-s1); }
.ps-section-head p { color: var(--ps-muted); margin: var(--ps-s2) 0 0; max-width: 60ch; }

.ps-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; line-height: 1;
  padding: 4px 9px; border-radius: 999px;
  color: var(--ps-accent);
  background: color-mix(in srgb, var(--ps-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--ps-accent) 22%, transparent);
  white-space: nowrap;
}
.ps-badge--muted {
  color: var(--ps-muted);
  background: color-mix(in srgb, var(--ps-muted) 12%, transparent);
  border-color: var(--ps-border);
}

/* Loading / error states */
.ps-state {
  display: flex; align-items: center; justify-content: center;
  min-height: 100px; padding: var(--ps-s5);
  color: var(--ps-muted); font-size: var(--ps-fs-sm);
  text-align: center;
}
.ps-state--error { color: #a12525; }

/* First-reveal animation (<=200ms). Disabled for reduced motion. */
.ps-reveal { opacity: 0; transform: translateY(8px); }
.ps-reveal.is-in { opacity: 1; transform: none; transition: opacity 200ms ease, transform 200ms ease; }
@media (prefers-reduced-motion: reduce) {
  .ps-reveal, .ps-reveal.is-in { opacity: 1; transform: none; transition: none; }
}

/* ============================ Buttons =============================== */
.ps-btn {
  --btn-bg: var(--ps-accent);
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-sm); font-weight: 600;
  line-height: 1; cursor: pointer;
  padding: 10px 16px; border-radius: var(--ps-radius-sm);
  border: 1px solid transparent; background: var(--btn-bg); color: #fff;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.ps-btn:hover { --btn-bg: var(--ps-accent-hover); }
.ps-btn:disabled { opacity: .55; cursor: default; }

.ps-btn--ghost {
  background: transparent; color: var(--ps-accent);
  border-color: var(--ps-border);
}
.ps-btn--ghost:hover {
  background: color-mix(in srgb, var(--ps-accent) 8%, transparent);
  border-color: color-mix(in srgb, var(--ps-accent) 40%, transparent);
}
.ps-btn--dark {
  background: var(--ps-ink); color: #fff; border-color: var(--ps-ink);
}
.ps-btn--dark:hover { --btn-bg: var(--ps-ink); background: #1e2540; }
.ps-btn--on-dark {
  background: transparent; color: #eef1fb;
  border-color: rgba(255,255,255,.28);
}
.ps-btn--on-dark:hover { background: rgba(255,255,255,.10); }

/* ============================ Card ================================= */
.ps-card {
  background: var(--ps-surface);
  border: 1px solid var(--ps-border);
  border-radius: var(--ps-radius);
  box-shadow: var(--ps-shadow);
}

/* ============================ Pills / Tabs / Segment =============== */
.ps-pills { display: flex; flex-wrap: wrap; gap: var(--ps-s2); }
.ps-pill {
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600;
  cursor: pointer; padding: 7px 14px; border-radius: 999px;
  border: 1px solid var(--ps-border); background: var(--ps-surface); color: var(--ps-muted);
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.ps-pill:hover { color: var(--ps-ink); border-color: color-mix(in srgb, var(--ps-ink) 20%, var(--ps-border)); }
.ps-pill[aria-selected="true"] {
  color: #fff; background: var(--ps-accent); border-color: var(--ps-accent);
}

.ps-tabs { display: flex; flex-wrap: wrap; gap: var(--ps-s2); border-bottom: 1px solid var(--ps-border); padding-bottom: var(--ps-s3); }
.ps-tab {
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600;
  cursor: pointer; padding: 8px 14px; border-radius: 999px;
  border: 1px solid var(--ps-border); background: var(--ps-surface); color: var(--ps-muted);
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.ps-tab:hover { color: var(--ps-ink); }
.ps-tab[aria-selected="true"] {
  color: #fff;
  background: var(--ps-accent, #2547d0);
  border-color: var(--ps-accent, #2547d0);
}
.ps-tabpanel { padding-top: var(--ps-s5); }

.ps-segment {
  display: inline-flex; border: 1px solid var(--ps-border); border-radius: 999px;
  overflow: hidden; background: var(--ps-surface);
}
.ps-segment-btn {
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600;
  cursor: pointer; padding: 6px 13px; border: 0; background: transparent; color: var(--ps-muted);
  border-right: 1px solid var(--ps-border);
}
.ps-segment-btn:last-child { border-right: 0; }
.ps-segment-btn[aria-pressed="true"] { background: var(--ps-accent); color: #fff; }

.ps-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ps-chip {
  font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px;
  color: var(--ps-muted); background: var(--ps-bg); border: 1px solid var(--ps-border);
}
.ps-link { color: var(--ps-accent); font-weight: 600; text-decoration: none; font-size: var(--ps-fs-sm); }
.ps-link:hover { text-decoration: underline; }

/* ============================ Carousel ============================= */
.ps-carousel { position: relative; display: flex; align-items: center; gap: var(--ps-s2); }
.ps-carousel-viewport { position: relative; flex: 1; overflow: hidden; }
.ps-carousel-viewport::before,
.ps-carousel-viewport::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 40px; z-index: 2;
  pointer-events: none; opacity: 0; transition: opacity 150ms ease;
}
.ps-carousel-viewport::before { left: 0; background: linear-gradient(90deg, var(--ps-bg), transparent); }
.ps-carousel-viewport::after { right: 0; background: linear-gradient(270deg, var(--ps-bg), transparent); }
.ps-carousel.has-fade-start .ps-carousel-viewport::before { opacity: 1; }
.ps-carousel.has-fade-end .ps-carousel-viewport::after { opacity: 1; }

.ps-carousel-track {
  display: flex; gap: var(--ps-s4); overflow-x: auto; scroll-snap-type: x mandatory;
  scroll-behavior: smooth; padding: var(--ps-s2) var(--ps-s1) var(--ps-s4);
  scrollbar-width: thin;
}
.ps-carousel-item { scroll-snap-align: start; flex: 0 0 clamp(240px, 30%, 300px); }

.ps-carousel-arrow {
  flex: 0 0 auto; width: 40px; height: 40px; border-radius: 999px;
  display: grid; place-items: center; cursor: pointer;
  background: var(--ps-surface); color: var(--ps-ink);
  border: 1px solid var(--ps-border); box-shadow: var(--ps-shadow);
  transition: background 120ms ease, opacity 120ms ease;
}
.ps-carousel-arrow:hover { background: var(--ps-bg); }
.ps-carousel-arrow:disabled { opacity: .35; cursor: default; }

.ps-course-card { display: flex; flex-direction: column; overflow: hidden; height: 100%; text-decoration: none; color: inherit; transition: box-shadow 150ms ease, transform 150ms ease; }
a.ps-course-card:hover { box-shadow: var(--ps-shadow-md); transform: translateY(-2px); }
.ps-course-card.is-coming { opacity: .92; }
.ps-course-cover {
  height: 96px; position: relative;
  background: linear-gradient(135deg, var(--ps-accent), color-mix(in srgb, var(--ps-accent) 45%, #101426));
  display: grid; place-items: center;
}
.ps-course-cover-mark { font-family: var(--ps-font-mono); font-weight: 500; font-size: 26px; color: rgba(255,255,255,.92); letter-spacing: .04em; }
.ps-course-body { padding: var(--ps-s4); display: flex; flex-direction: column; gap: var(--ps-s2); flex: 1; }
.ps-course-title { font-size: var(--ps-fs-md); font-weight: 700; margin: 0; }
.ps-course-blurb { font-size: var(--ps-fs-xs); color: var(--ps-muted); margin: 0; flex: 1; }
.ps-course-cta { font-size: var(--ps-fs-xs); font-weight: 600; color: var(--ps-accent); margin-top: var(--ps-s1); }

/* ============================ Equation finder ====================== */
.ps-ef-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ps-s4); flex-wrap: wrap; margin-bottom: var(--ps-s3); }
.ps-ef-head-text .ps-muted { margin: var(--ps-s1) 0 0; font-size: var(--ps-fs-xs); }
.ps-ef-note { font-size: var(--ps-fs-xs); color: var(--ps-muted); background: var(--ps-bg); border: 1px dashed var(--ps-border); border-radius: var(--ps-radius-sm); padding: var(--ps-s2) var(--ps-s3); margin: 0 0 var(--ps-s4); }

.ps-accordion { display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-accordion-item { border: 1px solid var(--ps-border); border-radius: var(--ps-radius); background: var(--ps-surface); overflow: hidden; }
.ps-accordion-head {
  width: 100%; display: flex; align-items: center; gap: var(--ps-s3);
  padding: var(--ps-s4); background: transparent; border: 0; cursor: pointer;
  font-family: var(--ps-font-ui); font-size: var(--ps-fs-md); font-weight: 600; color: var(--ps-ink); text-align: left;
}
.ps-accordion-title { flex: 1; }
.ps-accordion-meta { color: var(--ps-muted); font-weight: 500; font-size: var(--ps-fs-xs); }
.ps-ef-count { font-size: var(--ps-fs-xs); font-weight: 600; color: var(--ps-accent); }
.ps-accordion-caret { width: 10px; height: 10px; border-right: 2px solid var(--ps-muted); border-bottom: 2px solid var(--ps-muted); transform: rotate(45deg); transition: transform 150ms ease; }
.ps-accordion-head[aria-expanded="true"] .ps-accordion-caret { transform: rotate(-135deg); }
.ps-accordion-panel { padding: 0 var(--ps-s4) var(--ps-s4); }

.ps-var-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--ps-s2); margin-bottom: var(--ps-s4); }
.ps-var {
  display: flex; align-items: center; gap: var(--ps-s2); cursor: pointer;
  padding: 8px 10px; border: 1px solid var(--ps-border); border-radius: var(--ps-radius-sm);
  background: var(--ps-bg); transition: border-color 120ms ease, background 120ms ease;
}
.ps-var:hover { border-color: color-mix(in srgb, var(--ps-accent) 35%, var(--ps-border)); }
.ps-var input { accent-color: var(--ps-accent); width: 15px; height: 15px; }
.ps-var:has(input:checked) { border-color: var(--ps-accent); background: color-mix(in srgb, var(--ps-accent) 8%, transparent); }
.ps-var-sym { font-size: var(--ps-fs-sm); font-weight: 500; }
.ps-var-name { font-size: 12px; color: var(--ps-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ps-eq-list { display: flex; flex-direction: column; gap: var(--ps-s1); }
.ps-eq {
  display: flex; align-items: baseline; justify-content: space-between; gap: var(--ps-s4);
  padding: 10px 12px; border-radius: var(--ps-radius-sm); background: var(--ps-bg);
  border: 1px solid transparent;
}
.ps-eq.is-hidden { display: none; }
.ps-eq-name { font-size: var(--ps-fs-xs); color: var(--ps-muted); }
.ps-eq-expr { font-size: var(--ps-fs-sm); font-weight: 500; color: var(--ps-ink); text-align: right; }

/* ============================ Formula library ===================== */
.ps-sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ps-s4); flex-wrap: wrap; margin-bottom: var(--ps-s4); }
.ps-sheet-title { font-size: var(--ps-fs-lg); font-weight: 700; margin: 0; }
.ps-sheet-tagline { font-size: var(--ps-fs-xs); margin: var(--ps-s1) 0 0; }

.ps-constants {
  display: flex; flex-wrap: wrap; gap: var(--ps-s2);
  padding: var(--ps-s3); border-radius: var(--ps-radius); background: var(--ps-bg);
  border: 1px solid var(--ps-border); margin-bottom: var(--ps-s5);
}
.ps-constant { display: inline-flex; align-items: baseline; gap: 6px; font-size: var(--ps-fs-xs); padding: 4px 10px; background: var(--ps-surface); border: 1px solid var(--ps-border); border-radius: 999px; }
.ps-constant-sym { font-weight: 500; color: var(--ps-accent); }
.ps-constant-val { color: var(--ps-ink); }

.ps-sheet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--ps-s4); }
.ps-sheet-card { padding: var(--ps-s4); }
.ps-sheet-cat { font-size: var(--ps-fs-sm); font-weight: 700; margin: 0 0 var(--ps-s3); padding-bottom: var(--ps-s2); border-bottom: 1px solid var(--ps-border); }
.ps-sheet-rows { display: flex; flex-direction: column; gap: var(--ps-s2); }
.ps-sheet-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--ps-s3); }
.ps-sheet-row-name { font-size: 12px; color: var(--ps-muted); }
.ps-sheet-row-expr { font-size: var(--ps-fs-xs); font-weight: 500; text-align: right; }

/* ============================ FRQ ================================= */
.ps-frq-controls { display: flex; align-items: center; justify-content: space-between; gap: var(--ps-s4); flex-wrap: wrap; margin-bottom: var(--ps-s5); }
.ps-frq-panes { display: grid; grid-template-columns: minmax(240px, 320px) 1fr; gap: var(--ps-s5); align-items: start; }
.ps-frq-select { display: none; width: 100%; padding: 10px 12px; border: 1px solid var(--ps-border); border-radius: var(--ps-radius-sm); font-family: var(--ps-font-ui); font-size: var(--ps-fs-sm); background: var(--ps-surface); color: var(--ps-ink); }
.ps-frq-list { display: flex; flex-direction: column; gap: var(--ps-s2); max-height: 560px; overflow-y: auto; padding-right: 2px; }
.ps-frq-item {
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  text-align: left; cursor: pointer; padding: var(--ps-s3); width: 100%;
  border: 1px solid var(--ps-border); border-radius: var(--ps-radius); background: var(--ps-surface);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.ps-frq-item:hover { border-color: color-mix(in srgb, var(--ps-accent) 40%, var(--ps-border)); }
.ps-frq-item[aria-current="true"] { border-color: var(--ps-accent); box-shadow: inset 3px 0 0 var(--ps-accent); }
.ps-frq-item-unit { font-size: 12px; color: var(--ps-muted); }
.ps-frq-item-title { font-size: var(--ps-fs-sm); font-weight: 600; }

.ps-frq-viewer { border: 1px solid var(--ps-border); border-radius: var(--ps-radius); background: var(--ps-surface); padding: var(--ps-s5); min-height: 320px; }
.ps-frq-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--ps-s2); min-height: 280px; text-align: center; }
.ps-frq-empty-icon { font-size: 34px; opacity: .8; }
.ps-frq-empty-title { font-size: var(--ps-fs-md); font-weight: 700; margin: 0; }
.ps-frq-empty .ps-muted { margin: 0; }

.ps-frq-qhead { display: flex; align-items: center; flex-wrap: wrap; gap: var(--ps-s2); margin-bottom: var(--ps-s3); }
.ps-frq-qunit { font-size: var(--ps-fs-xs); color: var(--ps-muted); }
.ps-frq-qtitle { flex-basis: 100%; font-size: var(--ps-fs-lg); font-weight: 700; margin: var(--ps-s1) 0 0; }
.ps-frq-scenario { font-size: var(--ps-fs-md); line-height: 1.55; margin: 0 0 var(--ps-s4); }

.ps-frq-part { padding: var(--ps-s4) 0; border-top: 1px solid var(--ps-border); }
.ps-frq-part-label { display: flex; align-items: center; gap: var(--ps-s2); font-weight: 700; font-size: var(--ps-fs-sm); }
.ps-frq-part-tag { color: var(--ps-ink); }
.ps-frq-points { font-size: 12px; font-weight: 600; color: var(--ps-muted); }
.ps-frq-part-text { font-size: var(--ps-fs-sm); margin: var(--ps-s2) 0; }
.ps-frq-answer { width: 100%; resize: vertical; padding: 10px 12px; font-family: var(--ps-font-ui); font-size: var(--ps-fs-sm); border: 1px solid var(--ps-border); border-radius: var(--ps-radius-sm); background: var(--ps-surface); color: var(--ps-ink); }
.ps-frq-answer:focus { border-color: var(--ps-accent); }

.ps-frq-reveal { margin-top: var(--ps-s3); display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-frq-model { background: color-mix(in srgb, var(--ps-success) 8%, transparent); border: 1px solid color-mix(in srgb, var(--ps-success) 30%, transparent); border-radius: var(--ps-radius-sm); padding: var(--ps-s3); display: flex; flex-direction: column; gap: 4px; }
.ps-frq-model-tag { font-size: 12px; font-weight: 700; color: var(--ps-success); text-transform: uppercase; letter-spacing: .04em; }
.ps-frq-model-text { font-size: var(--ps-fs-sm); color: var(--ps-ink); line-height: 1.5; }
.ps-frq-actions { display: flex; align-items: center; gap: var(--ps-s4); flex-wrap: wrap; margin-top: var(--ps-s4); padding-top: var(--ps-s4); border-top: 1px solid var(--ps-border); }
.ps-frq-summary { font-size: var(--ps-fs-sm); font-weight: 600; color: var(--ps-ink); }

/* ============================ Simulator (dark accent) ============= */
.ps-sim--dark {
  background: var(--ps-ink); color: #eef1fb;
  border-radius: var(--ps-radius); padding: var(--ps-s5);
}
.ps-sim-head { margin-bottom: var(--ps-s4); }
.ps-sim-title { font-size: var(--ps-fs-lg); font-weight: 700; margin: 0; color: #fff; }
.ps-sim-sub { font-size: var(--ps-fs-xs); color: rgba(238,241,251,.65); margin: var(--ps-s1) 0 0; }
.ps-sim-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--ps-s5); align-items: start; }
.ps-sim-left { display: flex; flex-direction: column; gap: var(--ps-s3); min-width: 0; }
.ps-sim-canvas { width: 100%; height: auto; display: block; background: #0b0f1e; border: 1px solid rgba(255,255,255,.12); border-radius: var(--ps-radius-sm); }
.ps-sim-eqstrip { display: flex; flex-wrap: wrap; gap: var(--ps-s2); }
.ps-sim-eq { font-size: 12px; padding: 5px 9px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 999px; color: #cfd6f5; }

.ps-sim-right { display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-sim-controls { display: flex; flex-direction: column; gap: var(--ps-s3); }
.ps-sim-control { display: flex; flex-direction: column; gap: 6px; }
.ps-sim-label { display: flex; align-items: center; justify-content: space-between; font-size: var(--ps-fs-xs); font-weight: 600; color: #cfd6f5; }
.ps-sim-val { color: #fff; }
.ps-sim-range { width: 100%; accent-color: #5f7cf0; }
.ps-sim-select { width: 100%; padding: 8px 10px; border-radius: var(--ps-radius-sm); border: 1px solid rgba(255,255,255,.18); background: #0b0f1e; color: #eef1fb; font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); }
.ps-sim-buttons { display: flex; gap: var(--ps-s2); }
.ps-sim-readout { font-size: var(--ps-fs-xs); color: #cfd6f5; }
.ps-sim-tablewrap { overflow-x: auto; }
.ps-sim-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ps-sim-table th, .ps-sim-table td { text-align: right; padding: 5px 8px; border-bottom: 1px solid rgba(255,255,255,.1); }
.ps-sim-table th { color: #aab3dd; font-weight: 600; }
.ps-sim-table td { color: #eef1fb; }

/* ============================ Portfolio =========================== */
.ps-portfolio-intro { font-size: var(--ps-fs-md); color: var(--ps-muted); max-width: 60ch; margin: 0 0 var(--ps-s4); }
.ps-portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--ps-s4); margin-top: var(--ps-s5); align-items: start; }
.ps-portfolio-card { display: flex; flex-direction: column; overflow: hidden; }
.ps-portfolio-card.is-featured { grid-column: span 2; }
.ps-portfolio-cover { height: 120px; overflow: hidden; }
.ps-portfolio-card.is-featured .ps-portfolio-cover { height: 170px; }
.ps-portfolio-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ps-portfolio-cover--gradient { display: grid; place-items: center; background: linear-gradient(135deg, hsl(var(--ps-h) 55% 42%), hsl(var(--ps-h) 60% 24%)); }
.ps-portfolio-cover-mark { font-family: var(--ps-font-mono); font-size: 32px; color: rgba(255,255,255,.9); }
.ps-portfolio-body { padding: var(--ps-s4); display: flex; flex-direction: column; gap: var(--ps-s2); }
.ps-portfolio-titlerow { display: flex; align-items: baseline; justify-content: space-between; gap: var(--ps-s3); }
.ps-portfolio-title { font-size: var(--ps-fs-md); font-weight: 700; margin: 0; }
.ps-portfolio-year { font-size: var(--ps-fs-xs); color: var(--ps-muted); }
.ps-portfolio-summary { font-size: var(--ps-fs-sm); color: var(--ps-ink); margin: 0; }
.ps-tech { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: var(--ps-s1) 0 0; }
.ps-tech-item { font-size: 11px; color: var(--ps-muted); background: var(--ps-bg); border: 1px solid var(--ps-border); border-radius: 5px; padding: 2px 7px; }
.ps-portfolio-links { display: flex; flex-wrap: wrap; gap: var(--ps-s3); margin-top: var(--ps-s1); }
.ps-portfolio-toggle { align-self: flex-start; margin-top: var(--ps-s1); font-family: var(--ps-font-ui); font-size: var(--ps-fs-xs); font-weight: 600; color: var(--ps-accent); background: transparent; border: 0; cursor: pointer; padding: 0; }
.ps-portfolio-toggle:hover { text-decoration: underline; }
.ps-portfolio-desc { font-size: var(--ps-fs-sm); color: var(--ps-ink); line-height: 1.55; border-top: 1px solid var(--ps-border); padding-top: var(--ps-s3); margin-top: var(--ps-s1); }
.ps-portfolio-desc p { margin: 0; }

/* ============================ Responsive ========================== */
@media (max-width: 960px) {
  .ps-sheet-grid { grid-template-columns: repeat(2, 1fr); }
  .ps-var-grid { grid-template-columns: repeat(2, 1fr); }
  .ps-frq-panes { grid-template-columns: 1fr; }
  .ps-frq-list { max-height: none; }
  .ps-sim-grid { grid-template-columns: 1fr; }
  .ps-portfolio-card.is-featured { grid-column: span 1; }
}
@media (max-width: 640px) {
  .ps-section { padding: var(--ps-s5) var(--ps-s3); }
  .ps-sheet-grid { grid-template-columns: 1fr; }
  .ps-var-grid { grid-template-columns: 1fr; }
  .ps-portfolio-grid { grid-template-columns: 1fr; }
  .ps-frq-select { display: block; }
  .ps-frq-list { display: none; }
  .ps-frq-controls { flex-direction: column; align-items: stretch; }
  .ps-carousel-item { flex-basis: 78%; }
  .ps-h2 { font-size: var(--ps-fs-lg); }
}

===== END FILE =====

===== FILE: src/css/print.css =====
/* Physics Solved — print styles for formula sheets.
 * Applies both to the dedicated print popup (opened by "Print / Save PDF")
 * and to a direct browser print of the page. Sheets go black-on-white,
 * two compact columns, with category cards kept whole across page breaks.
 * Still fully scoped under .ps-root — no body/html rules.
 */
@media print {
  .ps-root {
    --ps-ink: #000;
    --ps-muted: #333;
    --ps-border: #999;
    background: #fff;
    color: #000;
  }

  /* Hide all interactive chrome when printing. */
  .ps-tabs,
  .ps-pills,
  .ps-btn,
  .ps-segment,
  .ps-carousel-arrow,
  .ps-portfolio-toggle,
  .ps-frq-controls,
  .ps-sim--dark { display: none !important; }

  .ps-tabpanel { padding-top: 0; }

  .ps-sheet { color: #000; }
  .ps-sheet-title { font-size: 20px; }
  .ps-sheet-tagline { color: #333; }

  .ps-constants { background: transparent; border: 1px solid #999; }
  .ps-constant { background: transparent; border: 1px solid #bbb; }
  .ps-constant-sym { color: #000; }

  .ps-sheet-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ps-sheet-card {
    background: transparent;
    border: 1px solid #000;
    box-shadow: none;
    padding: 10px 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .ps-sheet-cat { border-bottom: 1px solid #000; }
  .ps-sheet-row-name { color: #222; }

  /* The dedicated print popup wraps the sheet in .ps-print-doc. */
  .ps-print-doc { max-width: none; padding: 0; }
  .ps-print-body { margin: 0; }
}

===== END FILE =====

===== FILE: src/css/tokens.css =====
/* Physics Solved — design tokens ("clean light academic").
 * Scoped to .ps-root so nothing leaks into the Squarespace theme.
 * Fonts: Inter (UI) + JetBrains Mono (equations, values, constants).
 */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");

.ps-root {
  /* Color */
  --ps-bg: #fafaf8;
  --ps-surface: #ffffff;
  --ps-ink: #101426;
  --ps-muted: #5a6072;
  --ps-accent: #2547d0;
  --ps-accent-hover: #1c38a8;
  --ps-success: #1a7f4e;
  --ps-border: #e5e7ee;

  /* Shape */
  --ps-radius: 10px;
  --ps-radius-sm: 7px;
  --ps-shadow: 0 1px 3px rgb(16 20 38 / .08);
  --ps-shadow-md: 0 6px 20px rgb(16 20 38 / .10);

  /* Type scale — 13 / 15 / 17 / 22 / 28 / 36 */
  --ps-fs-xs: 13px;
  --ps-fs-sm: 15px;
  --ps-fs-md: 17px;
  --ps-fs-lg: 22px;
  --ps-fs-xl: 28px;
  --ps-fs-2xl: 36px;

  /* Spacing — 4 / 8 / 12 / 16 / 24 / 32 / 48 */
  --ps-s1: 4px;
  --ps-s2: 8px;
  --ps-s3: 12px;
  --ps-s4: 16px;
  --ps-s5: 24px;
  --ps-s6: 32px;
  --ps-s7: 48px;

  /* Fonts */
  --ps-font-ui: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --ps-font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", "Menlo", "Consolas", monospace;

  /* Base */
  color: var(--ps-ink);
  font-family: var(--ps-font-ui);
  font-size: var(--ps-fs-sm);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

===== END FILE =====

===== FILE: src/js/components/carousel.js =====
/* Physics Solved — course carousel.
 * <div data-ps-app="carousel" data-subject="physics"></div>
 * Renders one card per course in the given subject, straight from registry.json.
 * Scroll-snap track, prev/next arrows, edge-fade masks, keyboard arrows.
 */
(function () {
  "use strict";
  var PS = window.PS;

  function card(course) {
    var live = course.status === "live" && course.url;
    var accent = course.accent || "#2547d0";
    var cover = PS.h("div.ps-course-cover", {
      style: "--ps-accent:" + accent,
      "aria-hidden": "true"
    }, PS.h("span.ps-course-cover-mark", {}, initials(course.label)));

    var body = PS.h("div.ps-course-body", {}, [
      course.eyebrow ? PS.h("div.ps-eyebrow", {}, course.eyebrow) : null,
      PS.h("h3.ps-course-title", {}, course.label),
      course.blurb ? PS.h("p.ps-course-blurb", {}, course.blurb) : null,
      course.status === "coming-soon"
        ? PS.h("span.ps-badge.ps-badge--muted", {}, "Coming soon")
        : PS.h("span.ps-course-cta", { "aria-hidden": "true" }, "Open course →")
    ]);

    if (live) {
      return PS.h("a.ps-card.ps-course-card", {
        href: course.url,
        style: "--ps-accent:" + accent,
        "aria-label": course.label + (course.eyebrow ? " — " + course.eyebrow : "")
      }, [cover, body]);
    }
    return PS.h("div.ps-card.ps-course-card.is-coming", {
      style: "--ps-accent:" + accent,
      "aria-disabled": "true"
    }, [cover, body]);
  }

  function initials(label) {
    return String(label || "")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w[0]; })
      .join("")
      .toUpperCase();
  }

  PS.register("carousel", async function (el) {
    var subjectId = el.getAttribute("data-subject") || "physics";
    var reg = await PS.getRegistry();
    var subject = (reg.subjects || []).find(function (s) { return s.id === subjectId; });
    el.innerHTML = "";
    if (!subject || !subject.courses || !subject.courses.length) {
      el.appendChild(PS.h("div.ps-state", {}, "No courses found for “" + subjectId + "”."));
      return;
    }

    var track = PS.h("div.ps-carousel-track", { role: "list", tabindex: "0",
      "aria-label": subject.label + " courses" });
    subject.courses.forEach(function (c) {
      var wrap = PS.h("div.ps-carousel-item", { role: "listitem" }, card(c));
      track.appendChild(wrap);
    });

    var prev = PS.h("button.ps-carousel-arrow.ps-carousel-arrow--prev", {
      type: "button", "aria-label": "Previous courses" }, arrow("left"));
    var next = PS.h("button.ps-carousel-arrow.ps-carousel-arrow--next", {
      type: "button", "aria-label": "Next courses" }, arrow("right"));

    var viewport = PS.h("div.ps-carousel-viewport", {}, track);
    var carousel = PS.h("div.ps-carousel", {}, [prev, viewport, next]);
    el.appendChild(carousel);

    function step() {
      var item = track.querySelector(".ps-carousel-item");
      return item ? item.getBoundingClientRect().width + 16 : 280;
    }
    function scrollBy(dir) {
      track.scrollBy({ left: dir * step(), behavior: PS.reducedMotion() ? "auto" : "smooth" });
    }
    prev.addEventListener("click", function () { scrollBy(-1); });
    next.addEventListener("click", function () { scrollBy(1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollBy(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); scrollBy(-1); }
    });

    function update() {
      var maxScroll = track.scrollWidth - track.clientWidth - 1;
      var x = track.scrollLeft;
      prev.disabled = x <= 0;
      next.disabled = x >= maxScroll;
      carousel.classList.toggle("has-fade-start", x > 4);
      carousel.classList.toggle("has-fade-end", x < maxScroll - 4);
    }
    track.addEventListener("scroll", function () {
      window.requestAnimationFrame(update);
    });
    window.addEventListener("resize", update);
    update();
    PS.reveal(carousel);
  });

  function arrow(dir) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }
})();

===== END FILE =====

===== FILE: src/js/components/equation-finder.js =====
/* Physics Solved — equation finder.
 * <div data-ps-app="equation-finder" data-course="ap-physics-1"></div>
 * Accordion of units; check the variables you know and the equations that use
 * them are revealed. Match mode is "any" (>=1 checked) or "all" (every use
 * checked). data-course selects data/equations/<course>.json.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("equation-finder", async function (el) {
    var course = el.getAttribute("data-course");
    if (!course) {
      el.innerHTML = "";
      el.appendChild(PS.h("div.ps-state.ps-state--error", {},
        'equation-finder needs a data-course attribute (e.g. "ap-physics-1").'));
      return;
    }
    var data = await PS.fetchJSON("equations/" + course + ".json");
    el.innerHTML = "";

    var mode = "any";
    var units = [];

    var head = PS.h("div.ps-ef-head", {}, [
      PS.h("div.ps-ef-head-text", {}, [
        PS.h("h3.ps-h3", {}, "Equation Finder"),
        PS.h("p.ps-muted", {}, "Check the variables you have — matching equations appear.")
      ]),
      matchToggle()
    ]);
    el.appendChild(head);
    if (data.note) el.appendChild(PS.h("p.ps-ef-note", {}, data.note));

    var acc = PS.h("div.ps-accordion", {});
    (data.units || []).forEach(function (unit, i) {
      acc.appendChild(renderUnit(unit, i));
    });
    el.appendChild(acc);
    PS.reveal(acc);

    function matchToggle() {
      var group = PS.h("div.ps-segment", { role: "group", "aria-label": "Match mode" });
      ["any", "all"].forEach(function (m) {
        var btn = PS.h("button.ps-segment-btn", {
          type: "button",
          "aria-pressed": m === mode ? "true" : "false",
          "data-mode": m
        }, m === "any" ? "Match any" : "Match all");
        btn.addEventListener("click", function () {
          mode = m;
          group.querySelectorAll(".ps-segment-btn").forEach(function (b) {
            b.setAttribute("aria-pressed", b.getAttribute("data-mode") === mode ? "true" : "false");
          });
          units.forEach(function (u) { u.apply(); });
        });
        group.appendChild(btn);
      });
      return group;
    }

    function renderUnit(unit, index) {
      var checked = Object.create(null);
      var vars = unit.variables || [];
      var eqs = unit.equations || [];
      var open = index === 0;

      var count = PS.h("span.ps-ef-count", { "aria-live": "polite" }, "");
      var caret = PS.h("span.ps-accordion-caret", { "aria-hidden": "true" });
      var panelId = "ps-ef-" + course + "-" + index;
      var btn = PS.h("button.ps-accordion-head", {
        type: "button",
        "aria-expanded": open ? "true" : "false",
        "aria-controls": panelId
      }, [
        PS.h("span.ps-accordion-title", {}, [
          unit.title,
          PS.h("span.ps-accordion-meta", {}, " · " + vars.length + " variable" + (vars.length === 1 ? "" : "s"))
        ]),
        count,
        caret
      ]);

      var grid = PS.h("div.ps-var-grid", {});
      vars.forEach(function (v) {
        var id = panelId + "-v-" + slug(v.sym);
        var input = PS.h("input", { type: "checkbox", id: id, "data-sym": v.sym });
        input.addEventListener("change", function () {
          if (input.checked) checked[v.sym] = true; else delete checked[v.sym];
          apply();
        });
        var label = PS.h("label.ps-var", { for: id, title: v.name + (v.note ? " — " + v.note : "") }, [
          input,
          PS.h("span.ps-var-sym.ps-mono", {}, v.sym),
          PS.h("span.ps-var-name", {}, v.name)
        ]);
        grid.appendChild(label);
      });

      var list = PS.h("div.ps-eq-list", {});
      var rows = eqs.map(function (eq) {
        var row = PS.h("div.ps-eq", {}, [
          PS.h("span.ps-eq-name", {}, eq.name),
          PS.h("span.ps-eq-expr.ps-mono", {}, eq.expr)
        ]);
        return { node: row, uses: eq.uses || [] };
      });
      rows.forEach(function (r) { list.appendChild(r.node); });

      var panel = PS.h("div.ps-accordion-panel", { id: panelId, hidden: !open }, [
        vars.length ? grid : null,
        list
      ]);

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        panel.hidden = isOpen;
      });

      function apply() {
        var keys = Object.keys(checked);
        var active = keys.length > 0;
        var shown = 0;
        rows.forEach(function (r) {
          var match;
          if (!active) match = true;
          else if (mode === "any") match = r.uses.some(function (u) { return checked[u]; });
          else match = r.uses.length > 0 && r.uses.every(function (u) { return checked[u]; });
          r.node.classList.toggle("is-hidden", !match);
          if (match) shown++;
        });
        count.textContent = active ? shown + " match" + (shown === 1 ? "" : "es") : "";
      }
      apply();
      units.push({ apply: apply });
      return PS.h("div.ps-accordion-item", {}, [btn, panel]);
    }
  });

  function slug(s) {
    return String(s).replace(/[^A-Za-z0-9]/g, function (c) { return "_" + c.charCodeAt(0); });
  }
})();

===== END FILE =====

===== FILE: src/js/components/formula-library.js =====
/* Physics Solved — formula sheet library.
 * <div data-ps-app="formula-library"></div>
 * Tab pills are built from every sheet declared on the physics courses in
 * registry.json (so tabs and courses can never disagree). Sheets load lazily.
 * Tablist semantics + arrow-key navigation. Print opens a clean sheet-only page.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("formula-library", async function (el) {
    var subjectId = el.getAttribute("data-subject") || "physics";
    var reg = await PS.getRegistry();
    var subject = (reg.subjects || []).find(function (s) { return s.id === subjectId; });
    el.innerHTML = "";

    // Flatten sheets across the subject's courses -> tab list.
    var tabs = [];
    (subject ? subject.courses : []).forEach(function (course) {
      (course.sheets || []).forEach(function (sh) {
        tabs.push({ id: sh.id, label: sh.label, file: sh.file, accent: course.accent });
      });
    });
    if (!tabs.length) {
      el.appendChild(PS.h("div.ps-state", {}, "No formula sheets are configured."));
      return;
    }

    var tablist = PS.h("div.ps-tabs", { role: "tablist", "aria-label": "Formula sheets" });
    var panel = PS.h("div.ps-tabpanel", { role: "tabpanel", tabindex: "0", "aria-live": "polite" });
    var buttons = [];

    tabs.forEach(function (tab, i) {
      var btn = PS.h("button.ps-tab", {
        type: "button",
        role: "tab",
        id: "ps-tab-" + tab.id,
        "aria-controls": panel.id || "ps-fl-panel",
        "aria-selected": i === 0 ? "true" : "false",
        tabindex: i === 0 ? "0" : "-1",
        style: "--ps-accent:" + (tab.accent || "#2547d0")
      }, tab.label);
      btn.addEventListener("click", function () { select(i); });
      buttons.push(btn);
      tablist.appendChild(btn);
    });
    panel.id = "ps-fl-panel";
    tablist.addEventListener("keydown", onKeydown);

    el.appendChild(tablist);
    el.appendChild(panel);

    var current = -1;
    var loaded = Object.create(null);
    select(0);

    function onKeydown(e) {
      var i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      var n = buttons.length, j = i;
      if (e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      else return;
      e.preventDefault();
      buttons[j].focus();
      select(j);
    }

    function select(i) {
      if (i === current) return;
      current = i;
      buttons.forEach(function (b, k) {
        var on = k === i;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", buttons[i].id);
      renderSheet(tabs[i]);
    }

    async function renderSheet(tab) {
      panel.innerHTML = "";
      panel.appendChild(PS.h("div.ps-state.ps-state--loading", {}, "Loading sheet…"));
      var data;
      try {
        data = loaded[tab.id] || (loaded[tab.id] = await PS.fetchJSON(tab.file));
      } catch (err) {
        panel.innerHTML = "";
        panel.appendChild(PS.h("div.ps-state.ps-state--error", {}, "Could not load this sheet."));
        return;
      }
      panel.innerHTML = "";
      panel.appendChild(sheetNode(data, tab.accent));
    }
  });

  function sheetNode(data, accent) {
    var sheet = PS.h("div.ps-sheet", { style: "--ps-accent:" + (accent || "#2547d0") });

    var header = PS.h("div.ps-sheet-head", {}, [
      PS.h("div", {}, [
        PS.h("h3.ps-sheet-title", {}, data.title || "Formula Sheet"),
        data.tagline ? PS.h("p.ps-sheet-tagline.ps-muted", {}, data.tagline) : null
      ]),
      printButton(sheet, data.title || "Formula Sheet")
    ]);
    sheet.appendChild(header);

    if (data.constants && data.constants.length) {
      var strip = PS.h("div.ps-constants", { "aria-label": "Constants" });
      data.constants.forEach(function (c) {
        strip.appendChild(PS.h("span.ps-constant", {}, [
          PS.h("span.ps-constant-sym.ps-mono", {}, c.sym),
          PS.h("span.ps-constant-val.ps-mono", {}, c.value)
        ]));
      });
      sheet.appendChild(strip);
    }

    var grid = PS.h("div.ps-sheet-grid");
    (data.categories || []).forEach(function (cat) {
      var card = PS.h("div.ps-card.ps-sheet-card", {}, [
        PS.h("h4.ps-sheet-cat", {}, cat.title)
      ]);
      var rows = PS.h("div.ps-sheet-rows");
      (cat.rows || []).forEach(function (row) {
        rows.appendChild(PS.h("div.ps-sheet-row", {}, [
          PS.h("span.ps-sheet-row-name", {}, row.name),
          PS.h("span.ps-sheet-row-expr.ps-mono", {}, row.expr)
        ]));
      });
      card.appendChild(rows);
      grid.appendChild(card);
    });
    sheet.appendChild(grid);
    return sheet;
  }

  function printButton(sheet, title) {
    var btn = PS.h("button.ps-btn.ps-btn--dark", { type: "button" }, "Print / Save PDF");
    btn.addEventListener("click", function () { printSheet(sheet, title); });
    return btn;
  }

  // Print just the sheet in a clean popup, styled by the CDN stylesheet, so the
  // surrounding Squarespace page is never touched (no body/html rules needed).
  function printSheet(sheet, title) {
    var win = window.open("", "_blank", "width=900,height=1000");
    if (!win) { window.print(); return; } // popup blocked -> best effort
    // Absolute URL so it resolves inside the about:blank popup (base may be relative).
    var css = new URL(PS.base + "dist/physics-solved.min.css", document.baseURI).href;
    win.document.open();
    win.document.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<title>' + PS.escape(title) + '</title>' +
      '<link rel="stylesheet" href="' + PS.escape(css) + '">' +
      '</head><body class="ps-print-body"><div class="ps-root ps-print-doc">' +
      sheet.outerHTML + "</div></body></html>"
    );
    win.document.close();
    var go = function () { win.focus(); win.print(); };
    // Give the stylesheet a moment to load, then print.
    if (win.document.readyState === "complete") setTimeout(go, 250);
    else win.addEventListener("load", function () { setTimeout(go, 150); });
  }
})();

===== END FILE =====

===== FILE: src/js/components/frq.js =====
/* Physics Solved — FRQ practice.
 * <div data-ps-app="frq"></div>
 * Filter pills + question list (left) and a viewer (right). Students type
 * answers per part; "Check my work" runs PS.grading.grade(). With no grading
 * provider set it reveals model answers with a self-assessment score. Filters
 * and badges are derived from registry.json; there are NO direct API calls.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("frq", async function (el) {
    var reg = await PS.getRegistry();
    var data = await PS.fetchJSON("frq/physics.json");
    el.innerHTML = "";

    var physics = (reg.subjects || []).find(function (s) { return s.id === "physics"; }) || { courses: [] };
    var courseById = {};
    physics.courses.forEach(function (c) { courseById[c.id] = c; });
    var frqCourses = physics.courses.filter(function (c) {
      return (c.features || []).indexOf("frq") !== -1;
    });
    var questions = data.questions || [];
    var filter = "all";
    var selectedId = null;

    /* ---- Filter pills (from registry) -------------------------------- */
    var pills = PS.h("div.ps-pills", { role: "tablist", "aria-label": "Filter questions by course" });
    var pillDefs = [{ id: "all", label: "All" }].concat(frqCourses.map(function (c) {
      return { id: c.id, label: c.label, accent: c.accent };
    }));
    var pillBtns = {};
    pillDefs.forEach(function (p) {
      var btn = PS.h("button.ps-pill", {
        type: "button", role: "tab",
        "aria-selected": p.id === filter ? "true" : "false",
        style: p.accent ? "--ps-accent:" + p.accent : null
      }, p.label);
      btn.addEventListener("click", function () { setFilter(p.id); });
      pillBtns[p.id] = btn;
      pills.appendChild(btn);
    });

    var randomBtn = PS.h("button.ps-btn.ps-btn--ghost", { type: "button" }, "🎲 Random question");
    randomBtn.addEventListener("click", pickRandom);

    var controls = PS.h("div.ps-frq-controls", {}, [pills, randomBtn]);

    /* ---- Layout ------------------------------------------------------ */
    var listWrap = PS.h("div.ps-frq-list", { role: "list", "aria-label": "Questions" });
    var mobileSelect = PS.h("select.ps-frq-select", { "aria-label": "Choose a question" });
    mobileSelect.addEventListener("change", function () {
      if (mobileSelect.value) selectQuestion(mobileSelect.value);
    });
    var listCol = PS.h("div.ps-frq-listcol", {}, [mobileSelect, listWrap]);

    var viewer = PS.h("div.ps-frq-viewer", {
      role: "region", "aria-live": "polite", "aria-label": "Question viewer"
    });
    var panes = PS.h("div.ps-frq-panes", {}, [listCol, viewer]);

    el.appendChild(controls);
    el.appendChild(panes);
    PS.reveal(panes);

    renderList();
    showEmpty();

    /* ---- Behaviour --------------------------------------------------- */
    function visibleQuestions() {
      return questions.filter(function (q) { return filter === "all" || q.courseId === filter; });
    }

    function setFilter(id) {
      filter = id;
      Object.keys(pillBtns).forEach(function (k) {
        pillBtns[k].setAttribute("aria-selected", k === id ? "true" : "false");
      });
      renderList();
      var vis = visibleQuestions();
      if (!vis.some(function (q) { return q.id === selectedId; })) showEmpty();
    }

    function renderList() {
      listWrap.innerHTML = "";
      mobileSelect.innerHTML = "";
      mobileSelect.appendChild(PS.h("option", { value: "" }, "Select a question…"));
      var vis = visibleQuestions();
      if (!vis.length) {
        listWrap.appendChild(PS.h("div.ps-state", {}, "No questions in this filter yet."));
        return;
      }
      vis.forEach(function (q) {
        var course = courseById[q.courseId] || {};
        var item = PS.h("button.ps-frq-item", {
          type: "button", role: "listitem",
          "data-id": q.id,
          "aria-current": q.id === selectedId ? "true" : "false"
        }, [
          PS.h("span.ps-badge", { style: "--ps-accent:" + (course.accent || "#2547d0") },
            course.label || q.courseId),
          PS.h("span.ps-frq-item-unit", {}, q.unit || ""),
          PS.h("span.ps-frq-item-title", {}, q.title || "Untitled")
        ]);
        item.addEventListener("click", function () { selectQuestion(q.id); });
        listWrap.appendChild(item);

        var opt = PS.h("option", { value: q.id }, (course.label ? course.label + " — " : "") + (q.title || "Untitled"));
        mobileSelect.appendChild(opt);
      });
      if (selectedId) mobileSelect.value = selectedId;
    }

    function pickRandom() {
      var vis = visibleQuestions();
      if (!vis.length) return;
      var q = vis[Math.floor(Math.random() * vis.length)];
      selectQuestion(q.id);
    }

    function markActive(id) {
      listWrap.querySelectorAll(".ps-frq-item").forEach(function (b) {
        b.setAttribute("aria-current", b.getAttribute("data-id") === id ? "true" : "false");
      });
      mobileSelect.value = id;
    }

    function showEmpty() {
      selectedId = null;
      markActive(null);
      viewer.innerHTML = "";
      viewer.appendChild(PS.h("div.ps-frq-empty", {}, [
        PS.h("div.ps-frq-empty-icon", { "aria-hidden": "true" }, "📝"),
        PS.h("p.ps-frq-empty-title", {}, "Pick a question to get started"),
        PS.h("p.ps-muted", {}, "Select a question from the list — or try a random one.")
      ]));
    }

    function selectQuestion(id) {
      var q = questions.find(function (x) { return x.id === id; });
      if (!q) return;
      selectedId = id;
      markActive(id);
      renderQuestion(q);
    }

    function renderQuestion(q) {
      var course = courseById[q.courseId] || {};
      viewer.innerHTML = "";

      var header = PS.h("div.ps-frq-qhead", {}, [
        PS.h("span.ps-badge", { style: "--ps-accent:" + (course.accent || "#2547d0") },
          course.label || q.courseId),
        q.unit ? PS.h("span.ps-frq-qunit", {}, q.unit) : null,
        PS.h("h3.ps-frq-qtitle", {}, q.title || "Untitled")
      ]);
      viewer.appendChild(header);
      if (q.scenario) viewer.appendChild(PS.h("p.ps-frq-scenario", {}, q.scenario));

      var partNodes = [];
      var parts = q.parts || [];
      parts.forEach(function (part, i) {
        var taId = "ps-frq-" + q.id + "-p" + i;
        var ta = PS.h("textarea.ps-frq-answer", {
          id: taId, rows: "3", placeholder: "Your answer…"
        });
        var reveal = PS.h("div.ps-frq-reveal", { hidden: true });
        var block = PS.h("div.ps-frq-part", {}, [
          PS.h("label.ps-frq-part-label", { for: taId }, [
            PS.h("span.ps-frq-part-tag", {}, part.label || "Part " + (i + 1)),
            part.points ? PS.h("span.ps-frq-points", {}, part.points + " pt" + (part.points === 1 ? "" : "s")) : null
          ]),
          part.text ? PS.h("p.ps-frq-part-text", {}, part.text) : null,
          ta,
          reveal
        ]);
        partNodes.push({ part: part, ta: ta, reveal: reveal, points: part.points || 1 });
        viewer.appendChild(block);
      });

      var checkBtn = PS.h("button.ps-btn", { type: "button" }, "Check my work");
      var summary = PS.h("div.ps-frq-summary", { role: "status", "aria-live": "polite", hidden: true });
      var actions = PS.h("div.ps-frq-actions", {}, [checkBtn, summary]);
      viewer.appendChild(actions);

      checkBtn.addEventListener("click", async function () {
        var answers = {};
        partNodes.forEach(function (p, i) {
          answers[(p.part.label || "Part " + (i + 1))] = p.ta.value;
        });
        checkBtn.disabled = true;
        checkBtn.textContent = "Checking…";
        var result;
        try {
          result = await PS.grading.grade(q, answers);
        } catch (err) {
          console.error(err);
          checkBtn.disabled = false;
          checkBtn.textContent = "Check my work";
          summary.hidden = false;
          summary.textContent = "Grading service unavailable — try again later.";
          return;
        }
        checkBtn.textContent = "Answers revealed";
        if (result && result.mode === "graded" && result.parts) {
          renderGraded(result);
        } else {
          renderSelfCheck();
        }
      });

      // Self-check: reveal model answers + self-assessment scoring.
      function renderSelfCheck() {
        var state = {}; // index -> "got" | "partial" | "missed"
        partNodes.forEach(function (p, i) {
          p.reveal.hidden = false;
          p.reveal.innerHTML = "";
          if (p.part.modelAnswer) {
            p.reveal.appendChild(PS.h("div.ps-frq-model", {}, [
              PS.h("span.ps-frq-model-tag", {}, "Model answer"),
              PS.h("span.ps-frq-model-text.ps-mono", {}, p.part.modelAnswer)
            ]));
          }
          var seg = PS.h("div.ps-segment.ps-frq-selfassess", { role: "group",
            "aria-label": "How did you do on " + (p.part.label || "this part") + "?" });
          [["got", "Got it"], ["partial", "Partially"], ["missed", "Missed"]].forEach(function (opt) {
            var b = PS.h("button.ps-segment-btn", { type: "button", "data-v": opt[0],
              "aria-pressed": "false" }, opt[1]);
            b.addEventListener("click", function () {
              state[i] = opt[0];
              seg.querySelectorAll(".ps-segment-btn").forEach(function (x) {
                x.setAttribute("aria-pressed", x.getAttribute("data-v") === opt[0] ? "true" : "false");
              });
              updateSummary();
            });
            seg.appendChild(b);
          });
          p.reveal.appendChild(seg);
        });

        function updateSummary() {
          var total = 0, earned = 0, answered = 0;
          partNodes.forEach(function (p, i) {
            total += p.points;
            if (state[i]) {
              answered++;
              earned += state[i] === "got" ? p.points : state[i] === "partial" ? p.points / 2 : 0;
            }
          });
          summary.hidden = false;
          if (!answered) {
            summary.textContent = "Rate each part to see your self-score.";
          } else {
            summary.textContent = "Self-score: " + round(earned) + " / " + total +
              " pts (" + answered + " of " + partNodes.length + " parts rated)";
          }
        }
        updateSummary();
      }

      // Graded mode (enabled by setting PS.grading.provider later).
      function renderGraded(result) {
        partNodes.forEach(function (p, i) {
          var fb = (result.parts[i]) || {};
          p.reveal.hidden = false;
          p.reveal.innerHTML = "";
          p.reveal.appendChild(PS.h("div.ps-frq-model", {}, [
            PS.h("span.ps-frq-model-tag", {}, "Feedback" +
              (fb.score != null ? " · " + fb.score + "/" + (fb.max != null ? fb.max : p.points) : "")),
            PS.h("span.ps-frq-model-text", {}, fb.feedback || "—")
          ]));
        });
        summary.hidden = false;
        summary.textContent = result.score != null
          ? "Score: " + result.score + " / " + (result.max != null ? result.max : "") + " pts"
          : "Graded.";
      }
    }
  });

  function round(n) { return Math.round(n * 10) / 10; }
})();

===== END FILE =====

===== FILE: src/js/components/portfolio.js =====
/* Physics Solved — portfolio.
 * <div data-ps-app="portfolio"></div>
 * Hero intro, filter pills (All / Engineering / Coding / Physics Tools), a
 * responsive card grid (featured cards larger) that expands in place — no modal.
 * Data from data/portfolio.json.
 */
(function () {
  "use strict";
  var PS = window.PS;

  var TAGS = [
    { id: "all", label: "All" },
    { id: "engineering", label: "Engineering" },
    { id: "coding", label: "Coding" },
    { id: "physics-tools", label: "Physics Tools" }
  ];
  var TAG_LABEL = { engineering: "Engineering", coding: "Coding", "physics-tools": "Physics Tools" };

  PS.register("portfolio", async function (el) {
    var data = await PS.fetchJSON("portfolio.json");
    el.innerHTML = "";
    var projects = data.projects || [];
    var filter = "all";

    if (data.intro) el.appendChild(PS.h("p.ps-portfolio-intro", {}, data.intro));

    var pills = PS.h("div.ps-pills", { role: "tablist", "aria-label": "Filter projects" });
    var pillBtns = {};
    TAGS.forEach(function (t) {
      var btn = PS.h("button.ps-pill", { type: "button", role: "tab",
        "aria-selected": t.id === filter ? "true" : "false" }, t.label);
      btn.addEventListener("click", function () { setFilter(t.id); });
      pillBtns[t.id] = btn;
      pills.appendChild(btn);
    });
    el.appendChild(pills);

    var grid = PS.h("div.ps-portfolio-grid");
    el.appendChild(grid);
    PS.reveal(grid);

    var cards = projects.map(function (p) { return { project: p, node: card(p) }; });
    cards.forEach(function (c) { grid.appendChild(c.node); });
    apply();

    function setFilter(id) {
      filter = id;
      Object.keys(pillBtns).forEach(function (k) {
        pillBtns[k].setAttribute("aria-selected", k === id ? "true" : "false");
      });
      apply();
    }

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var tags = c.project.tags || [];
        var match = filter === "all" || tags.indexOf(filter) !== -1;
        c.node.hidden = !match;
        if (match) shown++;
      });
      var empty = grid.querySelector(".ps-portfolio-empty");
      if (!shown && !empty) grid.appendChild(PS.h("div.ps-portfolio-empty.ps-state", {}, "No projects in this filter."));
      else if (shown && empty) empty.remove();
    }
  });

  function card(p) {
    var featured = !!p.featured;
    var cover = coverNode(p);

    var chips = PS.h("div.ps-chips", {}, (p.tags || []).map(function (t) {
      return PS.h("span.ps-chip", {}, TAG_LABEL[t] || t);
    }));

    var tech = (p.tech && p.tech.length)
      ? PS.h("ul.ps-tech", { "aria-label": "Tech used" }, p.tech.map(function (t) {
          return PS.h("li.ps-tech-item.ps-mono", {}, t);
        }))
      : null;

    var links = (p.links && p.links.length)
      ? PS.h("div.ps-portfolio-links", {}, p.links.map(function (l) {
          return PS.h("a.ps-link", { href: l.url,
            target: /^https?:/.test(l.url || "") ? "_blank" : null,
            rel: /^https?:/.test(l.url || "") ? "noopener" : null }, l.label);
        }))
      : null;

    var descId = "ps-proj-" + (p.id || Math.random().toString(36).slice(2));
    var desc = PS.h("div.ps-portfolio-desc", { id: descId, hidden: true },
      PS.h("p", {}, p.description || ""));

    var toggle = p.description
      ? PS.h("button.ps-portfolio-toggle", { type: "button",
          "aria-expanded": "false", "aria-controls": descId }, "Read more")
      : null;
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        toggle.textContent = open ? "Read more" : "Show less";
        desc.hidden = open;
      });
    }

    return PS.h("article.ps-card.ps-portfolio-card" + (featured ? ".is-featured" : ""), {}, [
      cover,
      PS.h("div.ps-portfolio-body", {}, [
        PS.h("div.ps-portfolio-titlerow", {}, [
          PS.h("h3.ps-portfolio-title", {}, p.title || "Untitled"),
          p.year ? PS.h("span.ps-portfolio-year.ps-mono", {}, String(p.year)) : null
        ]),
        chips,
        p.summary ? PS.h("p.ps-portfolio-summary", {}, p.summary) : null,
        tech,
        links,
        toggle,
        desc
      ])
    ]);
  }

  function coverNode(p) {
    if (p.images && p.images.length) {
      return PS.h("div.ps-portfolio-cover", {}, PS.h("img.ps-portfolio-img", {
        src: p.images[0], alt: p.title || "", loading: "lazy" }));
    }
    var hue = hash(p.title || p.id || "x") % 360;
    return PS.h("div.ps-portfolio-cover.ps-portfolio-cover--gradient", {
      style: "--ps-h:" + hue, "aria-hidden": "true"
    }, PS.h("span.ps-portfolio-cover-mark", {}, (p.title || "•").slice(0, 1).toUpperCase()));
  }

  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
})();

===== END FILE =====

===== FILE: src/js/components/simulator-kinematics.js =====
/* Physics Solved — projectile / kinematics simulator.
 * <div data-ps-app="simulator-kinematics"></div>
 * A dark-panel accent (uses the #101426 ink token, not a separate palette).
 * Launch controls -> canvas trajectory + live data table + equation strip.
 * Honors prefers-reduced-motion (draws the full path instantly).
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("simulator-kinematics", async function (el) {
    el.innerHTML = "";
    var state = { v: 20, angle: 45, h: 0, g: 9.8 };

    var canvas = PS.h("canvas.ps-sim-canvas", { role: "img",
      "aria-label": "Projectile trajectory" });
    var ctx = canvas.getContext("2d");

    var readout = PS.h("div.ps-sim-readout", { "aria-live": "polite" });
    var tableWrap = PS.h("div.ps-sim-tablewrap");
    var eqStrip = PS.h("div.ps-sim-eqstrip.ps-mono");

    var controls = PS.h("div.ps-sim-controls", {}, [
      slider("Launch speed", "v", 1, 60, 1, "m/s"),
      slider("Angle", "angle", 0, 90, 1, "°"),
      slider("Initial height", "h", 0, 50, 1, "m"),
      gravitySelect()
    ]);

    var launchBtn = PS.h("button.ps-btn", { type: "button" }, "▶ Launch");
    var resetBtn = PS.h("button.ps-btn.ps-btn--ghost.ps-btn--on-dark", { type: "button" }, "Reset");
    launchBtn.addEventListener("click", function () { run(); });
    resetBtn.addEventListener("click", function () { compute(); drawStatic(); });
    var buttons = PS.h("div.ps-sim-buttons", {}, [launchBtn, resetBtn]);

    var panel = PS.h("div.ps-sim.ps-sim--dark", {}, [
      PS.h("div.ps-sim-head", {}, [
        PS.h("h3.ps-sim-title", {}, "Kinematics Simulator"),
        PS.h("p.ps-sim-sub", {}, "Projectile launcher — adjust the controls and launch.")
      ]),
      PS.h("div.ps-sim-grid", {}, [
        PS.h("div.ps-sim-left", {}, [canvas, eqStrip]),
        PS.h("div.ps-sim-right", {}, [controls, buttons, readout, tableWrap])
      ])
    ]);
    el.appendChild(panel);
    PS.reveal(panel);

    var traj = [];
    var meta = {};
    var raf = null;

    function slider(label, key, min, max, step, unit) {
      var id = "ps-sim-" + key;
      var out = PS.h("output.ps-sim-val.ps-mono", { for: id }, state[key] + unit);
      var input = PS.h("input.ps-sim-range", {
        id: id, type: "range", min: min, max: max, step: step, value: state[key]
      });
      input.addEventListener("input", function () {
        state[key] = parseFloat(input.value);
        out.textContent = state[key] + unit;
        compute(); drawStatic();
      });
      return PS.h("div.ps-sim-control", {}, [
        PS.h("label.ps-sim-label", { for: id }, [label, out]),
        input
      ]);
    }

    function gravitySelect() {
      var id = "ps-sim-g";
      var sel = PS.h("select.ps-sim-select", { id: id });
      [["Earth", 9.8], ["Moon", 1.6], ["Mars", 3.7], ["Jupiter", 24.8]].forEach(function (o) {
        sel.appendChild(PS.h("option", { value: o[1] }, o[0] + " (" + o[1] + " m/s²)"));
      });
      sel.value = String(state.g);
      sel.addEventListener("change", function () {
        state.g = parseFloat(sel.value); compute(); drawStatic();
      });
      return PS.h("div.ps-sim-control", {}, [
        PS.h("label.ps-sim-label", { for: id }, "Gravity"),
        sel
      ]);
    }

    function compute() {
      var rad = state.angle * Math.PI / 180;
      var vx = state.v * Math.cos(rad);
      var vy0 = state.v * Math.sin(rad);
      var g = state.g, h = state.h;
      var tFlight = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h)) / g;
      var range = vx * tFlight;
      var maxH = h + (vy0 * vy0) / (2 * g);
      meta = { vx: vx, vy0: vy0, tFlight: tFlight, range: range, maxH: maxH };

      traj = [];
      var N = 240;
      for (var i = 0; i <= N; i++) {
        var t = tFlight * i / N;
        traj.push({ t: t, x: vx * t, y: Math.max(0, h + vy0 * t - 0.5 * g * t * t),
          vx: vx, vy: vy0 - g * t });
      }

      eqStrip.innerHTML = "";
      [
        "x = v₀cosθ · t",
        "y = y₀ + v₀sinθ · t − ½gt²",
        "R = " + meta.range.toFixed(1) + " m",
        "t = " + meta.tFlight.toFixed(2) + " s",
        "H = " + meta.maxH.toFixed(1) + " m"
      ].forEach(function (s) { eqStrip.appendChild(PS.h("span.ps-sim-eq", {}, s)); });

      readout.textContent = "Range " + meta.range.toFixed(1) + " m · flight time " +
        meta.tFlight.toFixed(2) + " s · peak height " + meta.maxH.toFixed(1) + " m.";

      renderTable();
    }

    function renderTable() {
      tableWrap.innerHTML = "";
      var table = PS.h("table.ps-sim-table", {});
      var thead = PS.h("thead", {}, PS.h("tr", {}, ["t (s)", "x (m)", "y (m)", "vₓ (m/s)", "v_y (m/s)"].map(function (h) {
        return PS.h("th", { scope: "col" }, h);
      })));
      var tbody = PS.h("tbody");
      var rows = 8;
      for (var i = 0; i <= rows; i++) {
        var p = traj[Math.round(traj.length ? (traj.length - 1) * i / rows : 0)] || { t: 0, x: 0, y: 0, vx: 0, vy: 0 };
        tbody.appendChild(PS.h("tr", {}, [
          p.t.toFixed(2), p.x.toFixed(1), p.y.toFixed(1), p.vx.toFixed(1), p.vy.toFixed(1)
        ].map(function (c) { return PS.h("td.ps-mono", {}, c); })));
      }
      table.appendChild(thead); table.appendChild(tbody);
      tableWrap.appendChild(table);
    }

    function fit() {
      var w = canvas.clientWidth || 480;
      var h = Math.max(220, Math.round(w * 0.6));
      var dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h };
    }

    function mapper(size) {
      var pad = 28;
      var maxX = Math.max(meta.range, 1);
      var maxY = Math.max(meta.maxH, state.h, 1) * 1.1;
      var sx = (size.w - pad * 2) / maxX;
      var sy = (size.h - pad * 2) / maxY;
      return {
        X: function (x) { return pad + x * sx; },
        Y: function (y) { return size.h - pad - y * sy; }
      };
    }

    function drawFrame(upto) {
      var size = fit();
      var m = mapper(size);
      ctx.clearRect(0, 0, size.w, size.h);
      // ground
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, m.Y(0)); ctx.lineTo(size.w - 12, m.Y(0)); ctx.stroke();
      // full faint path
      strokePath(m, traj.length - 1, "rgba(255,255,255,.15)", 1.5);
      // travelled path
      strokePath(m, upto, "#5f7cf0", 2.5);
      // projectile
      var p = traj[Math.min(upto, traj.length - 1)];
      if (p) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(m.X(p.x), m.Y(p.y), 5, 0, Math.PI * 2); ctx.fill();
      }
      // apex marker
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText("apex " + meta.maxH.toFixed(1) + " m", m.X(meta.range / 2) - 24, m.Y(meta.maxH) - 8);
    }

    function strokePath(m, upto, color, width) {
      if (!traj.length) return;
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath();
      for (var i = 0; i <= upto && i < traj.length; i++) {
        var q = traj[i];
        if (i === 0) ctx.moveTo(m.X(q.x), m.Y(q.y));
        else ctx.lineTo(m.X(q.x), m.Y(q.y));
      }
      ctx.stroke();
    }

    function drawStatic() { drawFrame(traj.length - 1); }

    function run() {
      if (raf) cancelAnimationFrame(raf);
      if (PS.reducedMotion()) { drawStatic(); return; }
      var start = null;
      var duration = Math.min(2400, Math.max(700, meta.tFlight * 600));
      function tick(ts) {
        if (start == null) start = ts;
        var k = Math.min(1, (ts - start) / duration);
        drawFrame(Math.round(k * (traj.length - 1)));
        if (k < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawStatic, 120);
    });

    compute();
    // Canvas needs layout before first draw.
    requestAnimationFrame(drawStatic);
  });
})();

===== END FILE =====

===== FILE: src/js/core.js =====
/* Physics Solved — core mount system.
 * Scans the page for [data-ps-app] elements, resolves the CDN base URL,
 * fetches the JSON each component needs, and renders. Vanilla ES2020, no deps.
 * Components register themselves on window.PS via PS.register(name, fn).
 */
(function () {
  "use strict";

  // Capture the <script> that loaded this bundle NOW (synchronously), while
  // document.currentScript is still valid. Used to derive the data base URL.
  var CURRENT = document.currentScript;

  var PS = (window.PS = window.PS || {});
  PS.components = PS.components || {};

  /* ---- Base URL resolution -------------------------------------------- */
  // Priority: data-ps-base attribute on the script tag -> derived from the
  // script src (strip trailing "dist/<file>") -> "" (same-origin relative).
  function resolveBase() {
    var attr = CURRENT && CURRENT.getAttribute && CURRENT.getAttribute("data-ps-base");
    if (attr) return attr.replace(/\/?$/, "/"); // ensure trailing slash
    var src = (CURRENT && CURRENT.src) || "";
    if (!src) return "";
    // .../physics-solved@v1/dist/physics-solved.min.js -> .../physics-solved@v1/
    var base = src.replace(/dist\/[^\/]*$/, "");
    if (base === src) base = src.replace(/[^\/]*$/, ""); // fallback: script dir
    return base;
  }

  PS.base = resolveBase();
  PS.dataUrl = function (path) {
    return PS.base + "data/" + String(path).replace(/^\/+/, "");
  };

  /* ---- Fetch with in-memory cache ------------------------------------- */
  var cache = Object.create(null);
  PS.fetchJSON = function (path) {
    var url = /^https?:|^\.\.?\//.test(path) ? path : PS.dataUrl(path);
    if (cache[url]) return cache[url];
    cache[url] = fetch(url, { credentials: "omit" }).then(function (r) {
      if (!r.ok) throw new Error("PS: failed to load " + url + " (" + r.status + ")");
      return r.json();
    });
    return cache[url];
  };

  PS.getRegistry = function () {
    return PS.fetchJSON("registry.json");
  };

  /* ---- Small DOM helpers ---------------------------------------------- */
  // h("div.cls#id", {attrs}, [children | "text"])
  PS.h = function (spec, attrs, children) {
    var tag = "div", id = null, cls = [];
    spec.replace(/([.#]?[^.#]+)/g, function (m) {
      if (m[0] === ".") cls.push(m.slice(1));
      else if (m[0] === "#") id = m.slice(1);
      else tag = m;
    });
    var node = document.createElement(tag);
    if (id) node.id = id;
    if (cls.length) node.className = cls.join(" ");
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") node.className += (node.className ? " " : "") + v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (Array.isArray(children) ? children : children != null ? [children] : []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return node;
  };

  PS.escape = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  PS.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // First-reveal fade/rise (<=200ms). No-op under prefers-reduced-motion.
  PS.reveal = function (node) {
    if (PS.reducedMotion()) return;
    node.classList.add("ps-reveal");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        node.classList.add("is-in");
      });
    });
  };

  PS.register = function (name, fn) {
    PS.components[name] = fn;
  };

  /* ---- Error + loading placeholders ----------------------------------- */
  function setState(el, cls, msg) {
    el.innerHTML = "";
    el.appendChild(PS.h("div.ps-state." + cls, { role: "status" }, msg));
  }

  /* ---- Mount ---------------------------------------------------------- */
  PS.mount = function (root) {
    root = root || document;
    var nodes = root.querySelectorAll("[data-ps-app]");
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.__psMounted) return;
      el.__psMounted = true;
      var type = el.getAttribute("data-ps-app");
      var comp = PS.components[type];
      if (!comp) {
        setState(el, "ps-state--error", 'Unknown component "' + type + '".');
        return;
      }
      if (!el.getAttribute("data-ps-quiet")) setState(el, "ps-state--loading", "Loading…");
      try {
        Promise.resolve(comp(el)).catch(function (err) {
          console.error(err);
          setState(el, "ps-state--error", "Could not load this section.");
        });
      } catch (err) {
        console.error(err);
        setState(el, "ps-state--error", "Could not load this section.");
      }
    });
  };

  function boot() {
    PS.mount();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    // Defer to a macrotask so the rest of a concatenated bundle registers its
    // components BEFORE we scan the page (core.js runs before them in the file).
    setTimeout(boot, 0);
  }
})();

===== END FILE =====

===== FILE: src/js/grading-adapter.js =====
/* Physics Solved — FRQ grading adapter.
 * All direct Anthropic API calls have been removed. Grading is pluggable:
 * with no provider set, the UI runs in self-check mode (reveal model answers +
 * self-assessment). To enable AI feedback later, set PS.grading.provider to an
 * object with an { endpoint } that points at a serverless proxy (e.g. a
 * Cloudflare Worker). No other file needs to change — see worker/README.md.
 */
(function () {
  "use strict";
  var PS = (window.PS = window.PS || {});

  PS.grading = {
    // provider: { endpoint: "https://your-worker.example.workers.dev/grade" }
    provider: null,

    /**
     * Grade a question given the student's per-part answers.
     * @param {object} question  the FRQ object (id, parts, ...)
     * @param {object} answers   map of part label -> student text
     * @returns {Promise<object>} result shape consumed by the FRQ UI:
     *   self-check:  { mode: "self-check" }
     *   graded:      { mode: "graded", parts: [{ label, score, max, feedback }],
     *                  score, max }
     */
    async grade(question, answers) {
      if (!this.provider || !this.provider.endpoint) {
        return { mode: "self-check" };
      }
      // Future: POST { question, answers } to the proxy and return its JSON.
      // The proxy holds the API key server-side; the browser never sees it.
      var res = await fetch(this.provider.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question, answers: answers })
      });
      if (!res.ok) throw new Error("Grading proxy error " + res.status);
      return res.json(); // expected: { mode: "graded", parts: [...], score, max }
    }
  };
})();

===== END FILE =====

===== FILE: worker/README.md =====
# FRQ grading proxy (future — not implemented)

The site ships with **no** AI grading. FRQ practice runs in **self-check** mode:
"Check my work" reveals the model answer for each part and lets the student
self-assess (Got it / Partially / Missed) for a local score.

To enable real AI feedback later, stand up a small serverless proxy (e.g. a
Cloudflare Worker) that holds your Anthropic API key **server-side** — the key
must never reach the browser. Then set the provider once, in the header snippet,
after the bundle loads:

```html
<script>
  window.addEventListener('DOMContentLoaded', function () {
    window.PS.grading.provider = { endpoint: 'https://your-worker.example.workers.dev/grade' };
  });
</script>
```

No other file changes — `frq.js` already renders whatever `grade()` returns.

## Endpoint contract

**Request** — `POST {endpoint}`, `Content-Type: application/json`:

```json
{
  "question": { "id": "frq-1", "unit": "Kinematics", "title": "…",
                "scenario": "…", "parts": [{ "label": "Part (a)", "text": "…",
                "modelAnswer": "…", "points": 3 }] },
  "answers": { "Part (a)": "student text", "Part (b)": "student text" }
}
```

**Response** — `200`, `Content-Type: application/json`, matching the shape the
FRQ UI already consumes:

```json
{
  "mode": "graded",
  "score": 6,
  "max": 8,
  "parts": [
    { "label": "Part (a)", "score": 3, "max": 3, "feedback": "Correct — …" },
    { "label": "Part (b)", "score": 3, "max": 5, "feedback": "Partial — …" }
  ]
}
```

- `parts[i]` must align by index with the question's parts.
- On any error, return a non-2xx status; the UI falls back to a friendly message.

## What the Worker should do

1. Read `{ question, answers }` from the request body.
2. Build a grading prompt (rubric from `parts[].modelAnswer` and `points`).
3. Call the Anthropic Messages API with your key from an environment secret.
4. Parse the model's reply into the response shape above and return it.
5. Restrict CORS to `https://physicssolved.com` and rate-limit by IP.

Keep the key in a Worker secret (`wrangler secret put ANTHROPIC_API_KEY`), never
in this repo or the client bundle.

===== END FILE =====


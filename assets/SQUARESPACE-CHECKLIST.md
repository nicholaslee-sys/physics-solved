# Physics Solved — Squarespace Editor Checklist

Everything the CSS **can't** reach. Do these in the Squarespace 7.1 editor.
Menu names drift between Squarespace releases — if a path below doesn't match,
use the **settings search bar** (press `/` or click the magnifier in Settings)
and search the term in **bold**.

Order matters: do section **A** first (it removes the washed-out first paint and
loads the new look), then the rest.

---

## A · One-time site settings

1. **Paste the new Custom CSS.**
   `Website → Website Tools → Custom CSS` (or `Design → Custom CSS`).
   Select-all, delete the old CSS, paste the entire contents of
   `squarespace/custom-css.less`. Save.
   → *Before:* second palette (navy/gold), orange H2s, blue buttons fighting.
   → *After:* one blue accent, ink serif H2s, off-white canvas.

2. **Turn OFF site animations** (this is what causes the ghosted, half-opacity
   header wordmark and washed-out first paint).
   While editing, open **Site Styles** (the paintbrush icon) → **Animations** →
   set to **None**. Save.
   → *Before:* wordmark + sections fade in at ~50% opacity on load.
   → *After:* everything paints at full contrast immediately.

3. **Confirm the bundle is loaded.**
   `Settings → Advanced → Code Injection → HEADER` should contain the contents of
   `squarespace/site-header-injection.html`. If you re-tag the repo, bump the
   `@v1` in both URLs. (The bundle's CSS auto-loads Inter, JetBrains Mono, and
   **Crimson Pro**, so the wordmark serif is available site-wide.)

4. **Set the site title to "Physics Solved."**
   `Settings → General` (search **Site Title**) → set to `Physics Solved`.
   If a logo image is set under **Site Styles → Logo & Title**, remove it so the
   text wordmark (now styled as the Crimson Pro serif) shows.

---

## B · Header & navigation

5. **Make the header sticky.**
   Edit any page → **Site Styles → Header** → set the header position to
   **Fixed / Sticky**. (The CSS also declares `position:sticky` as a fallback.)

6. **Build the primary nav.** In the **Pages** panel:
   - Create a **Folder** named **Physics**. Drag these existing pages into it
     (from **Not Linked** if they're parked there): *AP Physics 1, AP Physics 2,
     AP Physics C, IB Physics, College Physics*.
   - Create a **Folder** named **Chemistry**. Add **AP Chemistry**. Add an
     **IB Chemistry** item styled as muted "soon" — see step 8.
   - Add an **External / anchor link** named **Practice** pointing to
     `/#ps-frq` (jumps to the home FRQ section).
   - Add the **Portfolio** page to the nav.
   - Add an **External link** named **Contact** with URL
     `mailto:you@physicssolved.com` (use the real address).

7. **Mobile menu.** `Site Styles → Mobile` → ensure the hamburger menu is
   enabled and shows the same nav. The overlay is already styled (large serif
   links, blue on tap, ≥44px targets) by the Custom CSS.

8. **"IB soon" muted item (optional polish).** Squarespace 7.1 can't add a CSS
   class to a nav item directly. Easiest options:
   - **Label it in-place:** name the item **"IB Chemistry — soon"** and link it to
     the Chemistry folder landing (harmless), **or**
   - **Enable the muted style:** add a tiny script to
     `Settings → Advanced → Code Injection → FOOTER`:
     ```html
     <script>
       document.querySelectorAll('.header-nav-folder-item a, .header-menu-nav-item a')
         .forEach(a => { if (/IB Chemistry/i.test(a.textContent)) a.closest('.header-nav-folder-item, .header-menu-nav-item').classList.add('is-soon'); });
     </script>
     ```
     The `.is-soon` rule (muted, non-clickable) is already in the Custom CSS.

---

## C · Home page

9. **Add the hero as the FIRST block.** Edit the home page → add a **Code block**
   at the very top → paste `squarespace/home-hero.html`. The two buttons jump to
   `#ps-courses` and `#ps-frq`.
   → *Before:* page opens straight into a carousel floating in gray.
   → *After:* compact hero — serif headline, subhead, two CTAs, CSS grid-paper
     flourish (no images).

10. **Replace the old tool code blocks** with the current snippets (delete the
    hand-copied ones first):
    - "Choose your course" section → `squarespace/home-carousels.html`
      *(its wrapper already carries `id="ps-courses"` for the hero CTA)*
    - "Formula Sheet Library" section → `squarespace/home-formula-library.html`
    - "FRQ Practice" section → `squarespace/home-frq.html`
      *(wrapper carries `id="ps-frq"` for the Practice nav link + hero CTA)*

11. **Kill the voids.** For every section on the home page: select the section →
    **Edit Section → Section Height → Small** (or **Fit Content**), and set
    **top/bottom padding** to a small value. Delete any empty **Spacer** sections
    between tools.
    → *Before:* tools float in tall gray voids.
    → *After:* sections sit close together on one off-white canvas; white/off-white
      bands (from the CSS) separate them.

---

## D · Course pages (AP Physics 1, 2, C, IB, College)

12. On each course page, **replace the old Equation Finder / Formula Sheet /
    Simulator code blocks** with:
    - `squarespace/equation-finder.html` — **change `data-course`** to match the
      page: `ap-physics-1`, `ap-physics-2`, `ap-physics-c`, `ib-physics`,
      `college-physics`.
    - On **AP Physics 1** only, also add `squarespace/ap1-simulator.html` for the
      Kinematics Simulator section.

13. Apply the same **section height / padding** trim as step 11 to each course
    page.

14. **Delete the old browser-side API/FRQ block** if any course page still has it
    (the new FRQ runs in self-check mode — nothing to configure).

---

## E · Portfolio & Contact

15. **Portfolio page:** replace the old block with `squarespace/portfolio.html`.
    Trim section height as in step 11.

16. **Footer (edited in Squarespace, not CSS).** Rebuild the footer as **three
    columns** using footer blocks:
    - **Col 1 — Brand:** "Physics Solved" + one-line byline (built by a student).
    - **Col 2 — Quick links:** mirror the nav (Physics, Chemistry, Practice,
      Portfolio, Contact).
    - **Col 3 — Contact:** the mailto email.
    Put the tagline *"Interactive study tools for physics, chemistry, and beyond"*
    as a **Heading 3** (it picks up the modest serif automatically), or add the
    class `ps-footer-tagline` via a text block if you prefer.
    Add a thin **copyright** text block at the bottom: `© 2026 Physics Solved`.
    → *Before:* one full-width row of display text.
    → *After:* three tidy columns + thin copyright bar on off-white.

---

## F · Identity assets

17. **Favicon.** Export `assets/favicon.svg` to PNG (512, 180, 32, 16 px — any
    vector tool or an online SVG→PNG converter). Upload the 512px (or the SVG
    itself) at `Settings → General → Browser Icon` (search **Browser Icon** /
    **Favicon**). Replaces the default Squarespace icon.

18. **Default social image (og:image).**
    - Open `assets/og-image-template.svg`, edit the two lines marked **PAGE NAME**
      and **PAGE KICKER**, export to 1200×630 PNG.
    - Set the site-wide default at
      `Settings → Marketing → Social Sharing → Social Sharing Image` (search
      **Social Image**). Replaces the AI-generated site-wide image.

19. **Per-page social images (recommended).** For each key page (home + each
    course), duplicate the template, change the PAGE NAME line, export, then set it
    on the page: **Pages → (hover the page) → Settings ⚙ → Social Image**.

---

## G · QA pass (do after everything above)

20. **Desktop:** header sticky + full-contrast wordmark; nav hover underline +
    active state; folder dropdowns styled; no gray voids; buttons blue.
21. **Mobile (≤640px):** hamburger overlay off-white with large serif links;
    carousels swipe; formula sheet single-column; FRQ collapses to the dropdown;
    all tap targets ≥44px.
22. **Print a formula sheet** (open a sheet → **Print / Save PDF**): clean
    black-on-white, two columns, no site chrome.
23. **Contrast:** confirm the subject accents read as AA on white (they're tuned
    for it: physics blue `#2547d0`, AP2 green `#1a7f4e`, AP-C indigo `#3b3fb0`,
    College violet `#5a3fb8`, IB cyan `#0b6b93`, Chemistry amber `#8f5a12`).
24. **Reduced motion:** with OS "Reduce Motion" on, reveals and the simulator draw
    instantly (already handled by the bundle).

---

### Notes on what changed in the repo (for context)
- `data/registry.json` — retuned course **accent** values only (killed the loud
  AP-C orange `#b4530a` → indigo `#3b3fb0`; chemistry → warm amber `#8f5a12`;
  coming-soon gray darkened for AA). No content changed.
- `src/css/*` + rebuilt `dist/physics-solved.min.css` — added the hero, richer
  per-subject course-card art, coming-soon desaturation, focus/hover polish, and
  the Crimson Pro display token. **Re-tag the repo (`v1`) and purge jsDelivr** (or
  publish `v1.1` and update the two header URLs) to ship these — see the repo
  README "Updating later".

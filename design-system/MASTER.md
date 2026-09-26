# amaclone — Design System (MASTER)

Source of truth for all UI work. Every page build reads this first; page-specific
deviations go in `design-system/pages/<page>.md` and override this file.

> Note on provenance: the `ui-ux-pro-max` skill's generator (`scripts/search.py`) and its
> `data/` database are not present in this environment, so the `--design-system` command
> could not run. This master file is hand-authored from that skill's documented rules
> (priority table, quick-reference categories, and pre-delivery checklist).

---

## 1. Direction

An Amazon-style **content-dense commerce marketplace**, made to look sharper than the
original: recognisable dark navy chrome + warm orange action colour, but with disciplined
spacing, restrained radii, real elevation, and a designed dark theme. Trustworthy, not
flashy. Product imagery and price hierarchy carry the page.

**Anti-patterns (do not ship):**
- Emoji used as icons — use `lucide-react` SVG only, one family, consistent stroke.
- Raw hex in components — only semantic tokens from `globals.css`.
- Gray-on-gray muted text, or placeholders instead of labels.
- Hover-only affordances; animations over 400ms or that shift layout.
- Inverted dark mode — dark uses desaturated/lighter tonal variants.

## 2. Tokens (defined in `src/app/globals.css`)

Pastel-led palette. Prices are **neutral** (foreground), never red — hierarchy comes from
weight and size, not alarming color. Dark mode is a mid-tone slate-lavender, not near-black.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` / `--foreground` | lavender-white / ink `oklch(0.26 0.03 285)` | mid slate-lavender `oklch(0.31 0.02 285)` / near-white | page base |
| `--card` | white | raised slate `oklch(0.36 0.022 285)` | surfaces, product tiles |
| `--primary` | pastel apricot `oklch(0.87 0.085 55)` | pastel apricot `oklch(0.84 0.09 60)` | primary CTA |
| `--primary-foreground` | **dark** `oklch(0.3 0.05 45)` | dark `oklch(0.28 0.05 50)` | text on primary |
| `--nav` / `--nav-foreground` | muted indigo `oklch(0.44 0.06 285)` / near-white | deep indigo `oklch(0.25 0.026 285)` / near-white | header, footer |
| `--price` | **ink** `oklch(0.28 0.03 285)` | **near-white** `oklch(0.96 0.012 300)` | price display (neutral, not red) |
| `--accent` | pastel mint `oklch(0.93 0.052 180)` | muted mint `oklch(0.45 0.05 190)` | highlights |
| `--success` | green | green | in-stock, success |
| `--destructive` | red | red | errors, remove |
| `--muted-foreground` | `oklch(0.52 0.03 288)` | `oklch(0.8 0.02 290)` | secondary text |
| `--radius` | `0.75rem` | `0.75rem` | softer corners throughout |

**Accessibility-critical rule:** `--primary-foreground` is intentionally **dark**, not white.
White on the pastel primary fails 4.5:1. Do not "fix" it to white.

## 3. Typography

- Family: **Plus Jakarta Sans** (headings), **Geist Sans** (body), **Geist Mono** (order
  numbers/tabular data only). All sans-serif — no serif anywhere. Loaded via `next/font` in
  `src/app/layout.tsx` and mapped in `globals.css` as `--font-heading`, `--font-sans`,
  `--font-mono`. Headings (`h1`–`h4`) use `--font-heading` via a base-layer rule.
- Scale: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40.
- Body 16px minimum, line-height 1.5–1.75, measure 60–75 chars on desktop.
- Weight hierarchy: headings 600–700, labels 500, body 400.
- Prices use tabular figures (`.tabular-nums`) to stop width jitter.

## 4. Spacing, radius, elevation

- Spacing on a 4/8px rhythm: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius from `--radius` (0.625rem) with `rounded-sm/md/lg/xl` scale — consistent per component class.
- Elevation scale (use consistently): `shadow-sm` cards at rest, `shadow-md` on hover/raised,
  `shadow-lg` for popovers/sheets, `shadow-xl` for modals. Never random shadow values.
- Container: `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`.
- Breakpoints: 375 / 640 / 768 / 1024 / 1280 / 1440. Mobile-first.
- Z-index scale: base 0, sticky header 40, dropdown 50, overlay 100, modal 200, toast 300.

## 5. Motion

- Micro-interactions 150–300ms; complex ≤400ms; exits ~60–70% of enter.
- Animate `transform`/`opacity` only — never width/height/top/left.
- ease-out on enter, ease-in on exit. Skeleton/shimmer for loads >300ms.
- Global `prefers-reduced-motion` guard is in `globals.css` — respect it.

## 6. Component rules

- **Form controls inherit the page font.** A global base rule sets `font: inherit` on
  `input, select, textarea, button` (and `option`), because browsers otherwise fall back to a
  UA default font for native controls — which is what made selects look serif. The region and
  currency pickers in the header use the styled `Select` (Radix) rather than a naked native
  `<select>`, with a visible icon + `Region` / `Currency` label so their purpose is obvious.

- **Buttons:** one primary CTA per view; secondary actions visually subordinate; disabled =
  reduced opacity + `disabled` attr + no pointer.
- **Product tile:** image (fixed aspect-ratio box, no CLS), title (2-line clamp + full text on
  hover/native title), rating, price, region/stock state, primary action.
- **Forms:** visible label per input (never placeholder-only), error below the field, validate
  on blur, `aria-live` for errors, focus the first invalid field on submit failure,
  show/hide toggle on passwords, semantic input types.
- **Ratings:** stars as SVG, colour **plus** the numeric value (never colour alone).
- **Navigation:** header search always reachable; active location highlighted; breadcrumbs for
  3+ level category depth; back navigation preserves scroll/filter state.
- **Empty/loading/error:** every list and panel needs all three states.

## 7. Pre-delivery checklist (run before calling a page done)

- [ ] No emoji icons; one SVG icon family; ≥44px touch targets.
- [ ] Body text contrast ≥4.5:1, secondary ≥3:1 — verified in **both** themes.
- [ ] No horizontal scroll at 375px; header/footer don't swallow content.
- [ ] Visible labels, error placement, focus rings, keyboard reachable.
- [ ] `prefers-reduced-motion` respected; no layout-shift animations.
- [ ] Tabular prices; no raw hex; semantic tokens only.
- [ ] Empty + loading + error states present.

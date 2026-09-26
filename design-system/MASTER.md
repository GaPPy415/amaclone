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

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` / `--foreground` | warm white / slate-900 | deep navy-slate / near-white | page base |
| `--card` | white | raised navy | surfaces, product tiles |
| `--primary` | orange `oklch(0.74 0.17 62)` | lighter orange `oklch(0.78 0.16 65)` | primary CTA |
| `--primary-foreground` | **dark** `oklch(0.2 0.02 60)` | dark | text on orange |
| `--nav` / `--nav-foreground` | navy `oklch(0.24 0.03 255)` / near-white | near-black navy / near-white | header, footer |
| `--price` | deep red `oklch(0.48 0.19 27)` | brighter red | price display |
| `--success` | green | green | in-stock, success |
| `--destructive` | red | red | errors, remove |
| `--muted-foreground` | slate-500 | slate-400 | secondary text |

**Accessibility-critical rule:** `--primary-foreground` is intentionally **dark**, not white.
White on this orange fails 4.5:1. Do not "fix" it to white.

## 3. Typography

- Family: **Geist Sans** (body + headings), **Geist Mono** (prices/order numbers/tabular data
  where alignment matters). Loaded via `next/font` in `src/app/layout.tsx`.
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

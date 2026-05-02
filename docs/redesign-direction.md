# Redesign direction

A working brief for the Olive Linen redesign pass. Source of truth for visual,
typographic and motion decisions on top of the existing operating system.

## Intent

The platform underneath is solid (Next.js / Supabase / Stripe / admin / portals).
The UI sitting on top of it leans too close to AI-template / SaaS / Tailwind-default.
This pass is about pulling it back to something that genuinely earns the word
"editorial" — a small premium service brand from Queenstown, presented like a
fashion / lifestyle title would present it.

Reference posture (in spirit, not in copy):
*Cereal*, *Apartamento*, *Le Labo*, *Aesop store windows*, Australian wedding
editorial.

## Hard rules

- No "01 / 03 / 02 / 03" garnish numerals
- No rotated postcard tags ("EST. …")
- No `↗` arrow on every link
- One pill CTA per surface — primary only. Secondary is hairline rectangular.
- No card with both a strong border *and* a heavy shadow. Pick one.
- Imagery must show the product. No wedding-couple photo standing in for a
  scallop napkin.
- Money formats with 2dp when fractional, no decimal when whole.

## Tokens

### Border progression

```
--border-hairline:   rgb(45 60 30 / 0.06)   /* edge of nothing */
--border-soft:       rgb(45 60 30 / 0.10)   /* default rule    */
--border-base:       rgb(45 60 30 / 0.16)   /* visible border  */
--border-strong:     rgb(45 60 30 / 0.28)   /* hover / focus   */
```

`--color-rule` and `--color-rule-soft` stay as aliases for back-compat.

### Surface progression

```
canvas:        var(--color-cream-100)  /* page ground */
paper:         #FAF7F1                 /* one step up */
linen:         #F1EBDC                 /* second step up */
ink-deep:      var(--color-olive-950)  /* dark sections */
```

Use `paper` for cards / floating panels on canvas. Use `linen` only for
sub-surfaces that need to read as a second layer (e.g. inside a paper card).

### Control sizes

```
--control-h-sm: 36px
--control-h-md: 44px
--control-h-lg: 52px
```

Buttons pick one. No more `!py-3 !py-4` ad-hoc overrides.

### Type

- Display 3xl: `clamp(4.5rem, 9.5vw, 9.5rem)` — for true showpiece hero moments
- Default `text-wrap: balance` on h1, h2, h3
- Body: `letter-spacing: -0.005em` at body sizes for warmth
- Lead paragraph: `text-lg`, line-height 1.5, max-w-prose

### Motion

- `--ease-soft`: `cubic-bezier(0.32, 0.72, 0, 1)` (added)
- `--duration-quick`: 180ms
- `--duration-base`: 280ms
- `--duration-slow`: 520ms
- `--duration-reveal`: 900ms

New `data-reveal` IntersectionObserver hook — adds `is-revealed` to elements
when they enter the viewport. Sections get a clean fade-up regardless of
position on the page. Honours `prefers-reduced-motion`.

## Components

### Header

- Wordmark: `h-6 md:h-7` (was `h-7 md:h-8` — leaning oversized)
- Cart icon: tiny `ShoppingBag` only when empty; clay dot indicator when count > 0
- Login: drop the inline word; the user can find it from the menu
- Active route: hairline rule on the bottom edge instead of clay underline (clay
  reserved for action moments)

### Footer

- Already strong. Tighten:
  - Tagline lockup at top of dark band — single confident line, no period
  - Newsletter input gets a sharper border treatment
  - Social row: text-only, hairline-divided

### Buttons

```
.btn-primary  { pill, clay 500, cream 50,    h-md }   // one per page
.btn-outline  { rect 4px, hairline, ink,      h-md }   // secondary
.btn-ghost    { no border, ink, underline-on-hover }   // tertiary
.btn-sm-md-lg { size variants for the above }
```

Existing `.btn` / `.btn-secondary` / `.btn-clay` / `.btn-ghost` stay as aliases
to avoid breaking call sites; primary recommendation forward is the new names.

### Cards

Single `.card` primitive. Three states:
- Resting: `paper` background, hairline border
- Hover: stronger border, `--shadow-soft`
- Selected: olive-700 border, no shadow

Eyebrow inside card uses olive-600. Headlines inside card are display-sm or display-md, never display-lg.

### Pills

`.pill` becomes a status atom. Tone variants:
- `pill-status-quiet`   — hairline border, ink-soft text
- `pill-status-active`  — olive-700 fill, cream text
- `pill-status-warning` — clay-300 border, clay-700 text

## Layout patterns

Three deliberately different section types. Use varied rhythm, not a uniform
"eyebrow + headline + grid" template.

### 1. Type-led

Wide gutter, small content column, deep vertical breathing.
- Eyebrow with a leading hairline rule
- Display headline (display-lg or display-md)
- 1–2 paragraphs of body
- One link or one CTA
- Optional hairline + small label at the bottom (date, place)

Used for: brand statement, FAQ section, the martini band.

### 2. Edge-to-edge

No shell padding. Image bleeds to viewport edges. Content overlaid in the
bottom-left, kept tight and quiet.

Used for: hero, occasional pause moments, hospitality cover.

### 3. Editorial split

Two columns, asymmetric (7/5 or 8/4). Image dominant on one side, type column
on the other. Generous bottom alignment.

Used for: featured product highlight, About cover, real-wedding case study cover.

## Imagery rules

Curated Unsplash IDs, vetted in pairs:

| Use                    | Photo IDs                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| Hero                   | Linen-set table from above, soft natural light                    |
| Brand statement detail | Folded napkin, hand-pressed look                                  |
| Product — scallop      | Napkin close-up, scalloped edge visible                            |
| Product — tablecloth   | Long-table linen, clearly the cloth                                |
| Product — runner       | Runner running down a centre, candles                              |
| Service tile — events  | Wedding table, linen visible, no people in foreground               |
| Service tile — retail  | Folded gift set, ribbon, soft surface                               |
| Service tile — custom  | Embroidered or stitched detail, brand logo on linen                 |
| Portfolio              | Real wedding tables, dressed in cream/sage/olive linen              |
| Landscape (about/IG)   | Wakatipu / Glenorchy / Wanaka soft mountain & lake imagery          |

Every URL is checked for 200 and visual fit before going into seed or CMS.

## Pages

| Page                          | Pattern        | Notes                                                |
| ----------------------------- | -------------- | ---------------------------------------------------- |
| `/` Home                      | Edge + split + type-led mix | Loses floating couple photo + EST tag |
| `/hire/dates`                 | Editorial split            | Custom date picker stays                  |
| `/hire/products`              | Editorial split            | Product grid + sticky cart                |
| `/hire/details`               | Editorial split            | Form + summary aside                      |
| `/hire/deposit`               | Editorial split            | Stripe Element + summary aside            |
| `/cart`                       | Type-led + summary aside   | Real implementation                       |
| `/shop`                       | Filters left + grid right  | Drop "HIRE & SHOP" overlay tag            |
| `/portfolio`                  | Edge-to-edge case studies  | Reduce empty whitespace at top            |
| `/hospitality`                | Editorial split + builder  | Better hero image                         |
| `/about`                      | Type-led + portrait        |                                           |
| `/account/*`                  | Portal shell               | Polish; fix dead booking actions          |
| `/trade/*`                    | Portal shell               | Polish                                    |
| `/admin/*`                    | Admin shell                | Tighten cards, divider weights            |

## Out of scope for this pass

- Per-unit serial inventory
- Multi-language
- Native mobile app
- Re-architecting the data layer (services + seeds + RLS stay as they are)

## Verification

Each pass ends with:
1. A targeted screenshot of the surface that changed
2. `npx tsc --noEmit` clean
3. Build passes when we hit a milestone (after homepage, after booking flow, after admin)

Mobile is verified at 375×812 for the homepage, hire flow, /cart, and one
account page at the end of the pass.

# Product photography mapping — May 2026 shoot

Source: `/Users/callum/Downloads/Small Files (150DPI)` (46 jpegs)

Storage: all uploads land at `public-media/products/{slug}/{kind}-{ts}-{filename}` via the existing `uploadProductImage` helper path (admin-only RLS).

## ✅ Confident matches (live in DB)

| Product | Slug | Hero | Gallery | Notes |
|---|---|---|---|---|
| Plain napkin · Oat | `plain-napkin-oat` | `Product Shots42676_Web` | `Product Shots42698_Web`, `1E9A2244` | Clean studio shot, oat-toned plain mitred linen — exact match |
| Scallop napkin · Olive | `scallop-napkin-olive` | `1E9A2259` | `1E9A2379` | Solid olive scallop on pedestal + edge detail. "Olive" interpreted as the body colour |
| Long tablecloth · Cream | `long-tablecloth-cream` | `1E9A2351` | `1E9A2367` | Warm beige heavyweight tablecloth + hem detail |
| Long tablecloth · Sage | `long-tablecloth-sage` | `1E9A2368` | — | Olive-green hem detail; reads slightly more olive than sage but closest match available |

## ⚠ No confident match in this shoot — left untouched

| Product | Slug | Why |
|---|---|---|
| Scallop napkin · Bone | `scallop-napkin-bone` | No solid bone-coloured scallop in the shoot. The white-with-bone-trim shots (`2263`/`2375`) are arguably the same product but the body reads white, not bone |
| Scallop napkin · Clay | `scallop-napkin-clay` | No clay/terracotta solid scallop. Pink-with-orange-trim (`2268`/`2371`) is the closest but body is pink |
| Table runner · Olive | `runner-olive` | No table-runner shots in this set (only square napkins, large tablecloths, edge details) |
| Table runner · Clay | `runner-clay` | Same as above |
| Set of six scallop napkins (gift box) | `napkin-set-gift-box` | No gift-box / multi-napkin grouping shot |
| Olive-leaf candle | `olive-leaf-candle` | No candle imagery in this set |

These products keep their existing seed/stock imagery. Recommended next shoot to fill these gaps.

## 📋 Review list — extra-variant photography (no SKU yet in DB)

The shoot covers ~17+ napkin colour/pattern variants and several tablecloth variants the studio actually produces but isn't currently selling on the site. **Strongly suggests catalogue expansion** — listed here so the studio can decide which to add.

### Plain napkins (mitred edge) — variants beyond `plain-napkin-oat`
| Files | Variant | Suggested SKU |
|---|---|---|
| `1E9A2241` | Solid olive plain | `plain-napkin-olive` |
| `1E9A2242` | Solid white plain | `plain-napkin-white` |
| `1E9A2245` / `2383` | Solid black plain | `plain-napkin-black` |
| `1E9A2249` / `2389` | Solid pink plain | `plain-napkin-pink` |
| `1E9A2250` / `2387` | Yellow stripe plain | `plain-napkin-yellow-stripe` |
| `1E9A2251` / `2386` | Beige gingham plain | `plain-napkin-beige-gingham` |
| `1E9A2253` / `2364` | Olive gingham plain | `plain-napkin-olive-gingham` |
| `1E9A2254` / `2382` | White body, black contrast mitred trim | `plain-napkin-white-black-trim` |
| `1E9A2256` / `2381` | Bone body, olive contrast mitred trim | `plain-napkin-bone-olive-trim` |
| `1E9A3308` / `3323` | White body, bone contrast mitred trim | `plain-napkin-white-bone-trim` |

### Scallop napkins — variants beyond `bone / clay / olive`
| Files | Variant | Suggested SKU |
|---|---|---|
| `1E9A2260` / `2378` | Solid lilac scallop | `scallop-napkin-lilac` |
| `1E9A2266` / `2373` | Natural body, apple-green scallop trim | `scallop-napkin-apple-green-on-natural` |
| `1E9A2263` / `2375` | White body, bone scallop trim | (could be `scallop-napkin-bone` if "Bone" means trim — needs confirmation) |
| `1E9A2268` / `2371` | Pink body, orange/clay scallop trim | `scallop-napkin-pink-clay-trim` |
| `1E9A3305` / `3326` | Solid yellow scallop | `scallop-napkin-yellow` |
| `Product Shots42682` / `42695` | Natural body, forest-green scallop trim | (could be alternative `scallop-napkin-olive` if "Olive" means trim — needs confirmation) |
| `Product Shots42685` / `42690` | White body, light-blue scallop trim | `scallop-napkin-white-blue-trim` |

### Ruffle-edge napkin — entirely new edge style
| Files | Variant | Note |
|---|---|---|
| `1E9A3316` / `3321` | White ruffle / frilled edge | Not currently in `hospitality.options.edges` either — would need adding both as a SKU and as a custom-builder option |

### Tablecloths — variants beyond `cream / sage`
| Files | Variant | Suggested SKU |
|---|---|---|
| `1E9A2280` / `2365` | White heavyweight | `long-tablecloth-white` |
| `1E9A2287` | Black heavyweight | `long-tablecloth-black` |
| `1E9A2285` / `2364` | Olive gingham | `long-tablecloth-olive-gingham` |

## Open question — interpretation of "Bone" / "Clay" / "Olive" in scallop SKUs

The catalogue describes the scallop napkins as:
- `Scallop napkin · Bone — 100% French linen, scallop edge, 50 × 50 cm`
- `Scallop napkin · Clay — same`
- `Scallop napkin · Olive — same`

Two readings of the colour:

1. **Body colour** (current mapping assumption): Bone = bone-coloured body; Clay = terracotta body; Olive = olive body. → Maps cleanly to `1E9A2259` for Olive but leaves Bone + Clay unmatched.

2. **Trim colour**: Natural-linen body, scallop trim in named colour. → Bone trim = `2263`/`2375`; Clay trim = `2268`/`2371` (with pink body, ambiguous); Olive trim = `42682`/`42695`.

If interpretation (2) is correct, the photo set covers all three SKUs cleanly. Studio confirmation would resolve this — until then the conservative reading (1) is in place and `42682`/`42695` are flagged for review.

## Source files

The 46 source jpegs remain in `~/Downloads/Small Files (150DPI)/` (not committed). Only the public URLs are referenced from the database.

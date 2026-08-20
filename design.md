# design.md

Design system rules for this repo. **Read this file before writing or editing any UI code.**

Source: Figma `9jH1CA083MSH69tSZUWcdK`, library "Spark - Design System". All values below are resolved from the `_Primitives` collection joined to the `1. color modes` semantic layer. They are exact, not approximations.

Ignore the "AURAR Component Library" also attached to that Figma file. Spark paths begin with `Colors/` or `Component colors/`. Lowercase `color/` paths are AURAR and are not ours.

---

## 0. Mode support

**This app is dark mode only.** The Spark export resolves a single mode. A light ramp (`Colors/Gray (light mode)`) exists in the primitives, but no semantic light mode has been published, so there is nothing for light tokens to map to. Do not build a theme switcher, do not call `useColorScheme()`, and do not invent light values.

If a light mode is published later, this file gains a second column and the hook gets added then.

---

## 1. Colour

Never write a raw hex in a component. Import from `constants/sparkTokens.ts`.

### Background

| Token | Value | Use for |
|---|---|---|
| `bgPrimary` | `#0B0F19` | Screen background |
| `bgSecondary` | `#161B26` | Cards, raised surfaces, tab bar |
| `bgTertiary` | `#212936` | Nested surfaces, chip backgrounds |
| `bgQuaternary` | `#374151` | Highest elevation |
| `bgActive` | `#212936` | Pressed and selected rows |
| `bgDisabled` | `#212936` | Disabled controls |
| `bgOverlay` | `#212936` | Modal scrim base |
| `bgBrandPrimary` | `#6950F7` | Brand tint surfaces |
| `bgBrandSolid` | `#5A41F7` | Primary button fill |
| `bgBrandSolidHover` | `#6950F7` | Primary button pressed |
| `bgSuccessPrimary` | `#053321` | Met-objective chip background |
| `bgSuccessSolid` | `#079455` | Solid success fill |
| `bgWarningPrimary` | `#4E1D09` | Trade-off warning background |
| `bgWarningSolid` | `#DC6803` | Solid warning fill |
| `bgErrorPrimary` | `#55160C` | Blocked-action background |
| `bgErrorSolid` | `#D92D20` | Destructive button fill |

### Text

| Token | Value | Use for |
|---|---|---|
| `textPrimary` | `#F3F4F6` | Headings, player names, body copy |
| `textSecondary` | `#B0B5BD` | Metadata, positions, captions |
| `textTertiary` | `#9CA3AF` | Lowest-emphasis labels |
| `textWhite` | `#FFFFFF` | Copy on solid brand fills |
| `textDisabled` | `#6B7280` | Disabled labels |
| `textPlaceholder` | `#6B7280` | Empty input placeholder |
| `textSuccessPrimary` | `#47CD89` | "Ready to propose", met objectives |
| `textWarningPrimary` | `#FDB022` | Unmet objectives, shortfalls |
| `textErrorPrimary` | `#F97066` | Blocked states only |

### Foreground (icons)

| Token | Value | Use for |
|---|---|---|
| `fgPrimary` | `#FFFFFF` | Full-emphasis icons |
| `fgSecondary` | `#B0B5BD` | Standard icons |
| `fgTertiary` | `#9CA3AF` | Reduced-emphasis icons |
| `fgQuaternary` | `#4B5563` | Decorative icons |
| `fgDisabled` | `#6B7280` | Disabled icons |
| `fgBrandPrimary` | `#6950F7` | Active tab, links, brand accent |
| `fgSuccessPrimary` | `#17B26A` | Success icons |
| `fgWarningPrimary` | `#F79009` | Warning icons |
| `fgErrorPrimary` | `#F04438` | Error icons |

### Border

| Token | Value | Use for |
|---|---|---|
| `borderPrimary` | `#374151` | Card outlines, input borders |
| `borderSecondary` | `#212936` | Dividers, list separators |
| `borderTertiary` | `#212936` | Lowest-emphasis rules |
| `borderBrand` | `#8773F7` | Selected chip, focused input |
| `borderError` | `#F97066` | Invalid input |
| `borderDisabled` | `#374151` | Disabled control outline |

---

## 2. Typography

Two families. **Clash Grotesk** for display, **Instrument Sans** for body. Both must be loaded via `expo-font` before first render.

Weights in both: Regular, Medium, Semibold, Bold, each with an italic.

| Style | Size | Line height | Family | Use for |
|---|---|---|---|---|
| `display2xl` | 72 | 90 | Clash Grotesk | Not used in-app |
| `displayXl` | 60 | 72 | Clash Grotesk | Not used in-app |
| `displayLg` | 48 | 60 | Clash Grotesk | Large numerals, band display |
| `displayMd` | 36 | 44 | Clash Grotesk | Screen titles |
| `displaySm` | 30 | 38 | Clash Grotesk | Section headings |
| `displayXs` | 24 | 32 | Clash Grotesk | Card titles, team letters |
| `textXl` | 20 | 30 | Instrument Sans | Emphasis body |
| `textLg` | 18 | 28 | Instrument Sans | Subheads |
| `textMd` | 16 | 24 | Instrument Sans | **Default body** |
| `textSm` | 14 | 20 | Instrument Sans | Metadata, list secondary text |
| `textXs` | 12 | 18 | Instrument Sans | Labels, captions, chips |

Line heights are fixed pairs. Never set a line height that is not the matched value for that size.

---

## 3. Spacing

4px base. Use tokens, never arbitrary numbers.

| Token | px | Token | px |
|---|---|---|---|
| `spacingNone` | 0 | `spacing3xl` | 24 |
| `spacingXxs` | 2 | `spacing4xl` | 32 |
| `spacingXs` | 4 | `spacing5xl` | 40 |
| `spacingSm` | 6 | `spacing6xl` | 48 |
| `spacingMd` | 8 | `spacing7xl` | 64 |
| `spacingLg` | 12 | `spacing8xl` | 80 |
| `spacingXl` | 16 | `spacing9xl` | 96 |
| `spacing2xl` | 20 | `spacing10xl` | 128 |

Half steps, for tight optical adjustments only: `spacingMdLg` 10, `spacingLgXl` 14, `spacingXl2xl` 18.

**Container padding is 16px on mobile.** Applies to every screen's horizontal inset.

---

## 4. Radius

| Token | px | Use for |
|---|---|---|
| `radiusNone` | 0 | |
| `radiusXxs` | 2 | |
| `radiusXs` | 4 | Small chips |
| `radiusSm` | 6 | Badges |
| `radiusMd` | 8 | Buttons, inputs |
| `radiusLg` | 10 | |
| `radiusXl` | 12 | Cards |
| `radius2xl` | 16 | Large cards, sheets |
| `radius3xl` | 20 | |
| `radius4xl` | 24 | |
| `radiusFull` | 9999 | Avatars, pills |

---

## 5. How to consume

Generate `constants/sparkTokens.ts` from the tables above as a flat `as const` object, with the original Figma path as a comment on each line. Since there is one mode, no hook and no context are needed.

```tsx
import { spark as s } from '@/constants/sparkTokens';

<View style={{
  backgroundColor: s.bgSecondary,
  borderRadius: s.radiusXl,
  padding: s.spacingXl,
}} />
```

**Never** write a hex, an `rgba()`, or a named colour in a component file. **Never** write a raw number for padding, margin, gap, font size, or radius. If nothing fits, use the nearest token and add `/* TODO: no exact Spark token */`.

---

## 6. Semantic rules specific to this product

These override generic convention, and the reasoning matters more than the colour.

**Amber is for trade-offs. Red is for blocks.** An unmet soft objective (friend pairs at 2 of 4, a wide strength gap) uses `bgWarningPrimary` and `textWarningPrimary`. A trade-off is not a mistake, and colouring it red pushes the host toward treating balance as the only goal. Error tokens are reserved for genuinely blocked states: a drag that would break team composition, a session that cannot be solved.

**Bands are integers.** A band renders as `4`, never `3.8`. The underlying rating has nowhere near that precision.

**A null band renders as the word "new".** Never `?`, `-`, or `0`. A player with fewer than three recorded sessions has no band.

**No numeric rating on any player-facing surface.** Bands only. Product rule, not a style preference.

**Colliding first names get a surname initial.** If two players in one session share a first name, both get an initial, never one and not the other.

**Buttons say what happens.** "Move anyway", not "Confirm". "Propose teams", not "Submit". The same action keeps its label on every screen.

**Sentence case everywhere.** Headings, buttons, labels, tabs. Never title case.

**No em dashes in UI copy.** Commas, semicolons, or rewrite.

---

## 7. Components

`Button primary` is published as a component set in the Spark library with variants. Check the library before hand-rolling any button, chip, badge, input, or list row.

Components legitimately local to this app, because Spark has no equivalent:

| Component | Reason |
|---|---|
| Court position grid | Volleyball-specific zone layout |
| Trade-off metric row | Product-specific |
| Team card | Product-specific composition |

---

## 8. Accessibility

- Minimum touch target 44 by 44. The host uses this one-handed, standing, in a sports hall.
- Never signal state by colour alone. An unmet objective carries a word or icon as well as an amber token.
- `textTertiary` `#9CA3AF` on `bgPrimary` `#0B0F19` passes AA for body text. `textDisabled` `#6B7280` does not, so use it only for genuinely disabled elements.
- Respect `prefers-reduced-motion` on every transition.

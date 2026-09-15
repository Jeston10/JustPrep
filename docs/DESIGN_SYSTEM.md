# Design System

JustPrep should look like a serious tool built by a small, opinionated team — closer to a trading terminal or a well-made editor than to a SaaS template. Hard edges, dense information, one accent colour, real words.

## 1. Principles

1. **Edged, not rounded.** `--radius: 0`. Structure is expressed with 1 px hairlines and spacing, not with pills and blobs.
2. **Monochrome + one accent.** Near-black and off-white surfaces; a single accent used only for the primary action and the "current" state. Scores use a fixed semantic scale (§3.3), not rainbow gradients.
3. **Type does the work.** Two typefaces, strict scale, tabular numerals. Headings are tight and left-aligned. Numbers are the hero on a feedback page, not an illustration.
4. **Density with rhythm.** Dashboards show more per screen than a landing page would. 4 px base grid; 8/12/16/24/32/48/64 spacing steps.
5. **Motion explains change.** Animate what changed (a score updating, a panel entering) and nothing else.
6. **States are designed, not defaulted.** Empty, loading, error, and partial states are drawn for every screen.

## 2. Typography

| Role | Face | Notes |
|---|---|---|
| Display / headings | **Instrument Serif** or **Fraunces** (variable) | One serif adds character and separates us from the sans-only SaaS look. Use at `h1`–`h2` only. |
| UI / body | **Geist Sans** (variable) | Neutral, excellent at small sizes. |
| Mono / numbers / code | **Geist Mono** | Scores, timers, transcripts timestamps, code. `font-variant-numeric: tabular-nums`. |

Scale (fluid, `clamp()`): `xs 12 · sm 13 · base 15 · lg 17 · xl 20 · 2xl 24 · 3xl 32 · 4xl clamp(36px, 4vw, 56px)`. Line-height 1.5 body, 1.1 display. Letter-spacing −0.01em on headings, +0.04em uppercase labels (11–12 px, weight 500).

Fonts are self-hosted via `next/font` (no runtime Google Fonts requests).

## 3. Colour tokens (`styles/globals.css` `@theme`)

### 3.1 Dark (default)
```
--color-bg:          #0B0B0C   page
--color-bg-elev:     #121214   panels, cards
--color-bg-elev-2:   #19191C   nested panels, table header
--color-line:        #26262B   hairline borders
--color-line-strong: #3A3A42   focused/hovered borders
--color-fg:          #F2F2F0   primary text
--color-fg-muted:    #A1A1AA   secondary text
--color-fg-subtle:   #6B6B76   placeholders, captions
--color-accent:      #D9F26B   primary action (acid lime) — used sparingly
--color-accent-fg:   #0B0B0C   text on accent
--color-danger:      #FF5C5C
--color-warning:     #FFB454
--color-success:     #58D68D
--color-info:        #7DB2FF
```
### 3.2 Light (optional, M5)
Same roles inverted: bg `#F7F7F5`, elev `#FFFFFF`, line `#E5E5E1`, fg `#111111`, accent stays lime with fg `#0B0B0C`.

### 3.3 Score scale (fixed, semantic)
`0–39` danger · `40–59` warning · `60–79` fg (neutral) · `80–100` success. Scores never use the accent colour; the accent is for actions.

### 3.4 Usage rules
- Accent appears at most once per viewport as a filled element (the primary button). Elsewhere it is a 2 px underline or text.
- No gradients on surfaces or text. No coloured glows. Shadows only on floating layers (dialog/popover): `0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px rgba(0,0,0,.4)`.
- Borders: 1 px `--color-line`; hover → `--color-line-strong`; focus → 2 px accent ring, offset 2 px.

## 4. Surfaces and components

| Component | Spec |
|---|---|
| Card / panel | `bg-elev`, 1 px line, radius 0, padding 16 (mobile) / 20 (desktop). Header row with 11 px uppercase label + optional action on the right. |
| Button | Heights 32 / 36 / 40. Radius 0. Variants: `primary` (accent fill), `secondary` (elev-2 fill + line), `ghost`, `danger`. Loading state swaps label for a 12 px spinner + keeps width. |
| Input / select / textarea | Height 36 / 40. `bg-elev`, 1 px line; focus 2 px accent ring. Label above (12 px, muted). Error text 12 px danger below. |
| Table / list | Row height 44; header 32 with uppercase labels; zebra none; hover row `bg-elev-2`. On < 768 px, tables collapse to stacked cards (see RESPONSIVE §4). |
| Tabs | Underline style, 2 px accent under active. |
| Badge / tag | Radius 0, 20 px height, uppercase 11 px, line border, no fills except semantic status. |
| Dialog / sheet | Radius 0, 1 px line; on mobile becomes a bottom sheet (`vaul`). |
| Skeleton | Same box geometry as the loaded layout; single subtle shimmer; radius 0. |
| Empty state | Left-aligned: 16 px title, 14 px muted body, one primary action. No illustration required; if used, a 1-colour line icon at 24 px. |
| Score display | `Geist Mono`, 48–72 px, tabular, animated with `@number-flow/react`; category rows show a 4 px bar with semantic colour. |
| Transcript | Two-column on desktop (speaker label left 96 px, text right); timestamps mono 12 px; highlighted evidence spans use a 2 px underline in warning/success, not background fills. |
| Charts | Recharts: gridlines `--color-line`, axis text `fg-subtle` 12 px mono, series `fg` for primary and `fg-muted` for comparison; tooltips are panels per the card spec. No area gradients. |

## 5. Motion (`motion/react`)

- Durations: micro 120 ms · standard 200 ms · panel 280 ms. Easing: `[0.2, 0, 0, 1]` (out) for enter, `[0.4, 0, 1, 1]` for exit.
- Use: `AnimatePresence` for route/panel enter/exit; `layout` for list reorder/resize; `@number-flow/react` for score changes; `useReducedMotion` gates everything to opacity-only.
- Do not: loop animations on idle elements; bounce; scale > 1.02 on hover; parallax; auto-playing carousels.
- Voice session: a single 2 px level meter that reflects real mic amplitude, not a decorative "AI is thinking" orb.

## 6. Layout

- App shell: 240 px sidebar (collapsible to 56 px icons) on ≥ 1024 px; top bar 48 px; content max-width 1280 px with 24 px gutters. Below 1024 px: top bar + bottom tab bar (Dashboard, Interviews, Plan, Profile) and sheet navigation.
- Page header: title (2xl), one-line description (muted), primary action right-aligned; on mobile the action drops below the title, full width.
- Grid: 12 columns desktop, 4 columns mobile; cards span whole columns; no fixed pixel widths.

## 7. "Does this look AI-generated?" checklist (merge gate)

Reject the change if any of these are true:

- [ ] Any surface has a border radius > 0 (except avatars/status dots).
- [ ] A purple/violet/indigo hue, a gradient background, gradient text, or a glow shadow is present.
- [ ] Glassmorphism (`backdrop-blur` panels over gradients).
- [ ] An emoji appears in UI copy, headings, buttons, or toasts.
- [ ] Decorative imagery: robots, brains, abstract 3D blobs, stock "diverse team" photos, generic hero illustrations.
- [ ] A centred hero with a headline like "Unlock / Supercharge / Elevate / Level up / Ace your …", "AI-powered" as a badge, or three feature cards with icons in circles.
- [ ] Filler widgets: rotating quotes, live clock, news feed, "high-paying jobs", streak stars bouncing.
- [ ] Copy that could apply to any product ("Practice real interview questions & get instant feedback!"). Copy must reference *this user's* data or a concrete outcome ("Your last three attempts lost points on structure — try the STAR drill").
- [ ] Infinite `animate-pulse`/`animate-bounce`/`animate-ping` on non-loading elements.
- [ ] Every element centred; no left alignment or asymmetry.
- [ ] Icons used as decoration rather than to disambiguate actions.
- [ ] Toasts for things that do not need confirmation.
- [ ] Missing empty/loading/error states.
- [ ] Missing hover/focus/active states, or focus rings removed.
- [ ] Text contrast below WCAG AA (4.5:1 body, 3:1 large).

Banned words in UI copy: *unlock, supercharge, elevate, seamless, cutting-edge, revolutionary, empower, journey, unleash, effortless, next-level, game-changer, AI-powered (as a badge), magic*.

## 8. Voice and tone

Direct, second person, present tense. Sentences under 15 words in UI. Numbers over adjectives ("Score 71, up 9 from last attempt" not "Great improvement!"). Errors say what happened and what to do next.

## 9. Assets

- Logo: wordmark in Instrument Serif, no icon required; a 1-colour mark for favicon/PWA.
- Company/tech logos: only official monochrome SVGs from `simple-icons`, rendered at `fg-muted`; never colourful devicon PNGs.
- No cover images on interview cards; the card shows role, level, type, stack chips, and the user's best score.

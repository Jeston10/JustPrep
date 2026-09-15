# Component Library — sourcing and adaptation

We do not hand-build primitives. We pull them from shadcn/ui and the 21st.dev registry, then adapt them to our tokens. This keeps velocity high and consistency total.

## 1. Sources (in order of preference)

| Source | Use for | How |
|---|---|---|
| **shadcn/ui** (Radix-based) | All primitives: button, input, textarea, select, checkbox, radio, switch, tabs, dialog, sheet, popover, dropdown, tooltip, table, skeleton, badge, separator, scroll-area, command (cmdk), toast (sonner), form | `pnpm dlx shadcn@latest add <name>` |
| **21st.dev registry** | Composed patterns: app shells/sidebars, page headers, stat blocks, data tables with toolbars, empty states, pricing tables, auth forms, bento/dashboard grids, file upload zones, chat/message lists, audio/waveform visualisers, timeline/steps | `pnpm dlx shadcn@latest add "https://21st.dev/r/<author>/<component>"`. Optional: 21st.dev **Magic MCP** for searching/generating from the editor. |
| **motion** (`motion/react`) | Presence, layout, gestures, number transitions (with `@number-flow/react`) | Wrapped in `components/ui/motion/*` helpers that respect reduced motion |
| Custom (`components/ui`, `components/charts`) | Only when the above have nothing suitable: score display, transcript, level meter, question stepper | Built on Radix primitives + tokens |

Never install a second UI kit (MUI, Chakra, Mantine, Ant, DaisyUI) or copy components from templates with their own token systems.

## 2. Adaptation procedure (every imported component)

1. **Install** into `components/ui/<name>.tsx` (shadcn) or `components/ui/<category>/<name>.tsx` (21st.dev). Commit the raw import as its own commit (`chore(ui): import <name> from 21st.dev/<author>`), so future diffs show our changes.
2. **De-round**: remove every `rounded-*` class (except `rounded-full` on avatar/status dot). Set `--radius: 0` globally so shadcn tokens resolve to 0 anyway.
3. **Re-token**: replace hard-coded colours (`bg-gray-900`, `text-purple-300`, `#1a1625`) with semantic classes (`bg-elev`, `text-fg-muted`, `border-line`). Replace `shadow-*` with none or the floating-layer shadow.
4. **Strip decoration**: gradients, glows, blur, emoji, `animate-pulse` on non-loading elements, decorative icons.
5. **Variants via `cva`**: expose size/variant props; do not create `ButtonPrimary`, `ButtonSecondary` files.
6. **A11y pass**: keyboard path, focus ring visible, `aria-*` correct, touch target ≥ 44 px on mobile, `prefers-reduced-motion` honoured.
7. **Responsive pass**: verify at 375 / 768 / 1280 px; tables become stacked cards below 768 px.
8. **Story/test**: add a usage example under `components/ui/__examples__/` (rendered on the internal `/dev/ui` route, excluded from production) and a smoke test if the component has logic.
9. **Document** any prop additions in the file header comment.

## 3. Component inventory (target)

### Primitives (`components/ui`)
button · icon-button · input · textarea · select · combobox · checkbox · radio-group · switch · slider · tabs · dialog · sheet (bottom on mobile) · popover · dropdown-menu · tooltip · command · table · pagination · skeleton · badge · separator · scroll-area · progress · toast · avatar · kbd · form (RHF bindings) · field (label + control + help + error)

### Layout (`components/layout`)
AppShell (sidebar + topbar + bottom tabs) · PageHeader · Section · Panel (card with header row) · EmptyState · ErrorState · Stat (label + mono value + delta)

### Feature composites (`features/*/components`)
- interview: InterviewForm (multi-step: role/level → type/stack → company/source → review), InterviewCard, InterviewList (with `nuqs` filters), QuestionList
- attempt: SessionShell, VoiceSession (level meter, captions, barge-in, tier badge), TextSession (chat with streaming), QuestionStepper, SessionControls (mic, end, mode switch), PermissionPrompt
- feedback: OverallScore (`number-flow`), CategoryBars, PerQuestionAccordion, AnnotatedTranscript (evidence underlines), Trend (recharts line), NextSteps
- resume: ResumeDropzone (presigned upload, progress), ResumeSummary
- assistant: AssistantPanel (sheet on mobile, side panel on desktop)
- profile/settings: ProfileForm, DangerZone (delete account with re-auth)

### Charts (`components/charts`)
ScoreTrend (line) · CategoryRadar (radar, muted) · UsageBars (quota)

## 4. 21st.dev search hints

When looking for a pattern on 21st.dev, prefer components that are: Tailwind + Radix based, no external CSS, no framer-motion-heavy decoration, dark-mode aware. Search terms that map to our needs: "sidebar", "dashboard shell", "stats", "data table toolbar", "empty state", "file upload", "chat", "stepper", "audio visualizer", "timeline", "settings form", "auth form", "pricing" (free tier page).

Reject candidates with: gradients/glow by default, rounded-2xl everywhere that would take longer to strip than to rebuild, `any` types, inline styles, or dependencies not in `docs/TECH_STACK.md` §4.

## 5. Motion helpers (`components/ui/motion`)

- `Presence` — `AnimatePresence` + `mode="popLayout"` wrapper with our easing/duration presets.
- `FadeIn`, `SlideUp` — reduced-motion aware.
- `Stagger` — list entrance with 30 ms stagger, capped at 8 items.
- `useReducedMotion` re-exported from `motion/react`; all helpers collapse to opacity-only when true.

## 6. Icons

`lucide-react` only, 16 px in dense UI, 20 px in headers, stroke 1.75. Company/tech logos via `simple-icons` SVG paths rendered monochrome.

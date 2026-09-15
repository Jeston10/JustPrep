# Responsive & Device Rules

Mobile-first. Every screen is built at 375 px first, then expanded. "Works on desktop, squishes on mobile" is a failed review.

## 1. Breakpoints (Tailwind v4 defaults, used semantically)

| Token | Min width | Meaning in this app |
|---|---|---|
| base | 0 | Phones portrait. Single column, bottom tab bar, sheets instead of dialogs. |
| `sm` | 640 | Large phones / phones landscape. Two-up cards where content allows. |
| `md` | 768 | Tablets portrait. Two columns; tables regain columns; dialogs allowed. |
| `lg` | 1024 | Tablets landscape / small laptops. Sidebar appears (collapsed). |
| `xl` | 1280 | Laptops. Sidebar expanded; content max-width 1280. |
| `2xl` | 1536 | Desktops. Extra gutter only; no new layouts. |

Use **container queries** (`@container`, Tailwind `@sm:` `@md:` variants) for components that live in variable-width slots (cards in a grid, panels in a split view) so they adapt to their container, not the viewport.

## 2. Device matrix (verify before merge)

| Device | Viewport | Notes |
|---|---|---|
| iPhone SE (2022) | 375 × 667 | Smallest supported; nothing may overflow horizontally. |
| iPhone 15/16 | 393 × 852 | Safe-area insets (`env(safe-area-inset-*)`) for bottom tab bar. |
| iPhone 15/16 Pro Max | 430 × 932 | |
| Pixel 8 | 412 × 915 | Android Chrome — Web Speech API path. |
| Galaxy Z Fold (folded / unfolded) | 344 × 882 / 884 × 1104 | Narrowest width; verify text does not wrap into single words. |
| iPad mini | 744 × 1133 | `md` layout. |
| iPad Pro 11" | 834 × 1194 (portrait) / 1194 × 834 | `lg` layout both orientations. |
| Laptop | 1280 × 720, 1366 × 768, 1440 × 900 | Check 720 px height: session UI must fit without scrolling. |
| Desktop | 1920 × 1080 | |
| Ultrawide | 2560 × 1080 | Max-width containment; no stretched cards. |
| Phone landscape | 852 × 393 | Voice session must remain usable (controls visible, captions readable). |

Also verify: 200 % browser zoom at 1280 px; Windows high-contrast mode; `prefers-reduced-motion`; Safari iOS (100vh bug → use `100dvh`).

## 3. Rules

1. **No fixed pixel widths on layout containers.** Use `w-full`, `max-w-*`, `min-w-0`, grid tracks with `minmax(0, 1fr)`. Fixed sizes are allowed only on icons, avatars, and the sidebar.
2. **Fluid type and spacing.** Display sizes use `clamp()`; page gutters `px-4 sm:px-6 lg:px-8`.
3. **Touch targets ≥ 44 × 44 px** on `base`–`md`; 32 px allowed at `lg+` for dense tables.
4. **Hover is not a requirement.** Any information revealed on hover is also available on tap/focus (tooltips become popovers on touch; the streak tooltip pattern from v1 is banned).
5. **Tables** collapse to stacked "label: value" cards below `md`; row actions move into a menu.
6. **Dialogs** become bottom sheets below `md` (`vaul`), full-height with a drag handle.
7. **Navigation**: sidebar (`lg+`) ↔ bottom tab bar (`< lg`). Both expose the same four destinations.
8. **Images**: `next/image` with `sizes` set for every breakpoint; `priority` only above the fold; no images wider than their container.
9. **Long content**: `overflow-x-auto` on code/transcript blocks; `break-words` on user-generated text; `line-clamp` on card previews.
10. **Safe areas**: bottom bars and floating controls add `pb-[env(safe-area-inset-bottom)]`.
11. **Keyboard on mobile**: inputs use correct `inputMode`/`autoComplete`; the layout uses `100dvh` so the on-screen keyboard does not hide the submit button.
12. **Session screens** (voice/text interview) must fit in 375 × 667 and 852 × 393 with mic control, end control, current question, and captions all visible without scrolling.
13. **Wake lock** during voice sessions (`navigator.wakeLock`) so the screen does not sleep mid-answer.
14. **Performance on mobile**: LCP < 2.5 s on 4G throttling for dashboard; session page JS < 200 kB gzipped before lazy chunks.

## 4. Patterns

```tsx
// Card grid that adapts to its container, not the viewport
<div className="@container">
  <ul className="grid grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3 gap-4">…</ul>
</div>

// Table → stacked cards
<Table className="hidden md:table" … />
<ul className="md:hidden divide-y divide-line">…</ul>

// Responsive dialog/sheet
const isDesktop = useMediaQuery("(min-width: 768px)");
return isDesktop ? <Dialog … /> : <Drawer … />;
```

## 5. Verification procedure

1. Run the app; open DevTools device toolbar; step through the matrix in §2 (at least: 375, 412, 768, 1024, 1280, 1920 and one landscape phone).
2. Check: no horizontal scrollbar on `body`; all controls reachable; text not truncated unexpectedly; focus order sensible.
3. Playwright `tests/e2e/responsive.spec.ts` snapshots the dashboard, interview form, session, and feedback pages at 375 / 768 / 1280 and fails on horizontal overflow (`document.documentElement.scrollWidth > clientWidth`).
4. Attach 375 px and 1440 px screenshots to the PR.

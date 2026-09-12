# Nebrepora design system — arcade theme

**Intent:** the board is an arcade maze. Black ground, blue dotted walls, pellet-peach highlights, pixel-font display type over a readable mono body, and one colour-coded pixel icon per department. The brand mark is the gold voxel **N** with a peach breakout cube (see `brand/logo/`). No third-party characters or trademarks are used. Every text pair meets WCAG 2.2 AA.

All tokens live in `public/styles.css` under `:root`. Components must use tokens, never raw values.

## Tokens

### Color (ratios against `--surface #000000`)

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--surface` | `#000000` | Page, panels, cards, dialogs | — |
| `--text` | `#FFFFFF` | Primary text | 21:1 |
| `--muted` | `#C8C8DC` | Secondary text | 11.7:1 |
| `--dim` | `#A3A3C2` | Tertiary text, placeholders | 8.6:1 |
| `--accent` | `#2A3FE5` | Maze walls: borders, rules, fills. **Never text.** | 2.94:1 |
| `--accent-fill` / `--on-accent` | `#2A3FE5` / `#FFFFFF` | Primary button, pressed chip/department | 7.14:1 |
| `--accent-text` | `#5768EB` | Body-size links on `--surface` only | 4.59:1 |
| `--accent-line` | `#8C98F5` | Borders of interactive controls | ≥ 3:1 |
| `--secondary` | `#F4B9B0` | Pellets, labels, pinned state, focus ring | 12.4:1 |
| `--success` / `--warning` + `--on-status` | `#16A34A` / `#D97706` + `#000` | Velocity badge fills | 6.4 / 6.6:1 |
| `--neutral` | `#3A3A5C` | "Watch" badge fill (white text), idle control borders | 10.8:1 w/ white |
| `--danger` / `--danger-text` | `#DC2626` / `#F87171` | Fill/border / text | — / 7.0:1 |
| `--info` | `#22D3EE` | "Live scan" badge | 10.7:1 |
| `--gold` | `#E2B24A` | Nebrepora mark only (header, All-departments icon) | decorative |

Department icons are original 8×8 pixel sprites (`view.js`), decorative, and always sit beside a text label: Engineering = terminal `>_` (`--dept-eng`, red), Game UI/UX = D-pad (`--dept-ui`, peach), Art = pencil (`--dept-art`, cyan), Other engineering = gear (`--dept-ops`, orange). All departments = the mini N mark (`--gold`, with a `--secondary` breakout pixel).

Panels **must** stay `--surface`. On a lifted panel (`#0B0B24`), `--accent-text` falls to 4.22:1 and fails.

### Type

| Role | Face | Sizes |
|---|---|---|
| Display: h1, section h2, card h3, labels, table headers | Press Start 2P (uppercase) | 8, 12, 16, 24, 32px (multiples of 8 render crisply) |
| Body, buttons, badges, long headings (FAQ) | Space Mono 400/700 | 12, 14, 16px |

Long question headings (FAQ) use Space Mono bold: the pixel face loses legibility past ~24 characters. Minimum text size is 12px, except 8px pixel-face labels (their glyphs fill the em box, so they read at about 10px).

### Space, shape, targets

- Spacing: 8pt grid (`--s1` 8px … `--s6` 64px); `--s-half` 4px only for tight insets.
- `--radius: 0` everywhere. 8-bit has no curves.
- `--wall: 4px dotted var(--accent)` for panels and cards; `--wall-solid` for dialogs.
- Targets: buttons and inputs 44px (`--target`); chips and small buttons 32px with a fine pointer (`--target-fine`) and 44px on touch (`pointer: coarse`).

## Components

| Component | Default | Hover | Focus-visible | Pressed / active | Disabled |
|---|---|---|---|---|---|
| Button (`.ghost`) | black, 2px `--accent-line` border | `--accent-fill` + `--on-accent` | 3px `--secondary` outline, 3px offset | 2px press-down | 50% opacity, not-allowed |
| Primary (`.btn.primary`) | `--accent-fill` | `--secondary` fill, black text | same | same | same |
| Chip | black, 2px `--neutral` border, `--muted` text | `--accent-line` border | same | `--accent-fill` fill (plus `aria-pressed`) | — |
| Department card | as chip, with pixel icon + count | as chip | same | `--accent-fill`, all text `--on-accent` | — |
| Card | `--wall` | none (cards aren't clickable) | — | pinned: 4px solid `--secondary` | — |
| Fresh (scan-added) card | 4 blinks to `--secondary` | — | — | reduced motion: static `--secondary` border | — |

- Digest is a high-score table (`1ST` / `2ND` / `3RD`).
- Dividers are pellet rows (`.pellets`, lane heads, footer), always static.
- The only motion is the fresh-card blink (to show what a scan added) and the button press. Both are disabled under `prefers-reduced-motion`.
- Forced-colors mode swaps borders to `CanvasText` and pressed states to a `Highlight` outline.

## Do / don't

- **Do** put body accent text in `--accent-text`. **Don't** put body text in `--accent`, which is 2.94:1 and fails.
- **Do** use `--danger-text` for red text. **Don't** use `--danger` as a text color (4.35:1).
- **Do** keep headings short in Press Start 2P. **Don't** set paragraphs or FAQ questions in the pixel face.
- **Do** pair every department icon with its name. **Don't** use icon colour alone to convey a department.
- **Don't** add third-party game characters or logos (Pac-Man, ghosts, etc.); they are trademarks.
- **Don't** add inline `style=""` or `<style>`: the CSP blocks them and `npm run check` fails.
- **Don't** add rounded corners, gradients on surfaces, or decorative looping animation.

## QA checklist (code review)

- [ ] New colors come from tokens; any new text pair is ≥ 4.5:1 (≥ 3:1 for 24px+ or 18.66px+ bold)
- [ ] Interactive controls: 44px tall (buttons/inputs), ≥ 32px fine and 44px coarse (chips/small)
- [ ] Focus ring visible on every control (Tab through header, filters, a card, the dialog)
- [ ] `border-radius` is 0; spacing values are multiples of 8 (4 only for insets)
- [ ] Pixel face only on short display text; body copy in Space Mono
- [ ] `prefers-reduced-motion` removes the blink and press; forced-colors still shows state
- [ ] `npm run check` passes (syntax, CSP lint, asset/favicon check, prerender drift)
- [ ] Icon or share-image changes were re-rendered with `npm run assets`

# Doodle Design System

## Context and goals

A creative, playful, and informal style that uses doodles, sketches, handwritten fonts, and imperfect lines to foster emotional connection and a raw, artistic feel. The system must remain accessible (WCAG 2.2 AA), keyboard-first, and implementation-ready for engineers.

## Design tokens and foundations

| Token | Value | Usage |
|---|---|---|
| primary | `#49B6E5` | main brand accent, CTAs |
| secondary | `#263D5B` | supporting surfaces, headers |
| success | `#16A34A` | positive states |
| warning | `#D97706` | caution states |
| danger | `#DC2626` | error states |
| surface | `#FFFFFF` | card / elevated backgrounds |
| text | `#111827` | primary text |
| text-secondary | `#5A6478` | supporting text |
| bg-default | `#F4F6FA` | app background |
| shadow | `0 4px 14px rgba(38,61,91,0.18)` | base elevation |
| shadow-hover | `0 8px 22px rgba(38,61,91,0.28)` | hover elevation |

**Typography scale:** 14 / 16 / 18 / 24 / 32 / 40
- primary font: **Delius Swash Caps** (handwritten display)
- mono font: **JetBrains Mono**
- weights: 100–900

**Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 (multiples of 4)

**Shape:** border-radius 14–16 (soft, rounded — never sharp corners)

## Component-level rules

### Button
- **Anatomy:** rounded capsule (14px), min-height 44px, horizontal padding 1.25rem, subtle hand-drawn shadow.
- **Variants:** contained (gradient primary), outlined, text.
- **States:** default → hover (deeper shadow, slight lift) → focus-visible (2px dashed outline, offset 2px) → active (press down) → disabled (opacity 0.5, no shadow).
- **Keyboard:** focus-visible must be visible; Enter/Space activates.
- **Spacing:** 8px gap between buttons in a row; 16px vertical stack.
- **Anti-pattern:** no square corners, no text-transform uppercase (button uses none).

### Card
- **Anatomy:** 16px border-radius, 1px solid `rgba(73,182,229,0.18)`, base shadow.
- **States:** default → hover (shadow-hover, translateY -2px).
- **Edge cases:** long titles truncate with ellipsis; empty state shows a doodle icon + heading + helper text.

### Chip
- **Anatomy:** pill shape (999px), 6px vertical padding, 12px horizontal, font-weight 600.
- **States:** default, selected (outlined, primary border), removable (trailing close icon).
- **Overflow:** max 2 chips per row; extras collapse into a "+N" chip.

## Accessibility requirements

- WCAG 2.2 AA minimum.
- All interactive elements reachable via Tab; focus order follows visual order.
- Visible focus indicator on every interactive element (never `outline: none`).
- Color contrast: text on surface ≥ 4.5:1; primary text `#111827` on `#FFFFFF` = 17.7:1 ✓.
- Buttons and chips must have an accessible name (label or aria-label).
- Touch targets ≥ 44×44px.

## Content and tone standards

- Concise, confident, helpful — no filler.
- Use doodle-style icons (hand-drawn strokes) sparingly; one per empty state.
- Labels are sentence-case; never title-case for UI labels.

## Anti-patterns

- ❌ Sharp corners (border-radius < 8) on interactive components.
- ❌ Crisp drop shadows with hard edges.
- ❌ Using raw token hex values in components — always go through the theme.
- ❌ Low-contrast text (e.g. `#9CA3AF` on `#FFFFFF` = 2.9:1).
- ❌ Uppercase button labels.

## QA checklist

- [ ] Every button has a visible focus-visible state.
- [ ] No component uses a raw hex value directly (all via theme tokens).
- [ ] All interactive elements are ≥ 44px touch target.
- [ ] Empty states render a doodle icon, heading, and helper text.
- [ ] Spacing follows the 4/8/12/16/24/32 scale — no arbitrary values.
- [ ] Typography uses the defined scale (14/16/18/24/32/40).
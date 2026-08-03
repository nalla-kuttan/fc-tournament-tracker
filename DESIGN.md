---
name: FC Tournament Tracker
description: A competitive match-night control room for FC tournaments, standings, rivalries, analytics, and AI reports.
colors:
  pitch-black: "#020617"
  panel-slate: "#0F172A"
  text-ice: "#F8FAFC"
  text-steel: "#94A3B8"
  text-muted: "#64748B"
  primary-green: "#22C55E"
  primary-green-light: "#4ADE80"
  primary-green-dark: "#16A34A"
  electric-blue: "#3B82F6"
  electric-blue-light: "#60A5FA"
  electric-blue-dark: "#2563EB"
  danger-red: "#EF4444"
  warning-amber: "#F59E0B"
typography:
  display:
    fontFamily: "Chakra Petch, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.5px"
  headline:
    fontFamily: "Chakra Petch, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.3px"
  title:
    fontFamily: "Chakra Petch, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.2px"
  body:
    fontFamily: "Chakra Petch, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Chakra Petch, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  indicator: "4px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  dialog: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-green}"
    textColor: "{colors.pitch-black}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.text-ice}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  card-glass:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.text-ice}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input-field:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.text-ice}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: FC Tournament Tracker

## 1. Overview

**Creative North Star: "The Match-Night Control Room"**

FC Tournament Tracker should feel like a private competitive command center for a friend group: dark, focused, energetic, and exact. The system uses a deep navy-black field, electric pitch-green state color, and compact technical typography to make tournaments feel live without turning every screen into decoration.

The interface is product-first. Tables, forms, standings, brackets, player cards, and analytics panels must be readable under match-night pressure. The visual drama comes from hierarchy, ranking, current state, rivalry context, and selective glow, not from generic esports clutter.

**Key Characteristics:**
- Dark OLED-style surfaces with layered slate panels.
- Primary green reserved for action, selection, success, and live competitive status.
- Electric blue used as a secondary analytical accent, never as a competing CTA.
- Chakra Petch across the product for a technical match-broadcast voice.
- Solid tonal surfaces establish hierarchy; glow is reserved for active state and focus.

## 2. Colors

The palette is a restrained dark product system with one competitive primary and one analytical secondary.

### Primary
- **Pitchline Green**: The main action and state color. Use it for primary CTAs, selected navigation, success states, active steps, rankings, and meaningful highlights.
- **Bright Pitchline**: The lifted green used for icons, active marks, and small high-energy accents.
- **Deep Pitchline**: The pressed or lower-emphasis green used in gradients and state transitions.

### Secondary
- **Analyst Blue**: The secondary accent for AI, charts, comparison context, and analytical contrast.
- **Bright Analyst Blue**: The hover or highlighted blue for chart and AI moments.
- **Deep Analyst Blue**: The subdued blue for darker gradients and informational states.

### Tertiary
- **Result Red**: Error, loss, destructive, or negative-result state.
- **Fixture Amber**: Warning, pending, incomplete, or schedule-sensitive state.

### Neutral
- **Stadium Black**: The body background and deepest app shell layer.
- **Panel Slate**: The main card, paper, dialog, field, and sidebar surface.
- **Ice Text**: Primary text on dark surfaces.
- **Steel Text**: Secondary text, helper copy, metadata, and inactive icons.
- **Muted Slate**: Table headers, placeholders, disabled labels, and quiet chrome.

### Named Rules
**The Green Means Action Rule.** Pitchline Green is reserved for actions, active state, success, and live competitive meaning. Never spray it across inactive decoration.

**The No Generic Dashboard Rule.** Do not reduce the palette to interchangeable dark cards and blue charts. Every highlight must explain a tournament, rivalry, form, or match state.

## 3. Typography

**Display Font:** Chakra Petch with system sans fallbacks  
**Body Font:** Chakra Petch with system sans fallbacks  
**Label/Mono Font:** Chakra Petch; no separate mono is currently used

**Character:** The single-family system reads technical and competitive, closer to a broadcast graphics package than a corporate dashboard. Weight, case, and letter spacing create hierarchy; avoid introducing decorative display faces.

### Hierarchy
- **Display** (700, large route titles, tight line-height): Use for page names, major player/tournament identity, and empty-state headlines.
- **Headline** (700, compact, slightly tight tracking): Use for section headings and primary dashboard modules.
- **Title** (600, compact): Use for cards, dialogs, stat modules, and form group labels.
- **Body** (400, 1rem, 1.6 line-height): Use for explanations, empty-state guidance, and AI-generated narrative. Cap long prose at 65-75ch.
- **Label** (700-900, small, sometimes uppercase): Use for table headers, nav group labels, chips, and dense stat labels.

### Named Rules
**The One Family Rule.** Chakra Petch owns the interface. Do not add a second decorative font unless a future redesign deliberately replaces the whole type system.

**The Data First Rule.** Dense labels can be small, but scores, ranks, standings, and form indicators must remain optically louder than surrounding chrome.

## 4. Elevation

Depth comes from tonal layering, spacing, restrained borders, and selective shadow. At rest, panels use solid slate surfaces. Hover and active states may add shadow or green glow only when the user can act on the surface.

### Shadow Vocabulary
- **Panel Ambient** (`0 4px 24px rgba(0, 0, 0, 0.3)`): Default card and paper separation on the dark background.
- **Panel Lift** (`0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)`): Hover or selected-card lift.
- **Control Glow** (`0 4px 14px rgba(34, 197, 94, 0.25)`): Primary button resting emphasis.
- **Dialog Stage** (`0 24px 64px rgba(0, 0, 0, 0.5)`): Modal and high-priority overlay depth.

### Named Rules
**The State Earns Glow Rule.** Glow belongs to active, hover, focus, selected, success, or primary action states. Static ornament glow is prohibited.

## 5. Components

### Buttons
- **Shape:** Confident rounded rectangle (12px).
- **Primary:** Solid Pitchline Green with Stadium Black text for strong contrast, medium density padding (10px 24px), and 600 weight.
- **Hover / Focus:** Brighten the green, lift by 1px, and show a controlled glow or focus ring.
- **Secondary / Ghost / Tertiary:** Transparent or slate-tinted with ice text; hover may introduce a faint green wash but must not compete with primary action.

### Chips
- **Style:** Semi-transparent slate fill, faint steel border, 600 weight, compact label scale.
- **State:** Selected chips use green text, green border, and a restrained green background. Unselected chips stay neutral.

### Cards / Containers
- **Corner Style:** Rounded but not pill-like (16px for cards, 20px for dialogs).
- **Background:** Solid Panel Slate over Stadium Black.
- **Shadow Strategy:** Prefer tonal separation at rest and Panel Lift only for hover or selected surfaces.
- **Border:** Thin low-contrast steel border; active surfaces may shift to green.
- **Internal Padding:** 16-24px for most cards, tighter for table rows and compact stat modules.

### Inputs / Fields
- **Style:** Dark slate field with 12px radius, ice text, and faint steel outline.
- **Focus:** Green outline with a soft green focus halo.
- **Error / Disabled:** Error state uses Result Red plus text or helper copy. Disabled state lowers opacity and should not rely on color alone.

### Navigation
- **Style:** Desktop uses a fixed dark slate sidebar with grouped navigation, icon+text items, and active green selection. Mobile uses bottom navigation with compact labels and icon-forward destinations.
- **Typography:** Nav section labels are small, uppercase, and high-weight; item labels stay title case and readable.
- **Active State:** Green text or icon, faint green background, and clear border/indicator. Avoid hidden active states that depend only on a subtle color shift.

### Signature Component
Analytics modules should pair dense numbers with narrative context. Radar charts, fun facts, rivalry cards, leaderboards, and AI reports should feel like match analysis, not generic chart widgets.

## 6. Do's and Don'ts

### Do:
- **Do** preserve the competitive control-room atmosphere: Stadium Black, Panel Slate, Pitchline Green, and Chakra Petch are the core identity.
- **Do** use green to clarify actions, active state, success, rankings, and live competitive meaning.
- **Do** make standings, scores, records, and form indicators louder than decorative chrome.
- **Do** pair color-coded status with labels, icons, order, or copy so the meaning survives color-blindness and low contrast.
- **Do** respect reduced motion; glow and reveal effects must have non-disruptive alternatives.

### Don't:
- **Don't** let the app feel generic.
- **Don't** use anonymous SaaS dashboard patterns, bland chart panels, or interchangeable card grids.
- **Don't** use decorative esports styling that does not help users understand tournaments, rivalries, form, or match state.
- **Don't** add gradient text or colored side-stripe borders.
- **Don't** use static glassmorphism as filler. Glass is allowed only when it improves hierarchy, separation, or active context.

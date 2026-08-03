---
target: suggest ui/ux improvements
total_score: 20
p0_count: 0
p1_count: 2
timestamp: 2026-08-03T08-19-38Z
slug: src-app-page-tsx
---
# FC Tournament Tracker UI/UX Critique

Target: `src/app/page.tsx`, with representative review of the shared shell and `/players`, `/analytics/global`, and `/competitive`.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | Loading, configuration failure, and genuine zero-data states are presented interchangeably; no freshness or local retry signal. |
| 2 | Match System / Real World | 3/4 | Strong FC language, but “Queue,” “PR,” and the distinction between Analytics, Leagues, and Competitive need interpretation. |
| 3 | User Control and Freedom | 2/4 | Navigation and Escape-to-close search exist, but Spotlight lacks a visible pause and data failures lack a recovery action. |
| 4 | Consistency and Standards | 2/4 | The visual system is cohesive, but desktop/mobile information architecture diverges and `/analytics/league` can activate two sidebar destinations. |
| 5 | Error Prevention | 2/4 | State-aware primary actions help, but “Enter first result” routes back to tournament creation and failure can masquerade as zero data. |
| 6 | Recognition Rather Than Recall | 3/4 | Icons are labeled and shortcuts are visible; overlapping destinations and unexplained abbreviations still create memory work. |
| 7 | Flexibility and Efficiency | 2/4 | Desktop search and direct links help, but there is no mobile search, keyboard result navigation, recent items, or true power-user command path. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Strong palette and opening hierarchy, but too many equal-weight panels, metric cards, gradients, glows, and duplicated actions dilute focus. |
| 9 | Error Recovery | 1/4 | Error messages identify failure but offer no Retry, Setup, or preserved-last-data recovery, and the toast obstructs mobile content. |
| 10 | Help and Documentation | 1/4 | First-run copy gives limited guidance, but concepts such as ratings, PR, MOTM, lenses, and tournament administration lack contextual help. |
| **Total** |  | **20/40** | **Acceptable — significant improvement needed** |

## Anti-Patterns Verdict

**LLM assessment:** The product is polished and recognizably FC-themed, but the dashboard composition still looks generated rather than authored: a gradient command hero, five same-shaped metric cards, nested rounded panels, broad ambient shadows, icon glows, decorative grid lines, and a six-tile shortcut grid. The visual identity is strongest when it communicates a fixture, rank, rivalry, form, or champion; it weakens when it becomes generic esports atmosphere. “Kick Off Vibes” is the clearest example of decoration without task value. The 1px border plus 24px-blur shadow in `panelSx` also matches the ghost-card pattern.

**Deterministic scan:** The required scan of `src/app/page.tsx` and `src/components/layout/AppShell.tsx`, plus a supplementary scan of the Players, Global Analytics, and Competitive pages, returned **0 findings**. This means the detector found no encoded banned pattern in the markup it understands. It does not clear all design concerns: MUI `sx` objects such as the broad panel shadow at `src/app/page.tsx:88` and shell blur/shadow at `src/components/layout/AppShell.tsx:201` were not detected.

**Visual overlays:** No reliable user-visible overlay is available. The in-app browser rejected mutable script injection under its URL security policy, so the overlay server was correctly not started. Browser screenshots, DOM inspection, viewport measurements, source review, and the CLI scan were used as fallback evidence.

## Overall Impression

The opening promise is good: the dashboard derives one primary action from current tournament state and feels energetic without losing basic readability. The single biggest opportunity is to make the product behave like a match-night instrument rather than a themed dashboard. Before a tournament exists, the entire homepage should become one focused kickoff flow. Once play starts, the next fixture and result-entry state should dominate, with history and storytelling revealed only when they contain meaningful data.

## What’s Working

- **The next action is state-aware.** “Create Tournament,” “Open Active Tournament,” and “Enter Next Result” map well to how an organizer thinks under time pressure.
- **The responsive foundation is considered.** Desktop navigation becomes labeled bottom navigation; touch targets are generally generous; focus-visible styling and reduced-motion support are present; no horizontal overflow was found at 1440×1000 or 390×844.
- **The strongest modules are personal.** Hall of Fame, Player Spotlight, rivalry analysis, form, and Recent Activity have the potential to make the group’s history memorable instead of presenting anonymous analytics.

## Priority Issues

### 1. [P1] First-run repeats one decision across an entire dashboard

**Why it matters:** A new organizer sees Create Tournament, Register Players, Skip to Create, three setup actions, five metrics, tournament and analytics empty states, and shortcut tiles. On mobile the homepage is about 3042px tall with 23 visible actions. The interface asks users to interpret the whole product before they have created anything.

**Fix:** Replace the empty dashboard with a compact kickoff flow: (1) roster readiness, (2) tournament format, (3) create and start. Use one primary action and at most one secondary action. Do not render Hall of Fame, Spotlight, Next Up, Recent Activity, or summary metrics until they can show real value. After activation, replace the kickoff flow with a persistent live-fixture strip.

**Suggested command:** `$impeccable onboard homepage first-run`

### 2. [P1] Loading, configuration failure, zero, stale, and empty are conflated

**Why it matters:** Dashes, zero values, “loading” labels, empty-state copy, and error toasts appear together. A match-night organizer cannot tell whether there are no records, data is still loading, or the system failed. That undermines trust in standings and result entry.

**Fix:** Model each dataset explicitly as loading, loaded-empty, loaded, stale, or error. Use skeletons for initial loads, preserve the last trustworthy result when refresh fails, place retry actions beside the affected module, and never turn a failure into `0` or “No champions yet.” Add a small “Updated just now” or “Offline — showing last saved data” signal near the active tournament.

**Suggested command:** `$impeccable harden dashboard data states`

### 3. [P2] Equal-weight cards dilute competitive hierarchy

**Why it matters:** Five repeated stat cards, nested mini-panels, ambient glows, broad shadows, background grid decoration, and six shortcut tiles make the screen scan like a generic dashboard. The next fixture stops feeling uniquely important after the hero.

**Fix:** Recompose around FC-specific structures rather than card templates: a live fixture/result strip, a compact standings ladder, a form row, and one rotating narrative module. Reduce the visible summary to three meaningful signals. Remove static glows, the decorative “Kick Off Vibes” area, and hover treatment from non-interactive cards. Reserve glow for focus, live, selected, or successful state.

**Suggested command:** `$impeccable distill homepage dashboard`

### 4. [P2] Navigation changes meaning between desktop and mobile

**Why it matters:** Desktop separates Rivalry, Analytics, Leagues, AI Analyst, and Competitive, while mobile uses Analytics, AI, and Compete. The Analytics and Leagues active-state checks overlap, search disappears below the desktop breakpoint, and route naming does not establish one stable mental map.

**Fix:** Give every route one parent and one active owner. Use a simpler stable model such as Home, Tournaments, Players, Insights, and More; put Rivalries, Leagues, AI, and Competitive within Insights or More. Keep a search/command entry point on mobile. Remove redundant group headings such as Dashboard/Dashboard and Players/Players.

**Suggested command:** `$impeccable shape app navigation`

### 5. [P2] Semantic accessibility trails visual polish

**Why it matters:** Live DOM inspection found only one true heading; visual section titles are paragraphs. The desktop sidebar is not a navigation landmark, Spotlight bars have no meter/progress semantics, and the automatic five-second Spotlight rotation lacks an explicit pause or announcement. Screen-reader and keyboard users receive less structure than sighted users.

**Fix:** Make section titles real H2/H3 elements, render desktop destinations within `nav`, give bars accessible names and values, and disable auto-rotation by default or provide a visible pause control. Increase the smallest 0.65–0.68rem labels and ensure status is never communicated by color alone.

**Suggested command:** `$impeccable audit semantic accessibility`

## Persona Red Flags

**Alex — impatient power user:** The primary result-entry action is strong, but six shortcut tiles duplicate navigation instead of accelerating work. Search has no arrow-key result navigation, Enter silently selects the first result, there are no keyboard accelerators or recent destinations, and mobile removes search entirely.

**Jordan — first-time tournament organizer:** The first screen offers Create Tournament, Register Players, Skip to Create, Create, and Next as competing paths. “Enter first result” routes to tournament creation, while “Queue,” “PR,” “MOTM,” “Lens,” and the separation between Analytics and Competitive are unexplained.

**Sam — accessibility-dependent user:** Section structure is largely invisible to heading navigation, desktop navigation lacks a `nav` landmark, visual bars lack semantic values, Spotlight changes automatically without explicit control, and several data labels are unusually small. The error toast also covers meaningful content on a 390×844 viewport.

## Minor Observations

- Chakra Petch is loaded only through weight 700 while the UI requests 850–950, so browsers synthesize the heaviest weights.
- Every `GlassCard` inherits hover styling, including static information panels, creating false click affordances.
- `/analytics/global` and `/competitive` leave large blank regions in empty/error states instead of teaching the user how to unlock those views.
- “Season Race & Legacy Board” wraps to three lines on mobile and consumes much of the first fold.
- The configuration error is specific on most routes, but Competitive falls back to the less actionable “Request failed with status 500.”
- The detector found no horizontal overflow and no product-owned touch target below 44px in the inspected states.

## Questions to Consider

- If no tournament exists, should the homepage be a dashboard at all, or should it transform completely into a focused kickoff flow?
- During live play, which trust signal matters most beside the next fixture: last successful sync, saved-result confirmation, or offline state?
- Should the app’s durable top-level model center on **Home / Tournaments / Players / Insights**, with rivalry, leagues, AI, and competitive views nested beneath Insights?
- What should end the dashboard: a shortcut grid, or the most memorable rivalry, champion, or unresolved fixture?

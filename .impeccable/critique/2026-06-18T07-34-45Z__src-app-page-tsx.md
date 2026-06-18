---
target: src/app/page.tsx
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-06-18T07-34-45Z
slug: src-app-page-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading skeletons and live stats help, but dashboard modules do not clearly distinguish "loading", "empty", and "ready" across all panels. |
| 2 | Match System / Real World | 3 | Strong FC/tournament language, but some labels are generic dashboard nouns instead of match-night tasks. |
| 3 | User Control and Freedom | 2 | Search appears available but has no visible behavior; auto-rotating spotlight lacks pause/stop control. |
| 4 | Consistency and Standards | 2 | Detector found palette/radius drift; repeated small buttons and cards vary accents without a clear token system. |
| 5 | Error Prevention | 2 | Primary creation path exists, but the dashboard does not strongly guide first setup versus returning-user workflows. |
| 6 | Recognition Rather Than Recall | 3 | Navigation and tournament cards are recognizable; dense analytics modules still require users to infer what matters first. |
| 7 | Flexibility and Efficiency | 2 | Many shortcuts exist, but no working global search/command pattern and no power-user affordances are visible. |
| 8 | Aesthetic and Minimalist Design | 2 | The atmosphere is strong, but nearly every surface uses glass, glow, borders, and compact stats, raising the noise floor. |
| 9 | Error Recovery | 2 | Empty states are present, but recovery/help copy is thin for missing analytics, no fixtures, or no tournaments. |
| 10 | Help and Documentation | 2 | The UI explains some empty states, but it does not teach the tournament workflow enough for a first-time organizer. |
| **Total** | | **23/40** | **Moderate: good product foundation, needs hierarchy and trust polish** |

#### Anti-Patterns Verdict

**Does it look AI-generated?** Not immediately. The FC-specific data model, tournament language, player imagery, and match-night control-room identity keep it from feeling generic. But it does have recognizable AI/product-dashboard tells: many glass panels with similar weight, lots of glow/border/gradient styling, dense repeated modules, and a few decorative color choices that are not yet systematized.

**LLM assessment**: The dashboard has personality, but it overuses the same visual recipe. Stat card, Hall of Fame, Top Scorers, Top Performers, Tournaments, Next Up, Spotlight, Recent Activity, and quick actions all compete in the same dark-card register. The result is energetic but not decisive: users get a cockpit, but not a flight path.

**Deterministic scan**: The bundled detector found **26 advisory findings** in `src/app/page.tsx`: **25 `design-system-color` findings** and **1 `design-system-radius` finding**. The important signal is not that every color is wrong; many are legitimate tints used by the existing app. The signal is that the dashboard contains more one-off accents than the documented system currently admits: `#93C5FD`, `#86EFAC`, `#FBBF24`, `#A78BFA`, `#2DD4BF`, `#BF5AF2`, several rgba blue/purple/teal values, and a `14px` panel radius.

**Visual overlays**: No reliable user-visible overlay is available in this run. Local Playwright packages were not installed, and no mutable in-app browser tool was exposed, so browser injection was skipped. Fallback signal used: source review plus deterministic CLI detector.

#### Overall Impression

The app already has a real voice: FC tournament night, competitive stats, player mythology, and dark broadcast energy. The biggest opportunity is to make the dashboard less like a wall of cool modules and more like a match-night command surface with one clear next action, one clear current story, and supporting stats that know their place.

#### What's Working

1. **The product has a specific world.** Chakra Petch, dark slate, green state color, player avatars, "Next Up", "Hall of Fame", and "Player Spotlight" all point to a real social-competitive use case.
2. **The empty and loading states are not absent.** `Skeleton`, `EmptyState`, and contextual empty copy give the product some resilience when data is missing.
3. **Mobile and desktop navigation are intentionally different.** Desktop gets a fixed sidebar; mobile gets bottom navigation. That is the right structural pattern for a frequently used app.

#### Priority Issues

**[P1] The dashboard has no dominant task**

**Why it matters**: A returning organizer probably wants to enter a result, open the active tournament, or create a tournament. A player probably wants standings, next fixture, or their profile. The current first viewport begins with five equal stat cards and then many same-weight panels. It reports a lot, but it does not decide what the user should do next.

**Fix**: Promote a single "match-night command" module above the stat strip: active tournament, next fixture, primary CTA, and one secondary path. Move the five all-time stats below or compress them into a supporting row. Use the current `featuredTournament` and `nextMatch` logic as the source of truth.

**Suggested command**: `$impeccable layout src/app/page.tsx`

**[P1] The visible search field appears nonfunctional**

**Why it matters**: The desktop header promises "Search players, tournaments..." but `InputBase` has no value, no handler, no results, and no submit behavior in `AppShell`. That breaks trust quickly because search is a high-confidence affordance. Users will try it before digging through navigation.

**Fix**: Either implement real global search, connect it to a command/search overlay, or remove/replace it with a clear quick action until search exists. If implemented, include keyboard access and useful empty/no-results states.

**Suggested command**: `$impeccable harden src/components/layout/AppShell.tsx`

**[P1] The visual system is drifting through one-off accent colors**

**Why it matters**: The app's anti-reference is "do not feel generic." One-off blues, purples, teals, ambers, greens, and rgba tints can make a product feel skinned rather than authored. The detector's 26 advisory findings show the new `DESIGN.md` and the actual dashboard are not yet aligned.

**Fix**: Either expand `DESIGN.md` to include the real semantic ramps already in use, or refactor `src/app/page.tsx` to use fewer named accents. Recommended direction: keep green as action/status, blue as analytics/AI, amber as trophies/fixtures, red as negative/result, and remove stray purple/teal unless they carry a named role.

**Suggested command**: `$impeccable colorize src/app/page.tsx`

**[P2] The dashboard's card recipe is overused**

**Why it matters**: Glass panel + thin border + glow + compact heading appears almost everywhere. The page feels cohesive, but too many modules share the same weight and container language. This increases scanning effort and makes the app feel closer to a template.

**Fix**: Vary structure, not decoration. Convert some cards into rows, strips, or inline sections. Reserve the heaviest glass treatment for high-priority modules like active tournament, next fixture, and spotlight. Let secondary lists be flatter and quieter.

**Suggested command**: `$impeccable quieter src/app/page.tsx`

**[P2] Motion is energetic but not fully user-controlled**

**Why it matters**: The spotlight auto-rotates every five seconds. Global reduced-motion CSS dampens CSS animations, but it does not stop this JavaScript-driven content change. Motion-sensitive users and users reading stats may lose their place.

**Fix**: Disable spotlight auto-rotation when `prefers-reduced-motion: reduce` is active, pause rotation on hover/focus, and make manual controls the primary interaction. Consider adding a visible pause affordance if rotation remains.

**Suggested command**: `$impeccable adapt src/app/page.tsx`

#### Persona Red Flags

**First-Time Organizer**: Lands on the dashboard and sees all-time stats, Hall of Fame, Top Scorers, Player Spotlight, Recent Activity, and a small "New" button. The first tournament creation path exists but is visually secondary. If there are no tournaments, the empty state helps, but once any data exists the "what do I do next?" path gets diluted.

**Returning Match Recorder**: Wants to enter or review the next fixture quickly. "Next Up" is useful, but it lives in the right column after several modules and only routes to the tournament, not directly to the match entry moment. The user has to infer where result entry happens.

**Power User / League Admin**: Sees search and expects it to work. There is no command palette, no keyboard-visible shortcut, and no functional search behavior. The navigation is broad enough that a real search affordance would be valuable; a fake one is actively harmful.

#### Minor Observations

- The desktop sidebar includes a decorative "Kick Off Vibes" panel with a repeating stripe graphic; it may be cute, but it competes with real navigation and uses a pattern the Impeccable rules explicitly dislike.
- Mobile bottom navigation has seven items. That is usable, but above the recommended cognitive-load limit; "Analytics", "Leagues", and "Rivalry" may need grouping over time.
- `Your Tournaments` has a strong empty state; `Recent Activity`, `Next Up`, and `Player Spotlight` have thinner empty-state teaching.
- `Dashboard` appears as both current route and a quick action tile inside the dashboard, which feels redundant.
- Some low-contrast secondary text values may be close to the threshold on translucent backgrounds; worth auditing with rendered contrast once browser tooling is available.

#### Questions to Consider

- What is the single most common action on match night: create/setup, enter result, check next fixture, or check standings?
- Should `Next Up` become the hero of the dashboard when an active tournament exists?
- Is the sidebar music/vibes panel earning its space, or should that slot reinforce the active tournament?
- Would the product feel more owned if analytics modules used fewer colors but stronger FC-specific labels?

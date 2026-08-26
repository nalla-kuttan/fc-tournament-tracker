# Expanded Records and Advanced Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the full captured-data-only record book to Competitive → Records and a compact filter-aware preview to Global Analytics.

**Architecture:** Build a pure TypeScript records engine that converts matches into registered-player perspective rows, then delegates runs, campaign, performance, rivalry, and team calculations to focused modules. Preserve the existing `CompetitiveRecords` API and add a nested `expanded` response consumed by focused UI components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Material UI 7, SWR, Vitest 4, Supabase read APIs.

**Spec:** `docs/superpowers/specs/2026-08-26-expanded-records-design.md`

## Global Constraints

- Use only played, non-bye matches with both competitors resolved.
- Roll tournament player instances up to registered-player identity.
- Do not add schema migrations, dependencies, goal-time inference, assists, xA, or comeback records.
- Exclude missing optional stats from metric denominators instead of treating them as zero.
- Preserve every existing API field and existing rating/record behavior.
- Use deterministic ordering: `played_at`, then `match_number`, then `match.id`.
- Leave all unrelated untracked duplicate files untouched and unstaged.
- Every production calculation must be preceded by a failing behavior test.

---

### Task 1: Record types, context, and run records

**Files:**
- Create: `src/lib/records/types.ts`
- Create: `src/lib/records/context.ts`
- Create: `src/lib/records/runs.ts`
- Create: `src/lib/records/__tests__/runs.test.ts`

**Interfaces:**
- Consumes: `Match`, `MatchStats`, `Player`, `RegisteredPlayer`, and `Tournament` from `src/lib/types.ts`.
- Produces: `RecordsScope`, `RecordContext`, `PlayerMatchRow`, `RecordEntry`, `RunsRecords`, `buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, scope)`, and `calculateRunRecords(context)`.

- [ ] **Step 1: Write the failing run-record tests**

Create deterministic fixtures with two tournament instances for the same registered player. Assert rollup, `played_at`/`match_number` ordering, longest unbeaten/scoring/MOTM streaks, bounce-back qualification, dominance rate, three-plus/four-plus counts, and best match output.

```ts
const records = calculateRunRecords(buildRecordContext(players, instances, tournaments, matches, { scope: 'all-time' }));
expect(records.longestUnbeaten[0]).toMatchObject({ playerName: 'Alex', value: 4 });
expect(records.longestScoring[0]).toMatchObject({ playerName: 'Alex', value: 5 });
expect(records.longestMotm[0]).toMatchObject({ playerName: 'Alex', value: 2 });
expect(records.bounceBack[0]).toMatchObject({ playerName: 'Alex', value: 75 });
expect(records.dominanceRate[0]).toMatchObject({ playerName: 'Alex', value: 60 });
expect(records.threePlusGoals[0]).toMatchObject({ playerName: 'Alex', value: 3 });
expect(records.fourPlusGoals[0]).toMatchObject({ playerName: 'Alex', value: 2 });
expect(records.bestMatchOutput[0]).toMatchObject({ playerName: 'Alex', value: 6 });
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/records/__tests__/runs.test.ts`

Expected: FAIL because `buildRecordContext` and `calculateRunRecords` do not exist.

- [ ] **Step 3: Implement the shared types and context**

Define a side-specific row that retains match identity, registered-player identity, opponent, selected team, scoreline, result, stats, tournament, and pre-match ordering fields.

```ts
export interface PlayerMatchRow {
  match: Match;
  registeredPlayerId: string;
  playerName: string;
  baseTeam: string;
  instanceId: string;
  opponentRegisteredPlayerId: string;
  opponentName: string;
  selectedTeam: string;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
  side: 'home' | 'away';
  stats: MatchStats;
}
```

`buildRecordContext` filters scope before creating rows and sorts each player's rows deterministically.

- [ ] **Step 4: Implement run calculations**

Use one pass per player's ordered rows. Bounce-back value is `round(winsAfterLoss / postLossOpportunities × 100, 1)`. Dominance value is `round(winsByThreePlus / wins × 100, 1)` and requires 10 matches plus five wins.

- [ ] **Step 5: Run the focused and existing tests**

Run: `npm test -- src/lib/records/__tests__/runs.test.ts src/lib/__tests__/competitive.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the task**

```bash
git add src/lib/records/types.ts src/lib/records/context.ts src/lib/records/runs.ts src/lib/records/__tests__/runs.test.ts
git commit -m "Add run and scoring records"
```

### Task 2: Campaign records

**Files:**
- Create: `src/lib/records/campaigns.ts`
- Create: `src/lib/records/__tests__/campaigns.test.ts`

**Interfaces:**
- Consumes: `RecordContext` from Task 1.
- Produces: `calculateCampaignRecords(context): CampaignRecords`.

- [ ] **Step 1: Write failing campaign tests**

Cover a completed six-match perfect league campaign, a completed unbeaten campaign containing a draw, an active campaign that must not qualify, goal-difference ranking, and league-only title margin.

```ts
const records = calculateCampaignRecords(context);
expect(records.perfectCampaigns[0]).toMatchObject({ playerName: 'Ruban', value: 6 });
expect(records.unbeatenCampaigns).toEqual(expect.arrayContaining([
  expect.objectContaining({ playerName: 'Basil', detail: expect.stringContaining('3-1-0') }),
]));
expect(records.bestGoalDifference[0]).toMatchObject({ playerName: 'Ruban', value: 23 });
expect(records.largestTitleMargins[0]).toMatchObject({ playerName: 'Ruban', value: 6 });
expect(records.perfectCampaigns.some((row) => row.detail.includes('Active Season'))).toBe(false);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/records/__tests__/campaigns.test.ts`

Expected: FAIL because `calculateCampaignRecords` does not exist.

- [ ] **Step 3: Implement campaign aggregation**

Group perspective rows by tournament and registered player. Require `tournament.status === 'completed'` and at least three rows. Compute standings points as 3/1/0; compute title margin only for `format === 'league'` and compare the champion with the second-place row after points, goal difference, and goals-for sorting.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/lib/records/__tests__/campaigns.test.ts src/lib/records/__tests__/runs.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the task**

```bash
git add src/lib/records/campaigns.ts src/lib/records/__tests__/campaigns.test.ts
git commit -m "Add campaign dominance records"
```

### Task 3: Competitive rating timeline

**Files:**
- Create: `src/lib/competitive-ratings.ts`
- Modify: `src/lib/competitive.ts`
- Modify: `src/lib/__tests__/competitive.test.ts`

**Interfaces:**
- Consumes: registered players, player instances, matches, and existing `ScopeOptions` semantics.
- Produces: `calculateCompetitiveRatings(players, playerInstances, matches, options)` with unchanged output and `buildCompetitiveRatingTimeline(players, playerInstances, matches, options)` returning pre-match ratings keyed by match and registered-player ID.

- [ ] **Step 1: Add failing rating timeline tests**

Assert that the first match sees 1000/1000, the second match sees ratings updated only from the first match, and the public rankings remain equal to their existing snapshots.

```ts
const timeline = buildCompetitiveRatingTimeline(players, playerInstances, matches, { scope: 'all-time' });
expect(timeline.get('m1')?.homeRating).toBe(1000);
expect(timeline.get('m1')?.awayRating).toBe(1000);
expect(timeline.get('m2')?.homeRating).not.toBe(1000);
expect(calculateCompetitiveRatings(players, playerInstances, matches, scope)[0].rating).toBe(1059);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/__tests__/competitive.test.ts`

Expected: FAIL because `buildCompetitiveRatingTimeline` does not exist.

- [ ] **Step 3: Extract the rating sequence**

Move the existing Elo update loop into `src/lib/competitive-ratings.ts`. Record each match's home and away registered-player IDs and ratings before applying the match update. Re-export the unchanged public rating type and calculation through `src/lib/competitive.ts`.

- [ ] **Step 4: Run competitive tests**

Run: `npm test -- src/lib/__tests__/competitive.test.ts`

Expected: PASS with unchanged existing ratings and new timeline assertions.

- [ ] **Step 5: Commit the task**

```bash
git add src/lib/competitive-ratings.ts src/lib/competitive.ts src/lib/__tests__/competitive.test.ts
git commit -m "Expose pre-match competitive ratings"
```

### Task 4: Advanced performance records

**Files:**
- Create: `src/lib/records/performance.ts`
- Create: `src/lib/records/__tests__/performance.test.ts`

**Interfaces:**
- Consumes: `RecordContext` and `buildCompetitiveRatingTimeline(players, playerInstances, matches, options)`.
- Produces: `calculatePerformanceRecordsFromContext(context): PerformanceRecords`, `calculateExpectedPoints(ownXg, opponentXg): number`, and public `calculatePerformanceRecords(registeredPlayers, playerInstances, matches)` through Task 6's index.
- Covers: Finishing Efficiency, xG Overperformance, Defensive xG Overperformance, Counterpunch Win Rate, MOTM Rate, Defensive Work Rate, Rating Consistency, Expected-Points Efficiency, and Pressure Performance.

- [ ] **Step 1: Write failing metric tests**

Cover finishing efficiency, total/per-match xG surplus, defensive xG surplus, sub-50% possession wins, MOTM denominator behavior, tackles plus interceptions, rating standard deviation, Poisson expected points, missing-field exclusion, and qualification thresholds.

```ts
expect(calculateExpectedPoints(1.5, 1.5)).toBeCloseTo(1.33, 1);
expect(calculateExpectedPoints(2.5, 0.5)).toBeGreaterThan(2);
const records = calculatePerformanceRecordsFromContext(context);
expect(records.finishingEfficiency[0]).toMatchObject({ playerName: 'Alex', value: 120 });
expect(records.xgOverperformance[0]).toMatchObject({ playerName: 'Alex', value: 4 });
expect(records.counterpunchRate[0]).toMatchObject({ playerName: 'Alex', value: 60 });
expect(records.motmRate[0].detail).toContain('recorded MOTM matches');
expect(records.ratingConsistency[0].value).toBeLessThan(0.5);
```

- [ ] **Step 2: Write failing pressure tests**

Construct matches where a player begins below the opponent's pre-match Elo, wins, and becomes higher-rated later. Assert only the earlier match is a pressure opportunity.

```ts
expect(records.pressurePerformance[0]).toMatchObject({
  playerName: 'Basil',
  value: 66.7,
  detail: expect.stringContaining('higher-rated opponents'),
});
```

- [ ] **Step 3: Run the tests and verify RED**

Run: `npm test -- src/lib/records/__tests__/performance.test.ts`

Expected: FAIL because the performance module does not exist.

- [ ] **Step 4: Implement Poisson expected points**

Compute `P(k) = exp(-lambda) × lambda^k / k!` for scores 0 through 12. Sum win/draw/loss probability, normalize by covered mass, and return `3 × P(win) + P(draw)`.

- [ ] **Step 5: Implement performance aggregation**

Track separate eligible counts for xG, possession, MOTM, defensive actions, and ratings. Apply the exact qualification thresholds from the spec. Calculate population variance as `sum((rating - mean)^2) / count`.

- [ ] **Step 6: Implement pressure aggregation**

Use only the timeline's pre-match ratings. A row qualifies when its rating is strictly below the opponent's. Value is `round(actualPoints / (opportunities × 3) × 100, 1)` with at least five opportunities.

- [ ] **Step 7: Run focused tests**

Run: `npm test -- src/lib/records/__tests__/performance.test.ts src/lib/__tests__/competitive.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit the task**

```bash
git add src/lib/records/performance.ts src/lib/records/__tests__/performance.test.ts
git commit -m "Add advanced performance records"
```

### Task 5: Rivalry and team records

**Files:**
- Create: `src/lib/records/rivalries.ts`
- Create: `src/lib/records/teams.ts`
- Create: `src/lib/records/__tests__/rivalries-teams.test.ts`

**Interfaces:**
- Consumes: `RecordContext`.
- Produces: `calculateRivalryRecords(context): RivalryRecords` and `calculateTeamRecords(context): TeamRecords`.
- Covers: Most-Played Rivalry, Rivalry Dominance, Rivalry Reversals, Nemesis Index, Closest Rivalry, Club Specialist, Best Player/Team Combination, and Most Versatile Winner.

- [ ] **Step 1: Write failing rivalry tests**

Build at least five chronological meetings per pair. Assert meeting count, dominant player and W-D-L detail, a win reversing the immediately previous H2H loss, nemesis share, and lowest average absolute margin.

```ts
expect(records.mostPlayed[0]).toMatchObject({ playerName: 'Alex vs Ruban', value: 6 });
expect(records.dominance[0].detail).toContain('4-1-1');
expect(records.reversals[0]).toMatchObject({ playerName: 'Ruban', value: 2 });
expect(records.nemeses[0].detail).toContain('career losses');
expect(records.closest[0]).toMatchObject({ value: 1 });
```

- [ ] **Step 2: Write failing team tests**

Create qualified eight-match player/team combinations and unqualified short samples. Assert each player's best club, global combination ordering by win rate/sample/goal difference, and distinct winning-team count.

```ts
expect(teamRecords.clubSpecialists[0]).toMatchObject({ playerName: 'Ruban', value: 75 });
expect(teamRecords.bestCombinations[0].detail).toContain('8 matches');
expect(teamRecords.mostVersatile[0]).toMatchObject({ playerName: 'Alex', value: 4 });
expect(teamRecords.bestCombinations.some((row) => row.detail.includes('2 matches'))).toBe(false);
```

- [ ] **Step 3: Run the tests and verify RED**

Run: `npm test -- src/lib/records/__tests__/rivalries-teams.test.ts`

Expected: FAIL because the rivalry and team modules do not exist.

- [ ] **Step 4: Implement rivalry aggregation**

Use sorted registered-player IDs as pair keys. Keep meetings chronological for reversal detection. For nemesis rows, divide losses to the qualifying opponent by all of that player's career losses.

- [ ] **Step 5: Implement team aggregation**

Group perspective rows by registered player plus selected team. Require eight matches for rate boards; count every distinct team with at least one win for versatility.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/lib/records/__tests__/rivalries-teams.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the task**

```bash
git add src/lib/records/rivalries.ts src/lib/records/teams.ts src/lib/records/__tests__/rivalries-teams.test.ts
git commit -m "Add rivalry and team records"
```

### Task 6: Records orchestration and API compatibility

**Files:**
- Create: `src/lib/records/index.ts`
- Modify: `src/lib/competitive.ts`
- Modify: `src/lib/__tests__/competitive.test.ts`

**Interfaces:**
- Consumes: all category calculators from Tasks 1–5.
- Produces: `calculateExpandedRecords(registeredPlayers, playerInstances, tournaments, matches, scope)`, `calculatePerformanceRecords(registeredPlayers, playerInstances, matches)`, and `CompetitiveRecords.expanded`.

- [ ] **Step 1: Add failing orchestration assertions**

Extend the competitive fixture test to assert existing fields remain and every expanded group is present.

```ts
expect(records.biggestWins).toHaveLength(1);
expect(records.expanded).toEqual(expect.objectContaining({
  runs: expect.any(Object),
  campaigns: expect.any(Object),
  performance: expect.any(Object),
  rivalries: expect.any(Object),
  teams: expect.any(Object),
}));
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/__tests__/competitive.test.ts`

Expected: FAIL because `expanded` is absent.

- [ ] **Step 3: Implement the orchestrator**

Build context once, invoke each category calculator, and return nested groups. `calculatePerformanceRecords(registeredPlayers, playerInstances, matches)` builds a context with an all-time scope and an empty tournament list because it does not consume campaign metadata.

- [ ] **Step 4: Attach expanded records without changing route contracts**

Update `CompetitiveRecords` and `calculateCompetitiveRecords` so both existing endpoints automatically include `records.expanded`. Do not add new requests or remove fields.

- [ ] **Step 5: Run all library tests and type checking**

Run: `npm test -- src/lib/records src/lib/__tests__/competitive.test.ts`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit the task**

```bash
git add src/lib/records/index.ts src/lib/competitive.ts src/lib/__tests__/competitive.test.ts
git commit -m "Expose expanded competitive records"
```

### Task 7: Competitive record-book UI

**Files:**
- Create: `src/components/competitive/RecordBoard.tsx`
- Create: `src/components/competitive/ExpandedRecords.tsx`
- Create: `src/components/competitive/__tests__/ExpandedRecords.test.tsx`
- Modify: `src/app/competitive/page.tsx`

**Interfaces:**
- Consumes: `ExpandedRecords`, `RecordEntry`, and pair/campaign record types from `src/lib/records/types.ts`.
- Produces: reusable accessible boards and the five grouped record sections under Competitive → Records.

- [ ] **Step 1: Write a failing server-render test for the grouped record book**

Render `ExpandedRecords` with one row in each group and assert the five section headings and representative record names are present in the rendered HTML.

```tsx
const html = renderToString(<ExpandedRecords records={expandedFixture} />);
expect(html).toContain('Runs &amp; Resilience');
expect(html).toContain('Campaign Dominance');
expect(html).toContain('Advanced Performance');
expect(html).toContain('Rivalries');
expect(html).toContain('Teams');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/components/competitive/__tests__/ExpandedRecords.test.tsx`

Expected: FAIL because `ExpandedRecords` does not exist.

- [ ] **Step 3: Extract the existing record board without behavior changes**

Move the inline `RecordBoard` into `src/components/competitive/RecordBoard.tsx`. Preserve five-row truncation, empty copy, responsive card height, rank, detail, suffix, and chip behavior.

- [ ] **Step 4: Add the expanded record sections**

Render headings and boards for Runs & Resilience, Campaign Dominance, Advanced Performance, Rivalries, and Teams. Use `Grid` sizes `{ xs: 12, md: 6, lg: 4 }`. Add `aria-label` to each leaderboard and use text labels for lower-is-better values.

```tsx
<ExpandedRecords records={selectedSeasonRecords.expanded} />
```

- [ ] **Step 5: Integrate beneath existing records**

Keep existing boards first, followed by expanded sections. Season lenses receive scoped expanded records from the existing `/api/competitive/records` request.

- [ ] **Step 6: Run the component test, lint, and type checking**

Run: `npm test -- src/components/competitive/__tests__/ExpandedRecords.test.tsx`

Run: `npm run lint`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit the task**

```bash
git add src/components/competitive/RecordBoard.tsx src/components/competitive/ExpandedRecords.tsx src/components/competitive/__tests__/ExpandedRecords.test.tsx src/app/competitive/page.tsx
git commit -m "Add expanded competitive record book"
```

### Task 8: Global highlights, timed-goal gating, and realtime refresh

**Files:**
- Create: `src/components/analytics/AdvancedHighlights.tsx`
- Modify: `src/app/analytics/global/page.tsx`
- Modify: `src/lib/analytics-realtime.ts`
- Modify: `src/lib/__tests__/analytics-realtime.test.ts`
- Create: `src/lib/__tests__/analytics-visibility.test.ts`
- Create: `src/lib/analytics-visibility.ts`

**Interfaces:**
- Consumes: `calculatePerformanceRecords(registeredPlayers, playerInstances, matches)`, filtered matches, eligible registered players, and `GoalLite[]`.
- Produces: six compact filter-aware leader cards, `hasTimedGoals(goals)`, and competitive SWR-key invalidation.

- [ ] **Step 1: Write failing visibility and realtime tests**

```ts
expect(hasTimedGoals([{ player_id: 'p1', match_id: 'm1', minute: null }])).toBe(false);
expect(hasTimedGoals([{ player_id: 'p1', match_id: 'm1', minute: 72 }])).toBe(true);
expect(isAnalyticsDataKey('/api/competitive/overview')).toBe(true);
expect(isAnalyticsDataKey('/api/competitive/records?scope=season&seasonId=s1')).toBe(true);
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/lib/__tests__/analytics-visibility.test.ts src/lib/__tests__/analytics-realtime.test.ts`

Expected: FAIL because timed-goal gating and competitive-key invalidation are absent.

- [ ] **Step 3: Implement visibility and realtime behavior**

`hasTimedGoals` returns `goals.some(goal => goal.minute != null)`. Extend `isAnalyticsDataKey` to accept keys starting with `/api/competitive/` while preserving existing analytics and tournament matches.

- [ ] **Step 4: Add Global Analytics highlights**

Memoize `calculatePerformanceRecords` after format/date filtering. Restrict each leaderboard to registered-player IDs passing search and minimum-match filters. Render finishing efficiency, xG surplus, counterpunch rate, MOTM rate, defensive work rate, and pressure performance plus a link to `/competitive`.

- [ ] **Step 5: Gate existing time-based UI**

Render Clutch Goals and Goal Distribution by Minute only when `hasTimedGoals(filteredGoals)` is true. Keep every scoreline-derived chart unchanged.

- [ ] **Step 6: Run focused tests, lint, and type checking**

Run: `npm test -- src/lib/__tests__/analytics-visibility.test.ts src/lib/__tests__/analytics-realtime.test.ts`

Run: `npm run lint`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit the task**

```bash
git add src/components/analytics/AdvancedHighlights.tsx src/app/analytics/global/page.tsx src/lib/analytics-realtime.ts src/lib/analytics-visibility.ts src/lib/__tests__/analytics-realtime.test.ts src/lib/__tests__/analytics-visibility.test.ts
git commit -m "Show advanced analytics highlights"
```

### Task 9: Full verification and documentation sync

**Files:**
- Modify: `docs/superpowers/plans/2026-08-26-expanded-records.md`
- Modify only if metric names changed during implementation: `docs/superpowers/specs/2026-08-26-expanded-records-design.md`

**Interfaces:**
- Consumes: the complete implementation.
- Produces: verified release candidate on `codex/expanded-records`.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm test`

Run with public Supabase variables absent: `env -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_ANON_KEY npm run build`

Expected: every command exits 0 and the production build prerenders successfully.

- [ ] **Step 2: Verify captured-data constraints**

Search production changes for unsupported additions:

```bash
git diff main...HEAD -- src | rg -n "assist|expected.?assist|first.?scorer|fastest.?goal|latest.?goal|comeback"
```

Expected: no newly implemented unsupported metric; existing match-intelligence copy may appear only in untouched context.

- [ ] **Step 3: Verify APIs against live read-only data**

Start the app with configured local environment values, request `/api/competitive/overview`, and confirm `records.expanded` contains every group while the pre-existing fields remain populated. Request a season-scoped records endpoint and confirm no all-time rows leak into streaks or denominators.

- [ ] **Step 4: Verify responsive UI**

At mobile and desktop widths, verify Competitive → Records group order, no horizontal overflow, readable long rivalry/team names, keyboard tab navigation, and Global Analytics filter updates. Confirm timed-goal sections are hidden for the current live dataset.

- [ ] **Step 5: Review working-tree scope**

Run: `git status --short`

Expected: only planned tracked changes and the pre-existing unrelated untracked duplicates. Do not stage `supabase/.temp/` or any filename containing ` 2`.

- [ ] **Step 6: Commit verification metadata if the plan checklist changed**

```bash
git add docs/superpowers/plans/2026-08-26-expanded-records.md docs/superpowers/specs/2026-08-26-expanded-records-design.md
git commit -m "Document expanded records verification"
```

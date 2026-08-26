# Expanded Records and Advanced Statistics Design

## Goal

Add the complete set of requested records and advanced statistics to FC Tournament Tracker using only data the application already captures. Competitive → Records becomes the canonical record book, while Global Analytics shows a compact, filter-aware preview.

## Scope

The feature derives records from:

- played, non-bye match scorelines;
- match xG, possession, tackles, interceptions, rating, and MOTM fields;
- tournament, season, player, registered-player, and selected-team relationships;
- chronological match order and the existing competitive Elo formula.

No database migration or data-entry change is required.

### Explicit non-goals

Do not add or infer metrics that require data the app does not capture reliably:

- fastest, earliest, latest, or stoppage-time goals;
- first-scorer and goal-order records;
- comeback records inferred from in-match score progression;
- assists, expected assists, or chance creation;
- any historical backfill of missing goal minutes.

Existing time-based widgets must render only when at least one eligible timed goal exists. With the current dataset, Clutch Goals and Goal Distribution by Minute remain hidden instead of showing empty or misleading results.

## Canonical grains and filters

- Registered-player records roll every tournament-specific `player.id` into `registered_player.id`.
- Team records use the tournament-specific `player.team` value.
- Campaign records use `match.season_id`, falling back to the existing derived season identifier when required.
- Performance records include only matches where `is_played = true`, `is_bye = false`, and both competitors are present.
- Matches are ordered by `played_at`, then `match_number`, then `match.id` for deterministic streak and sequence calculations.
- Missing optional match stats are excluded from the affected metric's numerator and denominator. Missing values never become zero.
- Scoreline goals are canonical for scoring, xG, and defensive records. Goal-event rows remain canonical only for explicitly event-based features.

## Architecture

Use a shared, pure TypeScript records engine. This preserves one set of formulas across API routes, Global Analytics, and Competitive Records without adding database views or duplicating logic in SQL.

### Domain modules

- `src/lib/records/types.ts` defines expanded record response types and internal row types.
- `src/lib/records/context.ts` converts matches into chronological registered-player-perspective rows and builds player, team, tournament, and opponent lookups.
- `src/lib/records/runs.ts` calculates streak, bounce-back, dominance, and high-scoring performance records.
- `src/lib/records/campaigns.ts` calculates perfect/unbeaten campaigns, goal difference, and title margins.
- `src/lib/records/performance.ts` calculates xG, possession, MOTM, defensive-action, rating, expected-points, and pressure records.
- `src/lib/records/rivalries.ts` calculates meeting, dominance, reversal, nemesis, and closeness records.
- `src/lib/records/teams.ts` calculates club-specialist, team-combination, and versatility records.
- `src/lib/records/index.ts` exposes the public orchestration functions.

`src/lib/competitive-ratings.ts` will own the existing competitive Elo sequence and expose pre-match rating snapshots. `src/lib/competitive.ts` will continue to re-export the existing public rating interfaces and functions so current API and UI imports do not break.

`calculateCompetitiveRecords` keeps every existing response field and adds an `expanded` property. Existing clients therefore remain compatible while the Competitive page can render the new grouped record book.

### Public interfaces

The records engine exposes:

```ts
export type RecordsScope = {
  scope: 'season' | 'all-time';
  seasonId?: string | null;
};

export function calculateExpandedRecords(
  registeredPlayers: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: Pick<Player, 'id' | 'registered_player_id' | 'team' | 'tournament_id'>[],
  tournaments: Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'season_id'>[],
  matches: Match[],
  scope: RecordsScope
): ExpandedRecords;

export function calculatePerformanceRecords(
  registeredPlayers: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: Pick<Player, 'id' | 'registered_player_id' | 'team' | 'tournament_id'>[],
  matches: Match[]
): PerformanceRecords;
```

`calculatePerformanceRecords` is the smaller client-safe entry point used by Global Analytics after applying its date and format filters.

## Record definitions

### Runs and resilience

1. **Longest unbeaten run** — maximum consecutive matches with result W or D.
2. **Longest scoring run** — maximum consecutive matches with goals for greater than zero.
3. **Longest MOTM streak** — maximum consecutive matches where `stats.motm_player_id` equals that player's tournament instance. A missing or different MOTM breaks the streak.
4. **Bounce-back rate** — wins immediately after the player's previous chronological match was a loss, divided by all post-loss opportunities. Qualification: at least three opportunities.
5. **Dominance rate** — wins by at least three goals divided by all wins. Qualification: at least 10 matches and five wins.
6. **Three-plus-goal performances** — number of matches in which the player scored at least three goals.
7. **Four-plus-goal performances** — number of matches in which the player scored at least four goals.
8. **Best single-match output** — maximum goals scored by the player in one eligible match.

### Campaign records

Campaign records require a completed tournament and at least three eligible matches for the player.

1. **Perfect campaigns** — every eligible match was a win.
2. **Unbeaten campaigns** — no eligible match was a loss.
3. **Best campaign goal difference** — goals for minus goals against.
4. **Largest title margin** — champion's standings points minus the runner-up's standings points. Only league-format tournaments qualify because knockout points are not comparable.

Campaign cards display the tournament/season name, match count, and W-D-L record. Raw point totals are details rather than a standalone cross-season record because tournament lengths differ.

### Advanced performance

1. **Finishing efficiency** — scoreline goals divided by own xG, expressed as a percentage. Qualification: at least 10 matches containing own xG and positive total xG.
2. **xG overperformance** — scoreline goals minus own xG. Rank by total surplus and show surplus per eligible match in the detail.
3. **Defensive xG overperformance** — opponent xG minus goals conceded. Positive values mean fewer goals conceded than expected. Rank by total surplus and show per-match detail.
4. **Counterpunch win rate** — wins divided by matches where recorded possession was below 50%. Qualification: at least five such matches.
5. **MOTM rate** — MOTM awards divided by matches containing a recorded `motm_player_id`. Qualification: at least 10 matches with a recorded MOTM.
6. **Defensive work rate** — average of the player's recorded tackles plus interceptions. Qualification: at least 10 matches containing both values.
7. **Rating consistency** — population standard deviation of recorded match ratings, lower is better. Qualification: at least 10 rated matches and an average rating of at least 7.0. Average rating is shown beside the deviation so consistency cannot reward persistently weak performances.
8. **Expected-points efficiency** — actual points minus expected points in matches containing both xG values. For each match, enumerate Poisson score probabilities from 0 through 12 goals for both players, normalize the covered probability mass, and compute `3 × P(win) + P(draw)`. Qualification: at least 10 xG-complete matches.
9. **Pressure performance** — points earned divided by maximum points against opponents whose competitive Elo rating was higher immediately before the match. Qualification: at least five such matches. Pre-match ratings use the existing competitive Elo formula and are captured before applying that match's update, preventing future-data leakage.

### Rivalry records

Rivalry boards require at least five direct played, non-bye meetings. Pair identity is the two sorted registered-player IDs.

1. **Most-played rivalry** — highest number of direct meetings.
2. **Rivalry dominance** — the leading player's wins divided by total meetings, with W-D-L and goal difference in the detail.
3. **Rivalry reversals** — wins where the same player lost the immediately preceding meeting against that opponent.
4. **Nemesis index** — for each player, the opponent responsible for the largest share of that player's career losses. Display losses to the opponent divided by all career losses.
5. **Closest rivalry** — lowest average absolute score margin, with meetings as the descending tie-breaker.

### Team records

1. **Club specialist** — each player's highest-win-rate qualified team, ranked across players. A player/team combination requires at least eight matches.
2. **Best player/team combination** — all qualified player/team combinations ranked by win rate, then matches, then goal difference per match.
3. **Most versatile winner** — number of distinct selected teams with which the registered player has recorded at least one win.

## Qualification and sorting policy

- General career rate records: at least 10 eligible matches.
- xG records: at least 10 matches with the necessary xG fields.
- Counterpunch records: at least five sub-50%-possession matches.
- Team combinations: at least eight matches.
- Rivalries: at least five meetings.
- Bounce-back records: at least three post-loss opportunities.
- Rating consistency: at least 10 rated matches and 7.0 average rating.
- Campaign records: completed tournament and at least three player matches.

All leaderboards use deterministic tie-breakers: primary metric, then larger qualified sample, then player name. Lower-is-better boards reverse only the primary metric. Percentages display one decimal place; xG and work-rate values display two decimals.

## API and data flow

The existing competitive data loader already returns registered players, player instances, tournaments, and played matches with side-specific match stats. No additional Supabase query is needed.

`/api/competitive/overview` and `/api/competitive/records` continue returning `CompetitiveRecords`, now with `records.expanded`. Season scope is applied before building all rows, so streaks and rate denominators cannot leak across seasons.

Global Analytics continues using `/api/analytics/global`. After its current format and date filters are applied, it calls `calculatePerformanceRecords` in `useMemo`. Search and minimum-match filters restrict which registered players can appear in the preview.

The existing global Supabase Realtime listener currently revalidates `/api/analytics/*` and `/api/tournaments`, but not `/api/competitive/*`. The implementation must extend its key predicate so competitive overview, ratings, and records also refresh after external match, player, registered-player, or tournament changes.

## User interface

### Competitive → Records

Keep the existing Records tab and existing boards. Add grouped subsections below the current summary:

- Runs & Resilience
- Campaign Dominance
- Advanced Performance
- Rivalries
- Teams

Extract the current inline `RecordBoard` into `src/components/competitive/RecordBoard.tsx`. Add focused section components under `src/components/competitive/` so `src/app/competitive/page.tsx` remains readable.

Each board shows at most five entries initially and uses the existing card, rank, player, detail, and value treatment. Pair records display both participant names. Empty categories show a short explanation rather than a blank card.

On small screens, boards use one column. They expand to two columns on medium screens and three on large screens. Section headings use real heading levels, leaderboard containers receive accessible labels, and value meaning is expressed in text rather than color alone.

### Global Analytics

Add a compact `AdvancedHighlights` section containing approximately six leader cards:

- finishing efficiency;
- xG overperformance;
- counterpunch rate;
- MOTM rate;
- defensive work rate;
- pressure performance.

The cards respond to the existing format, date, search, and minimum-match filters and include a link to Competitive → Records. Time-based Goal Distribution and Clutch Goals render only when `filteredGoals.some(goal => goal.minute != null)`.

## Error and missing-data behavior

- A metric with no qualified entries returns an empty array.
- One missing optional stat affects only that metric and never removes the match from scoreline-derived records.
- A record calculation never throws because a match is missing a joined display name; it skips rows whose registered-player identity cannot be resolved.
- API errors continue through `handleApiError` and existing SWR retry/error surfaces.
- UI copy states the qualification threshold for sample-sensitive boards.

## Performance

The live dataset is small enough for in-memory calculation. Each records request performs one pass to build perspective rows, then category-specific aggregation over those rows. Pairwise rivalry aggregation occurs only for pairs that actually played, avoiding an all-player Cartesian product.

Global Analytics calculations remain memoized and run only when filtered matches or eligible players change. No new client request or dependency is introduced.

## Testing

Use strict test-driven development. Each production calculation is preceded by a failing behavior test.

Unit tests cover:

- deterministic chronological ordering and registered-player rollup;
- unbeaten, scoring, MOTM, bounce-back, dominance, and scoring-performance records;
- completed-campaign qualification, perfect/unbeaten status, goal difference, and league title margin;
- every advanced metric formula, missing-field denominator behavior, and sample thresholds;
- Poisson expected-points probabilities and normalization;
- pre-match Elo pressure classification without future leakage;
- rivalry pairing, dominance, reversal, nemesis, and closeness;
- team qualification, specialist ranking, and versatility;
- all-time versus season isolation and deterministic ties.

Integration verification covers:

- the competitive overview and scoped records API response shape;
- existing competitive records remaining present;
- Global Analytics hiding time-based widgets when no timed goals exist;
- responsive rendering and keyboard/heading semantics for the new sections.

Before completion, run lint, TypeScript checks, the complete Vitest suite, a production build without placeholder public credentials, and browser verification at mobile and desktop widths.

## Rollout and compatibility

- No schema migration or backfill.
- No dependency additions.
- No existing API field removal or rename.
- Existing records and ratings remain unchanged unless a test exposes a current correctness bug.
- The unrelated duplicate untracked files in the working tree remain untouched and are never staged.

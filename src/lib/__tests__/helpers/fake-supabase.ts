// A minimal in-memory stand-in for the Supabase query builder. It mirrors the
// behaviour that matters for data completeness: every response is capped at
// MAX_ROWS (Supabase's default `max-rows`), so a query that forgets to page
// silently loses rows exactly as it would in production.

export const MAX_ROWS = 1000;

type Row = Record<string, unknown>;
type QueryError = { code?: string; message: string };

export interface RecordedQuery {
  table: string;
  columns: string;
  orders: string[];
  range: [number, number] | null;
}

export interface FakeSupabaseOptions {
  tables: Record<string, Row[]>;
  // Return an error to fail a query, e.g. to simulate a missing column.
  failWhen?: (query: RecordedQuery) => QueryError | null;
}

export function createFakeSupabase({ tables, failWhen }: FakeSupabaseOptions) {
  const queries: RecordedQuery[] = [];

  function from(table: string) {
    const query: RecordedQuery = { table, columns: '*', orders: [], range: null };
    const filters: Array<(row: Row) => boolean> = [];
    const sorts: Array<{ column: string; ascending: boolean }> = [];
    let limit: number | null = null;
    let single: 'single' | 'maybeSingle' | null = null;

    const builder = {
      select(columns = '*') { query.columns = columns; return builder; },
      eq(column: string, value: unknown) { filters.push((row) => row[column] === value); return builder; },
      in(column: string, values: unknown[]) { filters.push((row) => values.includes(row[column])); return builder; },
      or(expression: string) {
        const clauses = expression.split(',').map((clause) => {
          const [column, , value] = clause.split('.');
          return { column, value };
        });
        filters.push((row) => clauses.some(({ column, value }) => row[column] === value));
        return builder;
      },
      order(column: string, options: { ascending?: boolean } = {}) {
        query.orders.push(column);
        sorts.push({ column, ascending: options.ascending ?? true });
        return builder;
      },
      range(from: number, to: number) { query.range = [from, to]; return builder; },
      limit(count: number) { limit = count; return builder; },
      single() { single = 'single'; return builder; },
      maybeSingle() { single = 'maybeSingle'; return builder; },
      then<T>(resolve: (value: { data: unknown; error: QueryError | null }) => T, reject?: (reason: unknown) => T) {
        return Promise.resolve().then(() => {
          queries.push(query);
          if (query.range && !query.orders.includes('id')) {
            throw new Error(`Paged query on "${table}" needs a unique "id" order so pages cannot skip or repeat rows`);
          }
          const error = failWhen?.(query) ?? null;
          if (error) return { data: null, error };

          let rows = (tables[table] ?? []).filter((row) => filters.every((filter) => filter(row)));
          rows = [...rows].sort((a, b) => {
            for (const { column, ascending } of sorts) {
              const left = String(a[column] ?? '');
              const right = String(b[column] ?? '');
              if (left !== right) return (left < right ? -1 : 1) * (ascending ? 1 : -1);
            }
            return 0;
          });
          if (single) {
            const missing = !rows[0] && single === 'single';
            return { data: rows[0] ?? null, error: missing ? { message: 'Not found', code: 'PGRST116' } : null };
          }

          const start = query.range?.[0] ?? 0;
          const end = query.range ? query.range[1] + 1 : rows.length;
          const cap = Math.min(MAX_ROWS, limit ?? MAX_ROWS);
          return { data: rows.slice(start, Math.min(end, start + cap)), error: null };
        }).then(resolve, reject);
      },
    };
    return builder;
  }

  return { client: { from }, queries };
}

// Generates `count` played matches between two tournament player instances.
export function playedMatches(count: number, options: {
  prefix: string;
  tournamentId: string;
  homeId: string;
  awayId: string;
  startDay?: number;
  homeScore?: number;
  awayScore?: number;
}) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${options.prefix}-${String(index).padStart(5, '0')}`,
    tournament_id: options.tournamentId,
    home_player_id: options.homeId,
    away_player_id: options.awayId,
    home_score: options.homeScore ?? 1,
    away_score: options.awayScore ?? 0,
    is_played: true,
    is_bye: false,
    stage: null,
    stats: null,
    played_at: new Date(Date.UTC(2026, 0, 1) + ((options.startDay ?? 0) * 86_400_000) + index * 60_000).toISOString(),
  }));
}

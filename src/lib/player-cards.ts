import { clubForSide } from './club-analytics';
import { buildCompetitiveRatingTimeline, calculateCompetitiveRatings, RATING_TUNING } from './competitive-ratings';
import { getTournamentChampions } from './tournament-results';
import type { Match, MatchStats, Player, RegisteredPlayer, Tournament } from './types';

export type CardTier = 'elite' | 'gold' | 'silver' | 'bronze';

export interface CardAttribute {
  key: 'ATT' | 'DEF' | 'WIN' | 'MOM' | 'FRM' | 'CLU';
  label: string;
  value: number;
  detail: string;
}

export interface PlayerCardData {
  playerId: string;
  name: string;
  overall: number;
  rating: number;
  peakRating: number;
  tier: CardTier;
  // True for the winner of the most recently decided tournament.
  reigningChampion: boolean;
  // Under this many matches the numbers are still settling.
  provisional: boolean;
  matches: number;
  titles: number;
  club: string;
  attributes: CardAttribute[];
}

type PlayerInput = Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;
type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>;
type TournamentInput = Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'created_at'>;

export const PROVISIONAL_MATCHES = RATING_TUNING.provisionalMatches;
// Small samples are pulled toward the group average by this many matches'
// worth of weight, so four lucky games don't make a 99.
const SHRINK_MATCHES = 10;
const ATTRIBUTE_FLOOR = 40;
const ATTRIBUTE_CEILING = 96;

// The rating mapped onto a FIFA-style 70–99 overall: 880 and below is 70,
// about 1127 and above is 99.
export function overallFromRating(rating: number) {
  return Math.max(70, Math.min(99, Math.round(70 + (rating - 880) / 8.5)));
}

export function tierFor(overall: number): CardTier {
  if (overall >= 90) return 'elite';
  if (overall >= 82) return 'gold';
  if (overall >= 76) return 'silver';
  return 'bronze';
}

interface RawLine {
  matches: number;
  wins: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  motm: number;
  recentPoints: number[];
  bigGames: number;
  bigGamePoints: number;
  clubs: Map<string, number>;
}

function chronological(a: Match, b: Match) {
  return (a.played_at ?? '').localeCompare(b.played_at ?? '') || a.match_number - b.match_number || a.id.localeCompare(b.id);
}

function shrink(value: number, n: number, mean: number) {
  return (value * n + mean * SHRINK_MATCHES) / (n + SHRINK_MATCHES);
}

function scale(values: Map<string, number>, higherIsBetter = true) {
  const list = [...values.values()];
  const min = Math.min(...list);
  const max = Math.max(...list);
  const scaled = new Map<string, number>();
  for (const [id, value] of values) {
    const share = max === min ? 0.5 : (value - min) / (max - min);
    const oriented = higherIsBetter ? share : 1 - share;
    scaled.set(id, Math.round(ATTRIBUTE_FLOOR + oriented * (ATTRIBUTE_CEILING - ATTRIBUTE_FLOOR)));
  }
  return scaled;
}

const fixed = (value: number, digits = 1) => value.toFixed(digits);

export function buildPlayerCards(
  players: PlayerInput[],
  instances: InstanceInput[],
  allMatches: Match[],
  tournaments: TournamentInput[]
): PlayerCardData[] {
  const ownerOf = new Map(instances.map((instance) => [instance.id, instance.registered_player_id]));
  const matches = allMatches
    .filter((match) => match.is_played && !match.is_bye && match.home_player_id && match.away_player_id && match.home_score != null && match.away_score != null)
    .sort(chronological);
  const timeline = buildCompetitiveRatingTimeline(players, instances, matches, { scope: 'all-time' });
  const ratings = new Map(calculateCompetitiveRatings(players, instances, matches, { scope: 'all-time' }).map((row) => [row.player.id, row]));

  const lines = new Map<string, RawLine>();
  const line = (id: string) => {
    let entry = lines.get(id);
    if (!entry) {
      entry = { matches: 0, wins: 0, points: 0, goalsFor: 0, goalsAgainst: 0, motm: 0, recentPoints: [], bigGames: 0, bigGamePoints: 0, clubs: new Map() };
      lines.set(id, entry);
    }
    return entry;
  };

  for (const match of matches) {
    const snap = timeline.get(match.id);
    const stats = (match.stats ?? {}) as MatchStats;
    for (const side of ['home', 'away'] as const) {
      const instanceId = side === 'home' ? match.home_player_id! : match.away_player_id!;
      const owner = ownerOf.get(instanceId);
      if (!owner) continue;
      const scored = (side === 'home' ? match.home_score : match.away_score)!;
      const conceded = (side === 'home' ? match.away_score : match.home_score)!;
      const points = scored > conceded ? 3 : scored === conceded ? 1 : 0;
      const entry = line(owner);
      entry.matches++;
      entry.points += points;
      if (points === 3) entry.wins++;
      entry.goalsFor += scored;
      entry.goalsAgainst += conceded;
      if (stats.motm_player_id === instanceId) entry.motm++;
      entry.recentPoints.push(points);
      if (snap) {
        const own = side === 'home' ? snap.homeRating : snap.awayRating;
        const other = side === 'home' ? snap.awayRating : snap.homeRating;
        if (other > own) {
          entry.bigGames++;
          entry.bigGamePoints += points;
        }
      }
      const club = clubForSide(match, side);
      if (club !== 'Unknown') entry.clubs.set(club, (entry.clubs.get(club) ?? 0) + 1);
    }
  }

  const active = players.filter((player) => (lines.get(player.id)?.matches ?? 0) > 0);
  if (active.length === 0) return [];

  // Per-player raw values, each shrunk toward the group average.
  const metric = (read: (entry: RawLine) => { value: number; n: number }) => {
    const raw = active.map((player) => ({ id: player.id, ...read(lines.get(player.id)!) }));
    const weight = raw.reduce((sum, row) => sum + row.n, 0);
    const mean = weight ? raw.reduce((sum, row) => sum + row.value * row.n, 0) / weight : 0;
    return {
      raw: new Map(raw.map((row) => [row.id, row.value])),
      shrunk: new Map(raw.map((row) => [row.id, shrink(row.value, row.n, mean)])),
    };
  };

  const attack = metric((e) => ({ value: e.goalsFor / e.matches, n: e.matches }));
  const defence = metric((e) => ({ value: e.goalsAgainst / e.matches, n: e.matches }));
  const winning = metric((e) => ({ value: e.wins / e.matches, n: e.matches }));
  const motm = metric((e) => ({ value: e.motm / e.matches, n: e.matches }));
  const form = metric((e) => {
    const recent = e.recentPoints.slice(-10);
    return { value: recent.reduce((a, b) => a + b, 0) / recent.length, n: recent.length };
  });
  const clutch = metric((e) => ({ value: e.bigGames ? e.bigGamePoints / e.bigGames : 0, n: e.bigGames }));

  const scaled = {
    ATT: scale(attack.shrunk),
    DEF: scale(defence.shrunk, false),
    WIN: scale(winning.shrunk),
    MOM: scale(motm.shrunk),
    FRM: scale(form.shrunk),
    CLU: scale(clutch.shrunk),
  };

  const champions = getTournamentChampions(tournaments, instances, allMatches);
  const titles = new Map<string, number>();
  for (const champion of champions.values()) titles.set(champion.registeredPlayerId, (titles.get(champion.registeredPlayerId) ?? 0) + 1);
  const reigning = [...tournaments]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .map((tournament) => champions.get(tournament.id))
    .find(Boolean)?.registeredPlayerId;

  return active
    .map((player) => {
      const entry = lines.get(player.id)!;
      const ratingRow = ratings.get(player.id);
      const rating = ratingRow?.rating ?? RATING_TUNING.newPlayerRating;
      const overall = overallFromRating(rating);
      const recent = entry.recentPoints.slice(-10);
      const favourite = [...entry.clubs].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? player.base_team;
      const attributes: CardAttribute[] = [
        { key: 'ATT', label: 'Attack', value: scaled.ATT.get(player.id)!, detail: `${fixed(attack.raw.get(player.id)!)} goals per match` },
        { key: 'DEF', label: 'Defence', value: scaled.DEF.get(player.id)!, detail: `${fixed(defence.raw.get(player.id)!)} conceded per match` },
        { key: 'WIN', label: 'Winning', value: scaled.WIN.get(player.id)!, detail: `${Math.round(winning.raw.get(player.id)! * 100)}% of matches won` },
        { key: 'MOM', label: 'Man of the Match', value: scaled.MOM.get(player.id)!, detail: `${entry.motm} Man of the Match ${entry.motm === 1 ? 'award' : 'awards'}` },
        { key: 'FRM', label: 'Form', value: scaled.FRM.get(player.id)!, detail: `${recent.reduce((a, b) => a + b, 0)} points from the last ${recent.length}` },
        { key: 'CLU', label: 'Clutch', value: scaled.CLU.get(player.id)!, detail: entry.bigGames ? `${fixed(entry.bigGamePoints / entry.bigGames)} points per match against higher-rated players` : 'No matches against higher-rated players yet' },
      ];
      return {
        playerId: player.id,
        name: player.name,
        overall,
        rating,
        peakRating: ratingRow?.peakRating ?? rating,
        tier: tierFor(overall),
        reigningChampion: reigning === player.id,
        provisional: entry.matches < PROVISIONAL_MATCHES,
        matches: entry.matches,
        titles: titles.get(player.id) ?? 0,
        club: favourite,
        attributes,
      };
    })
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
}

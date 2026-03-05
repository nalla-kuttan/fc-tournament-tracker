'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FunFactCard from './FunFactCard';
import type { Match, MatchStats } from '@/lib/types';

interface PlayerInstance {
  id: string;
  registered_player_id: string;
  name: string;
  team: string;
}

interface RegisteredPlayer {
  id: string;
  name: string;
  base_team: string;
}

interface GoalData {
  player_id: string;
  minute: number | null;
  match_id: string;
}

interface FunFact {
  emoji: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

function computeFunFacts(
  matches: Match[],
  goals: GoalData[],
  registeredPlayers: RegisteredPlayer[],
  playerInstances: PlayerInstance[]
): FunFact[] {
  if (matches.length === 0) return [];

  const facts: FunFact[] = [];

  // Build lookup: player instance id → registered player
  const instanceToRegistered = new Map<string, RegisteredPlayer>();
  for (const pi of playerInstances) {
    const rp = registeredPlayers.find((r) => r.id === pi.registered_player_id);
    if (rp) instanceToRegistered.set(pi.id, rp);
  }

  // Build lookup: registered player id → set of player instance ids
  const rpToInstances = new Map<string, Set<string>>();
  for (const pi of playerInstances) {
    if (!rpToInstances.has(pi.registered_player_id)) {
      rpToInstances.set(pi.registered_player_id, new Set());
    }
    rpToInstances.get(pi.registered_player_id)!.add(pi.id);
  }

  // 1. Longest Win Streak
  try {
    let bestStreak = 0;
    let bestStreakPlayer = '';
    for (const [rpId, instanceIds] of rpToInstances) {
      const rp = registeredPlayers.find((r) => r.id === rpId);
      if (!rp) continue;
      const playerMatches = matches
        .filter((m) => instanceIds.has(m.home_player_id!) || instanceIds.has(m.away_player_id!))
        .sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? ''));
      let streak = 0;
      let maxStreak = 0;
      for (const m of playerMatches) {
        const isHome = instanceIds.has(m.home_player_id!);
        const myScore = isHome ? m.home_score! : m.away_score!;
        const oppScore = isHome ? m.away_score! : m.home_score!;
        if (myScore > oppScore) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
      }
      if (maxStreak > bestStreak) {
        bestStreak = maxStreak;
        bestStreakPlayer = rp.name;
      }
    }
    if (bestStreak >= 2) {
      facts.push({
        emoji: '🔥',
        title: 'Win Streak',
        value: `${bestStreak} in a row`,
        subtitle: bestStreakPlayer,
        color: '#FF9F0A',
      });
    }
  } catch { /* skip */ }

  // 2. Most Goals in One Match
  try {
    let maxGoals = 0;
    let maxGoalsMatch: Match | null = null;
    for (const m of matches) {
      const total = (m.home_score ?? 0) + (m.away_score ?? 0);
      if (total > maxGoals) {
        maxGoals = total;
        maxGoalsMatch = m;
      }
    }
    if (maxGoalsMatch && maxGoals > 0) {
      facts.push({
        emoji: '⚽',
        title: 'Goal Fest',
        value: `${maxGoals} goals`,
        subtitle: `${maxGoalsMatch.home_player?.name ?? 'TBD'} ${maxGoalsMatch.home_score}-${maxGoalsMatch.away_score} ${maxGoalsMatch.away_player?.name ?? 'TBD'}`,
        color: '#0A84FF',
      });
    }
  } catch { /* skip */ }

  // 3. Highest-Rated Performance
  try {
    let maxRating = 0;
    let maxRatingPlayer = '';
    let maxRatingMatch = '';
    for (const m of matches) {
      const stats = m.stats as MatchStats;
      if (!stats) continue;
      if (stats.home_rating != null && stats.home_rating > maxRating) {
        maxRating = stats.home_rating;
        const rp = m.home_player_id ? instanceToRegistered.get(m.home_player_id) : null;
        maxRatingPlayer = rp?.name ?? m.home_player?.name ?? 'Unknown';
        maxRatingMatch = `vs ${m.away_player?.name ?? 'TBD'}`;
      }
      if (stats.away_rating != null && stats.away_rating > maxRating) {
        maxRating = stats.away_rating;
        const rp = m.away_player_id ? instanceToRegistered.get(m.away_player_id) : null;
        maxRatingPlayer = rp?.name ?? m.away_player?.name ?? 'Unknown';
        maxRatingMatch = `vs ${m.home_player?.name ?? 'TBD'}`;
      }
    }
    if (maxRating > 0) {
      facts.push({
        emoji: '⭐',
        title: 'Best Performance',
        value: `${maxRating.toFixed(1)} rating`,
        subtitle: `${maxRatingPlayer} ${maxRatingMatch}`,
        color: '#FF9F0A',
      });
    }
  } catch { /* skip */ }

  // 4. Most Clean Sheets in a Row
  try {
    let bestCSStreak = 0;
    let bestCSPlayer = '';
    for (const [rpId, instanceIds] of rpToInstances) {
      const rp = registeredPlayers.find((r) => r.id === rpId);
      if (!rp) continue;
      const playerMatches = matches
        .filter((m) => instanceIds.has(m.home_player_id!) || instanceIds.has(m.away_player_id!))
        .sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? ''));
      let streak = 0;
      let maxStreak = 0;
      for (const m of playerMatches) {
        const isHome = instanceIds.has(m.home_player_id!);
        const oppScore = isHome ? m.away_score! : m.home_score!;
        if (oppScore === 0) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
      }
      if (maxStreak > bestCSStreak) {
        bestCSStreak = maxStreak;
        bestCSPlayer = rp.name;
      }
    }
    if (bestCSStreak >= 2) {
      facts.push({
        emoji: '🧤',
        title: 'CS Streak',
        value: `${bestCSStreak} in a row`,
        subtitle: bestCSPlayer,
        color: '#34C759',
      });
    }
  } catch { /* skip */ }

  // 5. Biggest Victory
  try {
    let maxDiff = 0;
    let biggestWin: Match | null = null;
    for (const m of matches) {
      const diff = Math.abs((m.home_score ?? 0) - (m.away_score ?? 0));
      if (diff > maxDiff) {
        maxDiff = diff;
        biggestWin = m;
      }
    }
    if (biggestWin && maxDiff > 0) {
      const winnerIsHome = (biggestWin.home_score ?? 0) > (biggestWin.away_score ?? 0);
      const winnerName = winnerIsHome ? biggestWin.home_player?.name : biggestWin.away_player?.name;
      facts.push({
        emoji: '💥',
        title: 'Biggest Win',
        value: `${biggestWin.home_score}-${biggestWin.away_score}`,
        subtitle: `${winnerName ?? 'Unknown'} dominance`,
        color: '#FF3B30',
      });
    }
  } catch { /* skip */ }

  // 6. Most MOTM Awards
  try {
    const motmCount = new Map<string, number>();
    for (const m of matches) {
      const stats = m.stats as MatchStats;
      if (stats?.motm_player_id) {
        motmCount.set(stats.motm_player_id, (motmCount.get(stats.motm_player_id) ?? 0) + 1);
      }
    }
    let maxMotm = 0;
    let motmPlayerId = '';
    for (const [pid, count] of motmCount) {
      if (count > maxMotm) {
        maxMotm = count;
        motmPlayerId = pid;
      }
    }
    if (maxMotm >= 2) {
      const rp = instanceToRegistered.get(motmPlayerId);
      facts.push({
        emoji: '🏅',
        title: 'MOTM King',
        value: `${maxMotm} awards`,
        subtitle: rp?.name ?? 'Unknown',
        color: '#BF5AF2',
      });
    }
  } catch { /* skip */ }

  // 7. Clinical Finisher (Highest xG Overperformance)
  try {
    let maxOverperformance = 0;
    let overperformerName = '';
    let overperformerMatch = '';

    for (const m of matches) {
      const stats = m.stats as MatchStats;
      if (!stats) continue;

      // Home player overperformance
      if (stats.home_xg != null && m.home_score != null) {
        const overperformance = m.home_score - stats.home_xg;
        if (overperformance > maxOverperformance) {
          maxOverperformance = overperformance;
          const rp = m.home_player_id ? instanceToRegistered.get(m.home_player_id) : null;
          overperformerName = rp?.name ?? m.home_player?.name ?? 'Unknown';
          overperformerMatch = `vs ${m.away_player?.name ?? 'TBD'}`;
        }
      }

      // Away player overperformance
      if (stats.away_xg != null && m.away_score != null) {
        const overperformance = m.away_score - stats.away_xg;
        if (overperformance > maxOverperformance) {
          maxOverperformance = overperformance;
          const rp = m.away_player_id ? instanceToRegistered.get(m.away_player_id) : null;
          overperformerName = rp?.name ?? m.away_player?.name ?? 'Unknown';
          overperformerMatch = `vs ${m.home_player?.name ?? 'TBD'}`;
        }
      }
    }

    if (maxOverperformance > 0.5) { // Ensure it's a significant overperformance
      facts.push({
        emoji: '🎯',
        title: 'Clinical Finisher',
        value: `+${maxOverperformance.toFixed(1)} xG Diff`,
        subtitle: `${overperformerName} ${overperformerMatch}`,
        color: '#FFD60A', // iOS Yellow
      });
    }
  } catch { /* skip */ }

  // 8. Brick Wall (Most Tackles)
  try {
    let maxTackles = 0;
    let tacklerName = '';
    let tacklerMatch = '';

    for (const m of matches) {
      const stats = m.stats as MatchStats;
      if (!stats) continue;

      if (stats.home_tackles != null && stats.home_tackles > maxTackles) {
        maxTackles = stats.home_tackles;
        const rp = m.home_player_id ? instanceToRegistered.get(m.home_player_id) : null;
        tacklerName = rp?.name ?? m.home_player?.name ?? 'Unknown';
        tacklerMatch = `vs ${m.away_player?.name ?? 'TBD'}`;
      }

      if (stats.away_tackles != null && stats.away_tackles > maxTackles) {
        maxTackles = stats.away_tackles;
        const rp = m.away_player_id ? instanceToRegistered.get(m.away_player_id) : null;
        tacklerName = rp?.name ?? m.away_player?.name ?? 'Unknown';
        tacklerMatch = `vs ${m.home_player?.name ?? 'TBD'}`;
      }
    }

    if (maxTackles >= 5) {
      facts.push({
        emoji: '🛡️',
        title: 'Brick Wall',
        value: `${maxTackles} tackles`,
        subtitle: `${tacklerName} ${tacklerMatch}`,
        color: '#FF453A', // iOS Red/Orange
      });
    }
  } catch { /* skip */ }

  // 9. Master Reader (Most Interceptions)
  try {
    let maxInterceptions = 0;
    let interceptorName = '';
    let interceptorMatch = '';

    for (const m of matches) {
      const stats = m.stats as MatchStats;
      if (!stats) continue;

      if (stats.home_interceptions != null && stats.home_interceptions > maxInterceptions) {
        maxInterceptions = stats.home_interceptions;
        const rp = m.home_player_id ? instanceToRegistered.get(m.home_player_id) : null;
        interceptorName = rp?.name ?? m.home_player?.name ?? 'Unknown';
        interceptorMatch = `vs ${m.away_player?.name ?? 'TBD'}`;
      }

      if (stats.away_interceptions != null && stats.away_interceptions > maxInterceptions) {
        maxInterceptions = stats.away_interceptions;
        const rp = m.away_player_id ? instanceToRegistered.get(m.away_player_id) : null;
        interceptorName = rp?.name ?? m.away_player?.name ?? 'Unknown';
        interceptorMatch = `vs ${m.home_player?.name ?? 'TBD'}`;
      }
    }

    if (maxInterceptions >= 5) {
      facts.push({
        emoji: '🧠',
        title: 'Master Reader',
        value: `${maxInterceptions} ints`,
        subtitle: `${interceptorName} ${interceptorMatch}`,
        color: '#64D2FF', // iOS Light Blue
      });
    }
  } catch { /* skip */ }

  return facts;
}

interface Props {
  matches: Match[];
  goals: GoalData[];
  registeredPlayers: RegisteredPlayer[];
  playerInstances: PlayerInstance[];
}

export default function FunFactsSection({ matches, goals, registeredPlayers, playerInstances }: Props) {
  const facts = computeFunFacts(matches, goals, registeredPlayers, playerInstances);

  if (facts.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="body2"
        sx={{
          color: '#8E8E93',
          textTransform: 'uppercase',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.5px',
          px: 2,
          mb: 1.5,
        }}
      >
        Records & Milestones
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          px: 0.5,
          '&::-webkit-scrollbar': { height: 0 },
          scrollbarWidth: 'none',
        }}
      >
        {facts.map((fact) => (
          <FunFactCard
            key={fact.title}
            emoji={fact.emoji}
            title={fact.title}
            value={fact.value}
            subtitle={fact.subtitle}
            color={fact.color}
          />
        ))}
      </Box>
    </Box>
  );
}

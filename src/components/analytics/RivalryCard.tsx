'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import { FORM_COLORS } from '@/lib/constants';
import type { H2HData, Match } from '@/lib/types';

function computeRivalryIntensity(data: H2HData): number {
  if (data.total_encounters === 0) return 0;

  // Factor 1: Number of encounters (more games = more rivalry)
  const encounterScore = Math.min(data.total_encounters / 10, 1);

  // Factor 2: Closeness of record (closer = more intense)
  const totalDecided = data.player1_wins + data.player2_wins;
  const winRatioCloseness = totalDecided > 0
    ? 1 - Math.abs(data.player1_wins - data.player2_wins) / totalDecided
    : 1;

  // Factor 3: Draw percentage (more draws = more evenly matched)
  const drawRatio = data.total_encounters > 0 ? data.draws / data.total_encounters : 0;

  // Factor 4: Goal balance closeness
  const totalGoals = data.player1_goals + data.player2_goals;
  const goalCloseness = totalGoals > 0
    ? 1 - Math.abs(data.player1_goals - data.player2_goals) / totalGoals
    : 1;

  const rawScore = (encounterScore * 0.3) + (winRatioCloseness * 0.35) + (drawRatio * 0.15) + (goalCloseness * 0.2);

  return Math.max(1, Math.min(5, Math.round(rawScore * 5)));
}

function getClosestMatch(matches: Match[], p1Wins: number, p2Wins: number): string {
  if (matches.length === 0) return '-';
  let minDiff = Infinity;
  let closest = '';
  for (const m of matches) {
    const diff = Math.abs((m.home_score ?? 0) - (m.away_score ?? 0));
    if (diff < minDiff) {
      minDiff = diff;
      closest = `${m.home_score}-${m.away_score}`;
    }
  }
  return closest;
}

function getBiggestWin(matches: Match[]): string {
  if (matches.length === 0) return '-';
  let maxDiff = 0;
  let biggest = '';
  for (const m of matches) {
    const diff = Math.abs((m.home_score ?? 0) - (m.away_score ?? 0));
    if (diff > maxDiff) {
      maxDiff = diff;
      biggest = `${m.home_score}-${m.away_score}`;
    }
  }
  return biggest;
}

function getAvgGoalMargin(matches: Match[]): string {
  if (matches.length === 0) return '-';
  const totalDiff = matches.reduce((sum, m) => sum + Math.abs((m.home_score ?? 0) - (m.away_score ?? 0)), 0);
  return (totalDiff / matches.length).toFixed(1);
}

function getLast5Results(matches: Match[], player1Name: string): ('W' | 'D' | 'L')[] {
  const sorted = [...matches].sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''));
  return sorted.slice(0, 5).map((m) => {
    const p1IsHome = m.home_player?.name === player1Name;
    const p1Score = p1IsHome ? m.home_score! : m.away_score!;
    const p2Score = p1IsHome ? m.away_score! : m.home_score!;
    return p1Score > p2Score ? 'W' : p1Score < p2Score ? 'L' : 'D';
  });
}

export default function RivalryCard({ data }: { data: H2HData }) {
  if (data.total_encounters === 0) return null;

  const intensity = computeRivalryIntensity(data);
  const fires = '🔥'.repeat(intensity);
  const closestMatch = getClosestMatch(data.matches, data.player1_wins, data.player2_wins);
  const biggestWin = getBiggestWin(data.matches);
  const avgMargin = getAvgGoalMargin(data.matches);
  const last5 = getLast5Results(data.matches, data.player1.name);

  // Win ratio bar
  const total = data.player1_wins + data.draws + data.player2_wins;
  const p1Pct = total > 0 ? (data.player1_wins / total) * 100 : 0;
  const drawPct = total > 0 ? (data.draws / total) * 100 : 0;
  const p2Pct = total > 0 ? (data.player2_wins / total) * 100 : 0;

  return (
    <GlassCard>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Rivalry Intensity
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', letterSpacing: 2 }}>
            {fires}
          </Typography>
        </Box>

        {/* Win Ratio Bar */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#0A84FF', fontWeight: 600 }}>
              {data.player1.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#BF5AF2', fontWeight: 600 }}>
              {data.player2.name}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              height: 8,
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: 'rgba(255,255,255,0.05)',
            }}
          >
            {p1Pct > 0 && (
              <Box sx={{ width: `${p1Pct}%`, bgcolor: '#0A84FF', transition: 'width 0.5s ease' }} />
            )}
            {drawPct > 0 && (
              <Box sx={{ width: `${drawPct}%`, bgcolor: '#8E8E93', transition: 'width 0.5s ease' }} />
            )}
            {p2Pct > 0 && (
              <Box sx={{ width: `${p2Pct}%`, bgcolor: '#BF5AF2', transition: 'width 0.5s ease' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#8E8E93' }}>
              {data.player1_wins}W
            </Typography>
            {data.draws > 0 && (
              <Typography variant="caption" sx={{ color: '#8E8E93' }}>
                {data.draws}D
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: '#8E8E93' }}>
              {data.player2_wins}W
            </Typography>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={700} sx={{ color: '#FF9F0A' }}>
              {avgMargin}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: '0.65rem' }}>
              Avg Margin
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={700} sx={{ color: '#34C759' }}>
              {closestMatch}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: '0.65rem' }}>
              Closest
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={700} sx={{ color: '#FF3B30' }}>
              {biggestWin}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: '0.65rem' }}>
              Biggest Win
            </Typography>
          </Box>
        </Box>

        {/* Last 5 Results */}
        {last5.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
              Last {last5.length} ({data.player1.name}&apos;s perspective)
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {last5.map((result, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: FORM_COLORS[result],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>
                    {result}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </GlassCard>
  );
}

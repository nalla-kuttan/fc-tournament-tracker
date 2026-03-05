'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import RadarChartComponent from './RadarChart';
import WDLDoughnut from './WDLDoughnut';
import RivalryCard from './RivalryCard';
import dayjs from 'dayjs';
import { FORM_COLORS } from '@/lib/constants';
import type { H2HData, Match } from '@/lib/types';

interface Props {
  data: H2HData;
}

function BigStat({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" fontWeight={800} sx={{ color: color ?? 'primary.main', fontFamily: 'monospace' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
        {label}
      </Typography>
    </Box>
  );
}

function MatchHistoryRow({ match, player1Name }: { match: Match; player1Name: string }) {
  const p1IsHome = match.home_player?.name === player1Name;
  const p1Score = p1IsHome ? match.home_score : match.away_score;
  const p2Score = p1IsHome ? match.away_score : match.home_score;
  const result: 'W' | 'D' | 'L' =
    p1Score! > p2Score! ? 'W' : p1Score! < p2Score! ? 'L' : 'D';
  const resultColor = FORM_COLORS[result];
  const resultLabel = result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>
        {match.played_at ? dayjs(match.played_at).format('MMM D, YYYY') : '\u2014'}
      </Typography>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 20, textAlign: 'right' }}>
          {p1Score}
        </Typography>
        <Chip
          label={resultLabel}
          size="small"
          sx={{
            bgcolor: resultColor,
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
            minWidth: 48,
            height: 24,
          }}
        />
        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 20, textAlign: 'left' }}>
          {p2Score}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ width: 130, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {match.tournament?.name ?? `Round ${match.round_number}`}
      </Typography>
    </Box>
  );
}

export default function H2HComparison({ data }: Props) {
  const hasEncounters = data.total_encounters > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Head-to-Head Record */}
      <GlassCard>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom textAlign="center">
            Head-to-Head Record
          </Typography>

          {hasEncounters ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, py: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {data.player1.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.player1.base_team}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(0,212,255,0.08)',
                  }}
                >
                  <BigStat value={data.player1_wins} label="Wins" color="#0A84FF" />
                  <BigStat value={data.draws} label="Draws" color="#8E8E93" />
                  <BigStat value={data.player2_wins} label="Wins" color="#BF5AF2" />
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {data.player2.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.player2.base_team}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total encounters: {data.total_encounters}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Goals: {data.player1_goals} - {data.player2_goals}
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {data.player1.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.player1.base_team}
                  </Typography>
                </Box>
                <Typography variant="h6" color="text.secondary">vs</Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {data.player2.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.player2.base_team}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" color="text.secondary">
                No direct encounters found
              </Typography>
              <Typography variant="caption" color="text.secondary">
                These players have not faced each other in any tournament
              </Typography>
            </Box>
          )}
        </CardContent>
      </GlassCard>

      {/* Rivalry Intensity */}
      <RivalryCard data={data} />

      {/* Radar Chart */}
      <GlassCard>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom textAlign="center">
            Attribute Comparison
          </Typography>
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <RadarChartComponent player1Stats={data.player1_career} player2Stats={data.player2_career} />
          </Box>
        </CardContent>
      </GlassCard>

      {/* W/D/L Doughnuts */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <CardContent>
              <WDLDoughnut stats={data.player1_career} title={data.player1.name} />
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <CardContent>
              <WDLDoughnut stats={data.player2_career} title={data.player2.name} />
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Career Stat Comparison Table */}
      <GlassCard>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom textAlign="center">
            Career Comparison
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {[
            { label: 'Total Matches', p1: data.player1_career.total_matches, p2: data.player2_career.total_matches },
            { label: 'Win Rate', p1: `${data.player1_career.win_rate.toFixed(0)}%`, p2: `${data.player2_career.win_rate.toFixed(0)}%` },
            { label: 'Total Goals', p1: data.player1_career.total_goals, p2: data.player2_career.total_goals },
            { label: 'Goals/Match', p1: data.player1_career.goals_per_match.toFixed(2), p2: data.player2_career.goals_per_match.toFixed(2) },
            { label: 'Clean Sheets', p1: data.player1_career.clean_sheets, p2: data.player2_career.clean_sheets },
            { label: 'Avg Rating', p1: data.player1_career.avg_rating.toFixed(1), p2: data.player2_career.avg_rating.toFixed(1) },
            { label: 'Avg xG', p1: data.player1_career.avg_xg.toFixed(2), p2: data.player2_career.avg_xg.toFixed(2) },
            { label: 'MOTM Awards', p1: data.player1_career.motm_awards, p2: data.player2_career.motm_awards },
          ].map((row) => (
            <Box
              key={row.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
                {row.p1}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 140, textAlign: 'center' }}
              >
                {row.label}
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1, textAlign: 'left', pl: 2 }}>
                {row.p2}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </GlassCard>

      {/* Match History */}
      {data.matches.length > 0 && (
        <GlassCard>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom textAlign="center">
              Match History
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', px: 0.5, py: 1, opacity: 0.6 }}>
              <Typography variant="caption" sx={{ width: 90, flexShrink: 0 }}>
                Date
              </Typography>
              <Typography variant="caption" sx={{ flex: 1, textAlign: 'center' }}>
                Result
              </Typography>
              <Typography variant="caption" sx={{ width: 130, textAlign: 'right', flexShrink: 0 }}>
                Tournament
              </Typography>
            </Box>
            {[...data.matches]
              .sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''))
              .map((match) => (
                <MatchHistoryRow
                  key={match.id}
                  match={match}
                  player1Name={data.player1.name}
                />
              ))}
          </CardContent>
        </GlassCard>
      )}
    </Box>
  );
}

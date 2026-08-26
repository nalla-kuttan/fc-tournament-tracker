'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import GlassCard from '@/components/shared/GlassCard';
import EmptyState from '@/components/shared/EmptyState';
import StatLeaderboard from '@/components/analytics/StatLeaderboard';
import BiggestWinsTable from '@/components/analytics/BiggestWinsTable';
import SeasonAwards from '@/components/analytics/SeasonAwards';
import AdvancedHighlights from '@/components/analytics/AdvancedHighlights';
import BackButton from '@/components/shared/BackButton';
import type { CareerStats, Match } from '@/lib/types';
import { hasTimedGoals } from '@/lib/analytics-visibility';
import { calculatePerformanceRecords } from '@/lib/records';
import type { PerformanceRecords } from '@/lib/records/types';
import {
  getClutchRankings,
  getFormRankings,
  getPowerRankings,
  getTeamAnalytics,
  getUpsets,
  type GoalLite,
} from '@/lib/analytics-insights';
import dynamic from 'next/dynamic';

const GoalDistributionChart = dynamic(() => import('@/components/analytics/GoalDistributionChart'), {
  ssr: false,
  loading: () => <CircularProgress size={24} sx={{ mx: 'auto', display: 'block' }} />
});

const PerformanceTrendChart = dynamic(() => import('@/components/analytics/PerformanceTrendChart'), {
  ssr: false,
  loading: () => <CircularProgress size={24} sx={{ mx: 'auto', display: 'block' }} />
});

interface BigWin {
  match_id: string;
  home_player: string;
  away_player: string;
  home_score: number;
  away_score: number;
  goal_difference: number;
  winner: string;
  tournament_name: string;
  played_at: string | null;
}

interface GlobalData {
  career_stats: CareerStats[];
  top_scorers: CareerStats[];
  biggest_wins: BigWin[];
  xg_rankings: CareerStats[];
  win_rate_rankings: CareerStats[];
  goals_per_match_rankings: CareerStats[];
  possession_rankings: CareerStats[];
  rating_rankings: CareerStats[];
  motm_rankings: CareerStats[];
  clean_sheet_rankings: CareerStats[];
  all_matches: Match[];
  all_goals: GoalLite[];
  registered_players: { id: string; name: string; base_team: string }[];
  player_instances: { id: string; tournament_id: string; registered_player_id: string; name: string; team: string }[];
}

function filterPerformanceRecords(records: PerformanceRecords, eligiblePlayerIds: Set<string>): PerformanceRecords {
  const eligible = (rows: PerformanceRecords[keyof PerformanceRecords]) => rows.filter((row) => eligiblePlayerIds.has(row.playerId));
  return {
    finishingEfficiency: eligible(records.finishingEfficiency),
    xgOverperformance: eligible(records.xgOverperformance),
    defensiveXgOverperformance: eligible(records.defensiveXgOverperformance),
    counterpunchWinRate: eligible(records.counterpunchWinRate),
    motmRate: eligible(records.motmRate),
    defensiveWorkRate: eligible(records.defensiveWorkRate),
    ratingConsistency: eligible(records.ratingConsistency),
    expectedPointsSurplus: eligible(records.expectedPointsSurplus),
    pressurePerformance: eligible(records.pressurePerformance),
  };
}

function toLeaderboard(stats: CareerStats[], valueFn: (s: CareerStats) => string) {
  return stats.map((s, i) => ({
    rank: i + 1,
    name: s.player_name,
    team: s.base_team,
    value: valueFn(s),
  }));
}

export default function GlobalAnalyticsPage() {
  const [query, setQuery] = useState('');
  const [minMatches, setMinMatches] = useState(0);
  const [format, setFormat] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [nowMs] = useState(() => Date.now());
  const { data, error, isLoading: loading, mutate } = useSWR<GlobalData>('/api/analytics/global', fetcher, { onError: () => undefined });

  const filteredMatches = useMemo(() => {
    if (!data) return [];
    const days = dateRange === '30' ? 30 : dateRange === '90' ? 90 : null;
    return data.all_matches.filter((match) => {
      const tournamentFormat = match.tournament && 'format' in match.tournament ? String(match.tournament.format) : '';
      const passesFormat = format === 'all' || tournamentFormat === format;
      const playedAt = match.played_at ? new Date(match.played_at).getTime() : 0;
      const passesDate = !days || !nowMs || (playedAt > 0 && nowMs - playedAt <= days * 24 * 60 * 60 * 1000);
      return passesFormat && passesDate;
    });
  }, [data, dateRange, format, nowMs]);

  const filteredGoals = useMemo(() => {
    if (!data) return [];
    const matchIds = new Set(filteredMatches.map((match) => match.id));
    return data.all_goals.filter((goal) => matchIds.has(goal.match_id));
  }, [data, filteredMatches]);

  const filteredStats = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLowerCase();
    return data.career_stats.filter((stat) => {
      const passesSearch = !normalized || `${stat.player_name} ${stat.base_team}`.toLowerCase().includes(normalized);
      return passesSearch && stat.total_matches >= minMatches;
    });
  }, [data, minMatches, query]);
  const hasTimedGoalData = useMemo(() => hasTimedGoals(filteredGoals), [filteredGoals]);
  const advancedPerformance = useMemo(() => {
    if (!data) return null;
    const records = calculatePerformanceRecords(data.registered_players, data.player_instances, filteredMatches);
    const eligiblePlayerIds = new Set(filteredStats.map((stat) => stat.registered_player_id));
    return filterPerformanceRecords(records, eligiblePlayerIds);
  }, [data, filteredMatches, filteredStats]);

  const powerRankings = useMemo(
    () => data ? getPowerRankings(data.registered_players, data.player_instances, filteredMatches) : [],
    [data, filteredMatches]
  );
  const formRankings = useMemo(
    () => data ? getFormRankings(data.registered_players, data.player_instances, filteredMatches) : [],
    [data, filteredMatches]
  );
  const teamAnalytics = useMemo(() => getTeamAnalytics(filteredMatches), [filteredMatches]);
  const clutchRankings = useMemo(
    () => data && hasTimedGoalData ? getClutchRankings(filteredGoals, data.player_instances, data.registered_players) : [],
    [data, filteredGoals, hasTimedGoalData]
  );
  const upsets = useMemo(
    () => data ? getUpsets(filteredMatches, data.registered_players, data.player_instances) : [],
    [data, filteredMatches]
  );
  const latestMatch = useMemo(
    () => [...filteredMatches].filter((match) => match.is_played && !match.is_bye).sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''))[0],
    [filteredMatches]
  );
  const topStoryCards = useMemo(() => {
    const powerLeader = powerRankings[0];
    const formLeader = formRankings[0];
    const topScorer = filteredStats.slice().sort((a, b) => b.total_goals - a.total_goals)[0];
    return [
      {
        label: 'Control Room Read',
        value: powerLeader?.player.name ?? '-',
        detail: powerLeader ? `${powerLeader.rating} power rating` : 'No power ranking yet',
        color: '#3B82F6',
      },
      {
        label: 'Hot Form',
        value: formLeader?.player.name ?? '-',
        detail: formLeader?.form.length ? `Last five: ${formLeader.form.join('')}` : 'No recent run yet',
        color: '#22C55E',
      },
      {
        label: 'Goal Threat',
        value: topScorer?.player_name ?? '-',
        detail: topScorer ? `${topScorer.total_goals} career goals` : 'No goals recorded',
        color: '#F59E0B',
      },
      {
        label: 'Latest Result',
        value: latestMatch ? `${latestMatch.home_score}-${latestMatch.away_score}` : '-',
        detail: latestMatch ? `${latestMatch.home_player?.name ?? 'Home'} vs ${latestMatch.away_player?.name ?? 'Away'}` : 'No played match in this lens',
        color: '#94A3B8',
      },
    ];
  }, [filteredStats, formRankings, latestMatch, powerRankings]);

  if (loading) {
    return (
      <Box aria-label="Loading global analytics" sx={{ py: 2 }}>
        <Skeleton width={220} height={46} />
        <Skeleton width={360} height={28} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 3 }}>
          {[1, 2, 3].map((item) => <Skeleton key={item} variant="rounded" height={180} />)}
        </Box>
      </Box>
    );
  }

  if (error && !data) {
    return (
      <Box>
        <BackButton />
        <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
          Global Analytics
        </Typography>
        <Alert
          severity="error"
          action={<Button color="inherit" startIcon={<RefreshIcon />} onClick={() => void mutate()}>Retry</Button>}
          sx={{ maxWidth: 760 }}
        >
          {error instanceof Error ? error.message : 'Analytics could not be loaded.'}
        </Alert>
      </Box>
    );
  }

  if (!data || !data.career_stats || data.career_stats.length === 0) {
    return (
      <Box>
        <BackButton />
        <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
          Global Analytics
        </Typography>
        <EmptyState
          icon={<SportsSoccerIcon fontSize="inherit" />}
          title="Your analytics story starts after kickoff"
          description="Create a tournament and record the first result to unlock rankings, form, records, and match trends."
          action={
            <Button component={Link} href="/tournaments/new" variant="contained">
              Create Tournament
            </Button>
          }
        />
      </Box>
    );
  }

  return (
    <Box>
      <BackButton />
      <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
        Global Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        All-time career stats and rankings across every tournament
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 150px 150px 150px' }, gap: 1.5, mb: 3 }}>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search players or teams"
          size="small"
        />
        <FormControl size="small">
          <InputLabel>Format</InputLabel>
          <Select value={format} label="Format" onChange={(event) => setFormat(event.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="league">League</MenuItem>
            <MenuItem value="knockout">Knockout</MenuItem>
            <MenuItem value="cup">Cup</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Range</InputLabel>
          <Select value={dateRange} label="Range" onChange={(event) => setDateRange(event.target.value)}>
            <MenuItem value="all">All time</MenuItem>
            <MenuItem value="30">Last 30d</MenuItem>
            <MenuItem value="90">Last 90d</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Min MP</InputLabel>
          <Select value={String(minMatches)} label="Min MP" onChange={(event) => setMinMatches(Number(event.target.value))}>
            <MenuItem value="0">0</MenuItem>
            <MenuItem value="3">3</MenuItem>
            <MenuItem value="5">5</MenuItem>
            <MenuItem value="10">10</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip size="small" label={`${filteredMatches.length} matches`} />
        <Chip size="small" label={`${filteredGoals.length} goals`} />
        <Chip size="small" label={`${filteredStats.length} ranked players`} />
      </Box>

      <GlassCard sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' }, mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                What matters now
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current read for this analytics lens before the deep tables.
              </Typography>
            </Box>
            <Chip size="small" label={format === 'all' ? 'All formats' : format} sx={{ color: '#22C55E', borderColor: 'rgba(34, 197, 94, 0.24)' }} />
          </Box>
          <Grid container spacing={1.5}>
            {topStoryCards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    height: '100%',
                    borderRadius: '12px',
                    bgcolor: 'rgba(2, 6, 23, 0.32)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} noWrap sx={{ mt: 0.5, color: card.color }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                    {card.detail}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </GlassCard>

      {/* Season Awards */}
      <SeasonAwards stats={filteredStats} />

      {advancedPerformance ? <AdvancedHighlights records={advancedPerformance} /> : null}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: hasTimedGoalData ? 4 : 6 }}>
          <StatLeaderboard
            title="Power Rankings"
            valueLabel="Power"
            entries={powerRankings.slice(0, 8).map((row) => ({
              rank: row.rank,
              name: row.player.name,
              team: row.player.base_team,
              value: String(row.rating),
            }))}
            accentColor="#3B82F6"
          />
        </Grid>
        <Grid size={{ xs: 12, md: hasTimedGoalData ? 4 : 6 }}>
          <StatLeaderboard
            title="Recent Form"
            valueLabel="Last 5"
            entries={formRankings.slice(0, 8).map((row, index) => ({
              rank: index + 1,
              name: row.player.name,
              team: row.player.base_team,
              value: row.form.join(''),
            }))}
            accentColor="#22C55E"
          />
        </Grid>
        {hasTimedGoalData ? (
          <Grid size={{ xs: 12, md: 4 }}>
            <StatLeaderboard
              title="Clutch Goals"
              valueLabel="Score"
              entries={clutchRankings.slice(0, 8).map((row, index) => ({
                rank: index + 1,
                name: row.playerName,
                team: row.team,
                value: `${row.clutchScore}`,
              }))}
              accentColor="#F59E0B"
            />
          </Grid>
        ) : null}
      </Grid>

      {/* Career Overview Table */}
      <GlassCard sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            All-Time Career Stats
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 700 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
                {['Player', 'P', 'W', 'D', 'L', 'GF', 'GA', 'CS', 'Win%', 'G/M', 'xG', 'Rtg', 'Poss%', 'MOTM'].map((h) => (
                  <Typography
                    key={h}
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{
                      width: h === 'Player' ? 140 : 56,
                      flexShrink: h === 'Player' ? 0 : undefined,
                      textAlign: h === 'Player' ? 'left' : 'center',
                      px: 0.5,
                    }}
                  >
                    {h}
                  </Typography>
                ))}
              </Box>
              {/* Rows */}
              {filteredStats
                .sort((a, b) => b.win_rate - a.win_rate || b.total_matches - a.total_matches)
                .map((s) => (
                  <Box
                    key={s.registered_player_id}
                    sx={{
                      display: 'flex',
                      py: 1,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      '&:hover': { bgcolor: 'rgba(59,130,246,0.04)' },
                    }}
                  >
                    <Box sx={{ width: 140, flexShrink: 0, px: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{s.player_name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{s.base_team}</Typography>
                    </Box>
                    {[
                      s.total_matches,
                      s.wins,
                      s.draws,
                      s.losses,
                      s.total_goals,
                      s.total_conceded,
                      s.clean_sheets,
                      `${s.win_rate.toFixed(0)}%`,
                      s.goals_per_match.toFixed(2),
                      s.avg_xg.toFixed(2),
                      s.avg_rating.toFixed(1),
                      `${s.avg_possession.toFixed(0)}%`,
                      s.motm_awards,
                    ].map((val, i) => (
                      <Typography
                        key={i}
                        variant="body2"
                        sx={{ width: 56, textAlign: 'center', fontFamily: 'monospace', px: 0.5 }}
                      >
                        {val}
                      </Typography>
                    ))}
                  </Box>
                ))}
            </Box>
          </Box>
        </CardContent>
      </GlassCard>

      {/* Leaderboard Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Top Scorers"
            valueLabel="Goals"
            entries={toLeaderboard(data.top_scorers, (s) => String(s.total_goals))}
            accentColor="#22C55E"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Win Rate"
            valueLabel="Rate"
            entries={toLeaderboard(data.win_rate_rankings, (s) => `${s.win_rate.toFixed(0)}%`)}
            accentColor="#F59E0B"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Goals Per Match"
            valueLabel="G/M"
            entries={toLeaderboard(data.goals_per_match_rankings, (s) => s.goals_per_match.toFixed(2))}
            accentColor="#22C55E"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Avg xG"
            valueLabel="xG"
            entries={toLeaderboard(data.xg_rankings, (s) => s.avg_xg.toFixed(2))}
            accentColor="#3B82F6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Possession"
            valueLabel="Avg%"
            entries={toLeaderboard(data.possession_rankings, (s) => `${s.avg_possession.toFixed(0)}%`)}
            accentColor="#22C55E"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Avg Rating"
            valueLabel="Rtg"
            entries={toLeaderboard(data.rating_rankings, (s) => s.avg_rating.toFixed(1))}
            accentColor="#F59E0B"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Clean Sheets"
            valueLabel="CS"
            entries={toLeaderboard(data.clean_sheet_rankings, (s) => String(s.clean_sheets))}
            accentColor="#22C55E"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="MOTM Awards"
            valueLabel="Awards"
            entries={toLeaderboard(data.motm_rankings, (s) => String(s.motm_awards))}
            accentColor="#F59E0B"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <StatLeaderboard
            title="Team Performance"
            valueLabel="WR"
            entries={teamAnalytics.slice(0, 8).map((row, index) => ({
              rank: index + 1,
              name: row.team,
              team: `${row.matches} matches · ${row.goalsFor}-${row.goalsAgainst}`,
              value: `${row.winRate.toFixed(0)}%`,
            }))}
            accentColor="#3B82F6"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StatLeaderboard
            title="Biggest Upsets"
            valueLabel="Gap"
            entries={upsets.slice(0, 8).map((row, index) => ({
              rank: index + 1,
              name: row.winnerName,
              team: `beat ${row.loserName}`,
              value: `+${row.ratingGap}`,
            }))}
            accentColor="#EF4444"
          />
        </Grid>
      </Grid>

      {/* Goal Distribution by Minute */}
      {hasTimedGoalData && (
        <GlassCard sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Goal Distribution by Minute
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <GoalDistributionChart goals={filteredGoals} />
          </CardContent>
        </GlassCard>
      )}

      {/* Performance Trend */}
      {filteredMatches.length > 0 && (
        <GlassCard sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Performance Trend
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Match ratings over time for each player
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <PerformanceTrendChart
              matches={filteredMatches}
              registeredPlayers={data.registered_players ?? []}
              playerInstances={data.player_instances ?? []}
            />
          </CardContent>
        </GlassCard>
      )}

      {/* Biggest Wins */}
      <BiggestWinsTable wins={data.biggest_wins} title="Biggest Wins (All Time)" />
    </Box>
  );
}

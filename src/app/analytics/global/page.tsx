'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import GlassCard from '@/components/shared/GlassCard';
import StatLeaderboard from '@/components/analytics/StatLeaderboard';
import BiggestWinsTable from '@/components/analytics/BiggestWinsTable';
import type { CareerStats } from '@/lib/types';

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
  const [data, setData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/global')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.career_stats.length === 0) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Global Analytics
        </Typography>
        <Typography color="text.secondary">No match data available yet. Play some matches first!</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Global Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        All-time career stats and rankings across every tournament
      </Typography>

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
              <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
              {data.career_stats
                .sort((a, b) => b.win_rate - a.win_rate || b.total_matches - a.total_matches)
                .map((s) => (
                <Box
                  key={s.registered_player_id}
                  sx={{
                    display: 'flex',
                    py: 1,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    '&:hover': { bgcolor: 'rgba(0,212,255,0.04)' },
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
            accentColor="#34C759"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Win Rate"
            valueLabel="Rate"
            entries={toLeaderboard(data.win_rate_rankings, (s) => `${s.win_rate.toFixed(0)}%`)}
            accentColor="#FF9F0A"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Goals Per Match"
            valueLabel="G/M"
            entries={toLeaderboard(data.goals_per_match_rankings, (s) => s.goals_per_match.toFixed(2))}
            accentColor="#0A84FF"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Avg xG"
            valueLabel="xG"
            entries={toLeaderboard(data.xg_rankings, (s) => s.avg_xg.toFixed(2))}
            accentColor="#BF5AF2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Possession"
            valueLabel="Avg%"
            entries={toLeaderboard(data.possession_rankings, (s) => `${s.avg_possession.toFixed(0)}%`)}
            accentColor="#0A84FF"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Avg Rating"
            valueLabel="Rtg"
            entries={toLeaderboard(data.rating_rankings, (s) => s.avg_rating.toFixed(1))}
            accentColor="#FF9F0A"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="Clean Sheets"
            valueLabel="CS"
            entries={toLeaderboard(data.clean_sheet_rankings, (s) => String(s.clean_sheets))}
            accentColor="#34C759"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatLeaderboard
            title="MOTM Awards"
            valueLabel="Awards"
            entries={toLeaderboard(data.motm_rankings, (s) => String(s.motm_awards))}
            accentColor="#FF9F0A"
          />
        </Grid>
      </Grid>

      {/* Biggest Wins */}
      <BiggestWinsTable wins={data.biggest_wins} title="Biggest Wins (All Time)" />
    </Box>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import GlassCard from '@/components/shared/GlassCard';
import StatLeaderboard from '@/components/analytics/StatLeaderboard';
import BiggestWinsTable from '@/components/analytics/BiggestWinsTable';
import BackButton from '@/components/shared/BackButton';
import type { Tournament } from '@/lib/types';

interface PlayerStat {
  player_id: string;
  player_name: string;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  goals_from_score: number;
  conceded: number;
  clean_sheets: number;
  points: number;
  win_rate: number;
  goals_per_match: number;
  avg_xg: number;
  avg_rating: number;
  avg_possession: number;
  motm_awards: number;
}

interface BigWin {
  match_id: string;
  home_player: string;
  away_player: string;
  home_score: number;
  away_score: number;
  goal_difference: number;
  winner: string;
  played_at: string | null;
}

interface LeagueData {
  tournament: Tournament;
  player_stats: PlayerStat[];
  top_scorers: PlayerStat[];
  biggest_wins: BigWin[];
  xg_rankings: PlayerStat[];
  win_rate_rankings: PlayerStat[];
  goals_per_match_rankings: PlayerStat[];
  possession_rankings: PlayerStat[];
  rating_rankings: PlayerStat[];
  motm_rankings: PlayerStat[];
}

function toLeaderboard(stats: PlayerStat[], valueFn: (s: PlayerStat) => string) {
  return stats.map((s, i) => ({
    rank: i + 1,
    name: s.player_name,
    team: s.team,
    value: valueFn(s),
  }));
}

export default function LeagueAnalyticsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [data, setData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.json())
      .then((t: Tournament[]) => {
        const active = t.filter((x) => x.status === 'active' || x.status === 'completed');
        setTournaments(active);
        if (active.length > 0) {
          setSelectedId(active[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setDataLoading(true);
    fetch(`/api/analytics/league/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [selectedId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Box>
        <BackButton />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          League Analytics
        </Typography>
        <Typography color="text.secondary">No active or completed tournaments found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <BackButton />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            League Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tournament-specific stats and rankings
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Tournament</InputLabel>
          <Select
            value={selectedId}
            label="Tournament"
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {tournaments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name} ({t.format})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {dataLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <>
          {/* Player Stats Table */}
          <GlassCard sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Player Stats &mdash; {data.tournament.name}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 650 }}>
                  <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Player', 'P', 'W', 'D', 'L', 'GF', 'GA', 'CS', 'Pts', 'Win%', 'G/M', 'xG', 'Rtg', 'Poss%'].map((h) => (
                      <Typography
                        key={h}
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{
                          width: h === 'Player' ? 120 : 50,
                          flexShrink: h === 'Player' ? 0 : undefined,
                          textAlign: h === 'Player' ? 'left' : 'center',
                          px: 0.5,
                        }}
                      >
                        {h}
                      </Typography>
                    ))}
                  </Box>
                  {data.player_stats.map((s) => (
                    <Box
                      key={s.player_id}
                      sx={{
                        display: 'flex',
                        py: 1,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        '&:hover': { bgcolor: 'rgba(0,212,255,0.04)' },
                      }}
                    >
                      <Box sx={{ width: 120, flexShrink: 0, px: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{s.player_name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{s.team}</Typography>
                      </Box>
                      {[
                        s.played,
                        s.wins,
                        s.draws,
                        s.losses,
                        s.goals_from_score,
                        s.conceded,
                        s.clean_sheets,
                        s.points,
                        `${s.win_rate.toFixed(0)}%`,
                        s.goals_per_match.toFixed(2),
                        s.avg_xg.toFixed(2),
                        s.avg_rating.toFixed(1),
                        `${s.avg_possession.toFixed(0)}%`,
                      ].map((val, i) => (
                        <Typography
                          key={i}
                          variant="body2"
                          sx={{ width: 50, textAlign: 'center', fontFamily: 'monospace', px: 0.5 }}
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

          {/* Leaderboards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatLeaderboard
                title="Top Scorers"
                valueLabel="Goals"
                entries={toLeaderboard(data.top_scorers, (s) => String(s.goals))}
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
          </Grid>

          {/* Biggest Wins */}
          <BiggestWinsTable wins={data.biggest_wins} />
        </>
      ) : null}
    </Box>
  );
}

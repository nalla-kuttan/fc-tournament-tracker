'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CardContent from '@mui/material/CardContent';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import TournamentCard from '@/components/tournament/TournamentCard';
import GlassCard from '@/components/shared/GlassCard';
import EmptyState from '@/components/shared/EmptyState';
import type { Tournament } from '@/lib/types';

interface HallOfFameEntry {
  tournament_id: string;
  tournament_name: string;
  tournament_format: string;
  completed_at: string;
  winner_name: string;
  winner_team: string;
  registered_player_id: string | null;
  stats: Record<string, number | string>;
}

export default function HomePage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tournaments').then((r) => r.json()),
      fetch('/api/analytics/hall-of-fame').then((r) => r.json()),
    ])
      .then(([t, hof]) => {
        setTournaments(t);
        setHallOfFame(hof);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box>
      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <MilitaryTechIcon sx={{ fontSize: 32, color: '#ffd700' }} />
            <Typography variant="h5" fontWeight={700}>
              Hall of Fame
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {hallOfFame.map((entry) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={entry.tournament_id}>
                <GlassCard
                  sx={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(168,85,247,0.08) 100%)',
                    borderColor: 'rgba(255,215,0,0.2)',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'rgba(255,215,0,0.4)', transform: 'translateY(-4px)' },
                  }}
                  onClick={() => router.push(`/tournaments/${entry.tournament_id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={1}>
                        {entry.tournament_name}
                      </Typography>
                      <Chip
                        label={entry.tournament_format}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,215,0,0.15)', color: '#ffd700', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <EmojiEventsIcon sx={{ fontSize: 36, color: '#ffd700' }} />
                      <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#ffd700' }}>
                          {entry.winner_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.winner_team}
                        </Typography>
                      </Box>
                    </Box>
                    {entry.stats.points != null && (
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {entry.stats.played}P {entry.stats.wins}W {entry.stats.draws}D {entry.stats.losses}L
                        </Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#ffd700' }}>
                          {entry.stats.points} pts
                        </Typography>
                      </Box>
                    )}
                    {entry.stats.final_score && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                        Final: {entry.stats.final_score}
                      </Typography>
                    )}
                  </CardContent>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 4 }} />
        </Box>
      )}

      {/* Tournaments */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Tournaments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your FC tournament competitions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/tournaments/new')}
        >
          New Tournament
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={<EmojiEventsIcon sx={{ fontSize: 64 }} />}
          title="No tournaments yet"
          description="Create your first tournament to get started tracking matches and stats."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/tournaments/new')}>
              Create Tournament
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {tournaments.map((t) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.id}>
              <TournamentCard tournament={t} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

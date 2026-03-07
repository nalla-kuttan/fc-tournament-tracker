'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MatchCard from '@/components/tournament/MatchCard';
import StandingsTable from '@/components/tournament/StandingsTable';
import BracketView from '@/components/tournament/BracketView';
import AdminGate from '@/components/auth/AdminGate';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AIPunditModal from '@/components/ai/AIPunditModal';
import { useAdmin } from '@/contexts/AdminContext';
import type { Match, StandingRow } from '@/lib/types';

export default function TournamentDashboard() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const { getPinForTournament } = useAdmin();

  const { data: tournament, isLoading: loadingTournament } = useSWR<{
    format: string;
    status: string;
    matches: Match[];
    players: { id: string; name: string; team: string }[];
  }>(`/api/tournaments/${tournamentId}`, fetcher);

  const { data: standings = [], isLoading: loadingStandings } = useSWR<StandingRow[]>(`/api/tournaments/${tournamentId}/standings`, fetcher);

  const loading = loadingTournament || loadingStandings;
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [punditOpen, setPunditOpen] = useState(false);

  const handleGenerateSchedule = async () => {
    const pin = getPinForTournament(tournamentId);
    if (!pin) return;
    setGenerating(true);
    setError('');

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate schedule');
      }
      mutate(`/api/tournaments/${tournamentId}`);
      mutate(`/api/tournaments/${tournamentId}/standings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournament) return null;

  const hasMatches = tournament.matches && tournament.matches.length > 0;
  const recentMatches = (tournament.matches ?? [])
    .filter((m) => m.is_played && !m.is_bye)
    .sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''))
    .slice(0, 3);
  const upcomingMatches = (tournament.matches ?? [])
    .filter((m) => !m.is_played && !m.is_bye)
    .slice(0, 3);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!hasMatches && (
        <GlassCard sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 32, color: '#22C55E' }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Ready to start?
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              {tournament.players?.length ?? 0} players registered. Generate the schedule to begin.
            </Typography>
            <AdminGate tournamentId={tournamentId}>
              <Button
                variant="contained"
                size="large"
                startIcon={generating ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={handleGenerateSchedule}
                disabled={generating || (tournament.players?.length ?? 0) < 2}
              >
                Generate Schedule
              </Button>
            </AdminGate>
          </CardContent>
        </GlassCard>
      )}

      {hasMatches && (
        <Grid container spacing={3}>
          {/* Standings / Bracket Preview */}
          <Grid size={{ xs: 12, md: 8 }}>
            {tournament.format !== 'knockout' ? (
              <Box className="animate-section">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
                    Standings
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => setPunditOpen(true)}
                    sx={{
                      color: '#F59E0B',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                      '&:hover': {
                        borderColor: '#F59E0B',
                        bgcolor: 'rgba(245, 158, 11, 0.08)',
                      },
                    }}
                  >
                    AI Summary
                  </Button>
                </Box>
                <StandingsTable standings={standings} />
              </Box>
            ) : (
              <Box className="animate-section">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
                    Bracket
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => setPunditOpen(true)}
                    sx={{
                      color: '#F59E0B',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                      '&:hover': {
                        borderColor: '#F59E0B',
                        bgcolor: 'rgba(245, 158, 11, 0.08)',
                      },
                    }}
                  >
                    AI Summary
                  </Button>
                </Box>
                <BracketView
                  matches={tournament.matches as never[]}
                  onMatchClick={(id) => router.push(`/tournaments/${tournamentId}/matches/${id}`)}
                />
              </Box>
            )}
          </Grid>

          {/* Recent & Upcoming */}
          <Grid size={{ xs: 12, md: 4 }}>
            {upcomingMatches.length > 0 && (
              <Box className="animate-section" sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748B',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    mb: 1.5,
                  }}
                >
                  Upcoming
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {upcomingMatches.map((m) => (
                    <MatchCard key={m.id} match={m as never} />
                  ))}
                </Box>
              </Box>
            )}

            {recentMatches.length > 0 && (
              <Box className="animate-section">
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748B',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    mb: 1.5,
                  }}
                >
                  Recent Results
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentMatches.map((m) => (
                    <MatchCard key={m.id} match={m as never} />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      {/* AI Pundit Modal */}
      <AIPunditModal
        open={punditOpen}
        onClose={() => setPunditOpen(false)}
        tournament={tournament}
        standings={standings}
        matches={tournament.matches}
      />
    </Box>
  );
}

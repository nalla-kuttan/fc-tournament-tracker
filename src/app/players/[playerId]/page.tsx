'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import PersonIcon from '@mui/icons-material/Person';
import GlassCard from '@/components/shared/GlassCard';
import Button from '@mui/material/Button';
import DescriptionIcon from '@mui/icons-material/Description';
import PlayerStatsGrid from '@/components/player/PlayerStatsGrid';
import WDLDoughnut from '@/components/analytics/WDLDoughnut';
import AIScoutModal from '@/components/ai/AIScoutModal';
import SingleRadarChart from '@/components/analytics/SingleRadarChart';
import FormMomentumChart from '@/components/analytics/FormMomentumChart';
import BackButton from '@/components/shared/BackButton';
import type { CareerStats, Match, RegisteredPlayer } from '@/lib/types';

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [player, setPlayer] = useState<RegisteredPlayer & { participations?: { tournament: { id: string; name: string; format: string; status: string } }[] } | null>(null);
  const [stats, setStats] = useState<CareerStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoutOpen, setScoutOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/players/${playerId}`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/stats`).then((r) => r.json()),
    ])
      .then(([p, s]) => {
        setPlayer(p);
        setStats(s.stats);
        setMatches(s.matches ?? []);
        setPlayerIds(s.playerIds ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!player) {
    return <Typography color="error">Player not found</Typography>;
  }

  return (
    <Box>
      <BackButton />
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <PersonIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {player.name}
          </Typography>
          <Chip label={player.base_team} variant="outlined" />
        </Box>
      </Box>

      {/* Career Stats */}
      {stats && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Career Stats
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DescriptionIcon />}
              onClick={() => setScoutOpen(true)}
              sx={{ color: '#0A84FF', borderColor: 'rgba(10,132,255,0.5)', '&:hover': { borderColor: '#0A84FF', bgcolor: 'rgba(10,132,255,0.1)' } }}
            >
              AI Scout Report
            </Button>
          </Box>
          <PlayerStatsGrid stats={stats} />
        </Box>
      )}

      {/* Performance Overview Charts */}
      {stats && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Performance Overview
          </Typography>
          <Grid container spacing={3}>
            {/* WDL Doughnut */}
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ height: '100%' }}>
                <CardContent>
                  <WDLDoughnut stats={stats} title="Win/Draw/Loss" />
                </CardContent>
              </GlassCard>
            </Grid>

            {/* Attribute Radar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Attribute Overview
                  </Typography>
                  <SingleRadarChart stats={stats} />
                </CardContent>
              </GlassCard>
            </Grid>

            {/* Form Momentum */}
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ height: '100%' }}>
                <CardContent>
                  <FormMomentumChart
                    matches={matches}
                    playerIds={new Set(playerIds)}
                    title="Form Momentum"
                  />
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tournament History */}
      {player.participations && player.participations.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Tournament History
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {player.participations.map((p, idx) => (
              <Chip
                key={idx}
                label={p.tournament?.name ?? 'Unknown'}
                clickable
                color={p.tournament?.status === 'active' ? 'primary' : 'default'}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* AI Scout Modal */}
      {player && stats && (
        <AIScoutModal
          open={scoutOpen}
          onClose={() => setScoutOpen(false)}
          player={player}
          stats={stats}
        />
      )}
    </Box>
  );
}

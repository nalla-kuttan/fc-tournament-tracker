'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
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
import AIScoutModal from '@/components/ai/AIScoutModal';
import BackButton from '@/components/shared/BackButton';
import type { CareerStats, Match, RegisteredPlayer } from '@/lib/types';
import dynamic from 'next/dynamic';

const WDLDoughnut = dynamic(() => import('@/components/analytics/WDLDoughnut'), { ssr: false, loading: () => <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} /> });
const SingleRadarChart = dynamic(() => import('@/components/analytics/SingleRadarChart'), { ssr: false, loading: () => <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} /> });
const FormMomentumChart = dynamic(() => import('@/components/analytics/FormMomentumChart'), { ssr: false, loading: () => <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} /> });

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [scoutOpen, setScoutOpen] = useState(false);

  const { data: player, isLoading: loadingPlayer } = useSWR<RegisteredPlayer & { participations?: { tournament: { id: string; name: string; format: string; status: string } }[] }>(`/api/players/${playerId}`, fetcher);
  const { data: statsData, isLoading: loadingStats } = useSWR<{ stats: CareerStats, matches: Match[], playerIds: string[] }>(`/api/players/${playerId}/stats`, fetcher);

  const loading = loadingPlayer || loadingStats;
  const stats = statsData?.stats || null;
  const matches = statsData?.matches || [];
  const playerIds = statsData?.playerIds || [];

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

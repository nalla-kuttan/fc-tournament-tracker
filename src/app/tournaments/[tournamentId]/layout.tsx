'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import TournamentTabs from '@/components/layout/TournamentTabs';
import RealtimeProvider from '@/components/shared/RealtimeProvider';
import BackButton from '@/components/shared/BackButton';
import SavedResultNotice from '@/components/tournament/SavedResultNotice';
import { TOURNAMENT_STATUSES } from '@/lib/constants';
import { getSeasonKit } from '@/lib/season-theme';
import SeasonThemeProvider from '@/components/tournament/SeasonThemeProvider';
import type { Tournament } from '@/lib/types';

export default function TournamentLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}`)
      .then((r) => r.json())
      .then((data) => {
        setTournament(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: 'rgba(201, 185, 190, 0.05)' }} />
        <Skeleton variant="rounded" height={48} sx={{ mt: 2, mb: 3, bgcolor: 'rgba(201, 185, 190, 0.05)' }} />
        <Skeleton variant="rounded" height={400} sx={{ bgcolor: 'rgba(201, 185, 190, 0.05)' }} />
      </Box>
    );
  }

  if (!tournament) {
    return <Typography color="error">Tournament not found</Typography>;
  }

  const statusConfig = TOURNAMENT_STATUSES[tournament.status];
  const kit = getSeasonKit({ id: tournamentId, name: tournament.name });

  return (
    <RealtimeProvider tournamentId={tournamentId}>
      <SeasonThemeProvider tournament={{ id: tournamentId, name: tournament.name }}>
      <Box>
        <BackButton />
        <Box className="animate-section" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary' }}>
            {tournament.name}
          </Typography>
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              bgcolor: `${statusConfig.color}15`,
              color: statusConfig.color,
              fontWeight: 600,
              border: `1px solid ${statusConfig.color}25`,
              letterSpacing: '0.02em',
            }}
          />
          <Chip
            label={`${kit.name} kit`}
            size="small"
            variant="outlined"
            sx={{ color: kit.accentLight, borderColor: `${kit.accent}66`, fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
          />
        </Box>

        <Box aria-hidden sx={{ height: 4, borderRadius: 2, background: kit.stripe, mb: 2, boxShadow: `0 0 18px ${kit.accent}55` }} />

        <TournamentTabs tournamentId={tournamentId} format={tournament.format} />

        {children}
      </Box>
      <SavedResultNotice />
      </SeasonThemeProvider>
    </RealtimeProvider>
  );
}

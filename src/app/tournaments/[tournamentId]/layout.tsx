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
import { TOURNAMENT_STATUSES } from '@/lib/constants';
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
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rounded" height={48} sx={{ mt: 2, mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!tournament) {
    return <Typography color="error">Tournament not found</Typography>;
  }

  const statusConfig = TOURNAMENT_STATUSES[tournament.status];

  return (
    <RealtimeProvider tournamentId={tournamentId}>
      <Box>
        <BackButton />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            {tournament.name}
          </Typography>
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              bgcolor: `${statusConfig.color}20`,
              color: statusConfig.color,
              fontWeight: 600,
            }}
          />
        </Box>

        <TournamentTabs tournamentId={tournamentId} format={tournament.format} />

        {children}
      </Box>
    </RealtimeProvider>
  );
}

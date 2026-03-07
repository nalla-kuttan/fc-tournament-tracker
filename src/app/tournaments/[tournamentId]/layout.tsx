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
        <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: 'rgba(148, 163, 184, 0.05)' }} />
        <Skeleton variant="rounded" height={48} sx={{ mt: 2, mb: 3, bgcolor: 'rgba(148, 163, 184, 0.05)' }} />
        <Skeleton variant="rounded" height={400} sx={{ bgcolor: 'rgba(148, 163, 184, 0.05)' }} />
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
        <Box className="animate-section" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              background: 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
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
        </Box>

        <TournamentTabs tournamentId={tournamentId} format={tournament.format} />

        {children}
      </Box>
    </RealtimeProvider>
  );
}

'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StandingsTable from '@/components/tournament/StandingsTable';
import type { StandingRow } from '@/lib/types';
import PageSkeleton from '@/components/shared/PageSkeleton';

export default function StandingsPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  // Same key as the overview page, so switching tabs reuses the cached standings.
  const { data: standings = [], isLoading } = useSWR<StandingRow[]>(`/api/tournaments/${tournamentId}/standings`, { onError: () => undefined });

  if (isLoading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <Box>
      <Typography component="h1" variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        League Standings
      </Typography>
      {standings.length === 0 ? (
        <Typography color="text.secondary">No matches played yet.</Typography>
      ) : (
        <StandingsTable standings={standings} />
      )}
    </Box>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import StandingsTable from '@/components/tournament/StandingsTable';
import type { StandingRow } from '@/lib/types';

export default function StandingsPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/standings`)
      .then((r) => r.json())
      .then((data) => {
        setStandings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
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

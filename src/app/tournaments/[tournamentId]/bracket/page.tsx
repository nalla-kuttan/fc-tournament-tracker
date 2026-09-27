'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BracketView from '@/components/tournament/BracketView';
import PageSkeleton from '@/components/shared/PageSkeleton';

export default function BracketPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/bracket`)
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <Box>
      <Typography component="h1" variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Knockout Bracket
      </Typography>
      {matches.length === 0 ? (
        <Typography color="text.secondary">No bracket generated yet.</Typography>
      ) : (
        <BracketView
          matches={matches}
          onMatchClick={(id) => router.push(`/tournaments/${tournamentId}/matches/${id}`)}
        />
      )}
    </Box>
  );
}

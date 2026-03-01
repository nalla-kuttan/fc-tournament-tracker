'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import MatchCard from '@/components/tournament/MatchCard';
import type { Match } from '@/lib/types';

export default function MatchesPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}`)
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches ?? []);
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

  const rounds = Array.from(new Set(matches.map((m) => m.round_number))).sort((a, b) => a - b);
  const filtered = selectedRound ? matches.filter((m) => m.round_number === selectedRound) : matches;

  // Group by round
  const grouped = filtered.reduce(
    (acc, m) => {
      const key = m.round_number;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    },
    {} as Record<number, Match[]>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Matches
      </Typography>

      {/* Round Filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          onClick={() => setSelectedRound(null)}
          color={selectedRound === null ? 'primary' : 'default'}
          variant={selectedRound === null ? 'filled' : 'outlined'}
        />
        {rounds.map((r) => (
          <Chip
            key={r}
            label={`Round ${r}`}
            onClick={() => setSelectedRound(r)}
            color={selectedRound === r ? 'primary' : 'default'}
            variant={selectedRound === r ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {/* Matches by Round */}
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([round, roundMatches]) => (
          <Box key={round} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Round {round}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {roundMatches
                .sort((a, b) => a.match_number - b.match_number)
                .map((m) => (
                  <MatchCard key={m.id} match={m as never} />
                ))}
            </Box>
          </Box>
        ))}

      {matches.length === 0 && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          No matches scheduled yet. Generate the schedule from the dashboard.
        </Typography>
      )}
    </Box>
  );
}

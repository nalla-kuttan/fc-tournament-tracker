'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import type { Player } from '@/lib/types';

export default function TournamentPlayersPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}`)
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data.players ?? []);
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
        Players ({players.length})
      </Typography>
      <Grid container spacing={2}>
        {players.map((player) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>
                  {player.name}
                </Typography>
                <Chip
                  label={player.team}
                  size="small"
                  sx={{ mt: 1 }}
                  variant="outlined"
                />
                {player.seed && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Seed #{player.seed}
                  </Typography>
                )}
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

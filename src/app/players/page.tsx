'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import PlayerCard from '@/components/player/PlayerCard';
import EmptyState from '@/components/shared/EmptyState';
import type { RegisteredPlayer } from '@/lib/types';

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Player Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registered players across all tournaments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/players/new')}
        >
          Register Player
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : players.length === 0 ? (
        <EmptyState
          icon={<PeopleIcon sx={{ fontSize: 64 }} />}
          title="No players registered"
          description="Register players to add them to tournaments."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/players/new')}>
              Register Player
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {players.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <PlayerCard player={p} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

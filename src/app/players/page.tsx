'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
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
      {/* iOS Large Title */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.5px',
          mb: 3,
          mt: 1,
        }}
      >
        Players
      </Typography>

      {/* Section header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: '#8E8E93',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          Registered Players
        </Typography>
        <Button
          variant="text"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => router.push('/players/new')}
          sx={{
            color: '#0A84FF',
            fontWeight: 600,
            fontSize: '0.9rem',
            textTransform: 'none',
            p: 0,
            minWidth: 'auto',
          }}
        >
          Add
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ background: '#1C1C1E', borderRadius: '12px', p: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2, mb: i < 4 ? 1 : 0, bgcolor: 'rgba(255,255,255,0.05)' }} />
          ))}
        </Box>
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
        <Box
          sx={{
            background: '#1C1C1E',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {players.map((p, index) => (
            <PlayerCard key={p.id} player={p} showDivider={index < players.length - 1} />
          ))}
        </Box>
      )}
    </Box>
  );
}

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
import BackButton from '@/components/shared/BackButton';
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
      <BackButton />
      {/* Gradient Title */}
      <Box className="animate-section" sx={{ mb: 4, mt: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Players
        </Typography>
      </Box>

      {/* Section header */}
      <Box className="animate-section" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, mb: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            color: '#64748B',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
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
            color: '#22C55E',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            p: 0,
            minWidth: 'auto',
            '&:hover': {
              background: 'rgba(34, 197, 94, 0.08)',
            },
          }}
        >
          Add
        </Button>
      </Box>

      {loading ? (
        <Box sx={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          borderRadius: '16px',
          p: 2,
        }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2, mb: i < 4 ? 1 : 0, bgcolor: 'rgba(148, 163, 184, 0.05)' }} />
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
          className="animate-section"
          sx={{
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            borderRadius: '16px',
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

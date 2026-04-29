'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import Tilt from 'react-parallax-tilt';
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
      {/* Spatial Info Panel instead of flat floating text */}
      <Box className="animate-section" sx={{ mb: 4, mt: 1, perspective: 1000 }}>
        <Tilt
          tiltMaxAngleX={10}
          tiltMaxAngleY={10}
          perspective={800}
          scale={1.02}
          transitionSpeed={600}
          gyroscope={true}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px',
              padding: '12px 24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transformStyle: 'preserve-3d',
            }}
          >
            <PeopleIcon sx={{ fontSize: 32, color: '#22C55E', transform: 'translateZ(30px)', filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#F8FAFC',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                transform: 'translateZ(20px)',
              }}
            >
              Players
            </Typography>
          </Box>
        </Tilt>
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
            <PlayerCard key={p.id} player={p} showDivider={index < players.length - 1} index={index} />
          ))}
        </Box>
      )}
    </Box>
  );
}

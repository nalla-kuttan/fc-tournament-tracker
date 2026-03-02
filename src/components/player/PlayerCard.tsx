'use client';

import { useRouter } from 'next/navigation';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';
import GlassCard from '@/components/shared/GlassCard';
import type { RegisteredPlayer } from '@/lib/types';

export default function PlayerCard({ player }: { player: RegisteredPlayer }) {
  const router = useRouter();

  return (
    <GlassCard
      sx={{
        cursor: 'pointer',
        '&:hover': { borderColor: 'rgba(191, 90, 242, 0.3)' },
      }}
      onClick={() => router.push(`/players/${player.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonIcon sx={{ color: 'secondary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {player.name}
            </Typography>
            <Chip label={player.base_team} size="small" variant="outlined" sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      </CardContent>
    </GlassCard>
  );
}

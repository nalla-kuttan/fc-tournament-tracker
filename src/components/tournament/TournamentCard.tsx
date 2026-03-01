'use client';

import { useRouter } from 'next/navigation';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GlassCard from '@/components/shared/GlassCard';
import { TOURNAMENT_STATUSES } from '@/lib/constants';
import type { Tournament } from '@/lib/types';

const FORMAT_ICONS: Record<string, string> = {
  league: '🏟️',
  knockout: '🏆',
  cup: '🏅',
};

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const statusConfig = TOURNAMENT_STATUSES[tournament.status];

  return (
    <GlassCard
      sx={{
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'rgba(0, 212, 255, 0.3)',
          transform: 'translateY(-4px)',
        },
      }}
      onClick={() => router.push(`/tournaments/${tournament.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: 20 }} />
            <Typography variant="h6" fontWeight={700}>
              {tournament.name}
            </Typography>
          </Box>
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              bgcolor: `${statusConfig.color}20`,
              color: statusConfig.color,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {FORMAT_ICONS[tournament.format]} {tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            &bull; Created {new Date(tournament.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
    </GlassCard>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { CareerStats, RegisteredPlayer } from '@/lib/types';
import { getAvatarColor, getInitials, getPlayerArchetype } from '@/lib/player-insights';
import { getPlayerImagePath } from '@/lib/player-images';
import ArchetypeIcon from '@/components/player/ArchetypeIcon';

export default function PlayerCard({
  player,
  stats,
  badges = [],
  elo,
  form = [],
  showDivider = true,
  index = 0,
}: {
  player: RegisteredPlayer;
  stats?: CareerStats;
  badges?: string[];
  elo?: number;
  form?: ('W' | 'D' | 'L')[];
  showDivider?: boolean;
  index?: number;
}) {
  const router = useRouter();
  const avatarColor = getAvatarColor(player.id || player.name);
  const archetype = stats ? getPlayerArchetype(stats) : null;
  const imagePath = getPlayerImagePath(player.name);

  return (
      <Box
        onClick={() => router.push(`/players/${player.id}`)}
        className="list-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.75,
        cursor: 'pointer',
        borderBottom: showDivider ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
        animation: `fadeInUp 0.28s ease ${index * 0.03}s both`,
        transition: 'background 150ms ease, transform 150ms ease',
        '&:hover': { transform: 'translateX(2px)' },
        '&:active': { transform: 'scale(0.99)' },
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: `${avatarColor}18`,
          border: `1px solid ${avatarColor}35`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
          flexShrink: 0,
          transition: 'all 200ms ease',
        }}
      >
        {imagePath ? (
          <Box
            component="img"
            src={imagePath}
            alt={`${player.name} profile`}
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
              objectFit: 'cover',
            }}
          />
        ) : stats && stats.total_matches > 0 ? (
          <Typography fontWeight={800} sx={{ color: avatarColor, fontSize: '0.85rem' }}>
            {getInitials(player.name)}
          </Typography>
        ) : (
          <PersonIcon sx={{ color: avatarColor, fontSize: 22 }} />
        )}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, mb: 0.25 }}>
          <Typography variant="body1" fontWeight={700} noWrap sx={{ letterSpacing: '0.01em' }}>
            {player.name}
          </Typography>
          {badges.slice(0, 2).map((badge) => (
            <Chip
              key={badge}
              label={badge}
              size="small"
              sx={{
                height: 20,
                bgcolor: 'rgba(34, 197, 94, 0.1)',
                color: '#22C55E',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
            {player.base_team}
          </Typography>
          {stats && stats.total_matches > 0 && (
            <>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                {stats.total_matches} MP
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {stats.win_rate.toFixed(0)}% WR
              </Typography>
              <Typography variant="caption" sx={{ color: '#F59E0B', fontSize: '0.8rem' }}>
                {stats.total_goals} G
              </Typography>
              {elo && (
                <Typography variant="caption" sx={{ color: '#3B82F6', fontSize: '0.8rem' }}>
                  {elo} PR
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      {archetype && (
        <Box sx={{ display: { xs: 'none', sm: 'block' }, mx: 1 }}>
          <ArchetypeIcon archetype={archetype} size={32} />
        </Box>
      )}

      {form.length > 0 && (
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.4, mx: 1.5 }}>
          {form.map((result, resultIndex) => (
            <Box
              key={`${result}-${resultIndex}`}
              sx={{
                width: 20,
                height: 20,
                borderRadius: '10px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#020617',
                bgcolor: result === 'W' ? '#22C55E' : result === 'D' ? '#94A3B8' : '#EF4444',
              }}
            >
              {result}
            </Box>
          ))}
        </Box>
      )}

      <ChevronRightIcon sx={{ color: '#64748B', fontSize: 20 }} />
    </Box>
  );
}

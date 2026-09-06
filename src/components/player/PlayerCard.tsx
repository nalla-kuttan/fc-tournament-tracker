'use client';

import Link from 'next/link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { CareerStats, RegisteredPlayer } from '@/lib/types';
import { getAvatarColor, getInitials, getPlayerArchetype, getPlayerTags } from '@/lib/player-insights';
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
  const avatarColor = getAvatarColor(player.id || player.name);
  const archetype = stats ? getPlayerArchetype(stats) : null;
  const tags = stats ? getPlayerTags(stats) : [];
  const imagePath = getPlayerImagePath(player.name);

  return (
      <Box
        component={Link}
        href={`/players/${player.id}`}
        aria-label={`View ${player.name}'s profile`}
        className="list-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.75,
        cursor: 'pointer',
        color: 'inherit',
        textDecoration: 'none',
        borderBottom: showDivider ? '1px solid rgba(201, 185, 190, 0.06)' : 'none',
        animation: `fadeInUp 0.28s ease ${index * 0.03}s both`,
        transition: 'background 150ms ease, transform 150ms ease',
        '&:hover': { transform: 'translateX(2px)' },
        '&:active': { transform: 'scale(0.99)' },
        '&:focus-visible': { outline: '3px solid rgba(255, 138, 115, 0.7)', outlineOffset: -3 },
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
                bgcolor: 'rgba(234, 108, 86, 0.1)',
                color: '#EA6C56',
                border: '1px solid rgba(234, 108, 86, 0.2)',
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#C9B9BE', fontSize: '0.8rem' }}>
            {player.base_team}
          </Typography>
          {stats && stats.total_matches > 0 && (
            <>
              <Typography variant="caption" sx={{ color: '#C9B9BE', fontSize: '0.8rem' }}>
                {stats.total_matches} MP
              </Typography>
              <Typography variant="caption" sx={{ color: '#C9B9BE', fontSize: '0.8rem' }}>
                {stats.win_rate.toFixed(0)}% WR
              </Typography>
              <Typography variant="caption" sx={{ color: '#F59E0B', fontSize: '0.8rem' }}>
                {stats.total_goals} G
              </Typography>
              {elo && (
                <Typography variant="caption" sx={{ color: '#7E8CC2', fontSize: '0.8rem' }}>
                  {elo} PR
                </Typography>
              )}
            </>
          )}
        </Box>
        {tags.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }} aria-label="Player tags">
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  color: '#7E8CC2',
                  borderColor: 'rgba(126, 140, 194, 0.32)',
                  bgcolor: 'rgba(51, 64, 117, 0.12)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}
              />
            ))}
          </Box>
        ) : null}
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
                color: '#12080C',
                bgcolor: result === 'W' ? '#EA6C56' : result === 'D' ? '#C9B9BE' : '#EF4444',
              }}
            >
              {result}
            </Box>
          ))}
        </Box>
      )}

      <ChevronRightIcon aria-hidden="true" sx={{ color: '#C9B9BE', fontSize: 20 }} />
    </Box>
  );
}

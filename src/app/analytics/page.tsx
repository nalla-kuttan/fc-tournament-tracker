'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PublicIcon from '@mui/icons-material/Public';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function AnalyticsPage() {
  const router = useRouter();

  const items = [
    {
      title: 'Head-to-Head',
      description: 'Compare two players across all tournaments',
      icon: <CompareArrowsIcon sx={{ fontSize: 24, color: '#0A84FF' }} />,
      iconBg: 'rgba(10,132,255,0.15)',
      href: '/analytics/h2h',
    },
    {
      title: 'Global Analytics',
      description: 'All-time career stats and rankings',
      icon: <PublicIcon sx={{ fontSize: 24, color: '#BF5AF2' }} />,
      iconBg: 'rgba(191,90,242,0.15)',
      href: '/analytics/global',
    },
    {
      title: 'League Analytics',
      description: 'Tournament-specific stats and rankings',
      icon: <LeaderboardIcon sx={{ fontSize: 24, color: '#FF9F0A' }} />,
      iconBg: 'rgba(255,159,10,0.15)',
      href: '/analytics/league',
    },
  ];

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
        Analytics
      </Typography>

      {/* iOS Grouped List */}
      <Box
        sx={{
          background: '#1C1C1E',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {items.map((item, index) => (
          <Box
            key={item.title}
            onClick={() => router.push(item.href)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              cursor: 'pointer',
              borderBottom: index < items.length - 1 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
              '&:active': { background: 'rgba(255,255,255,0.05)' },
            }}
          >
            {/* Icon */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: item.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </Box>

            {/* Text */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" fontWeight={600}>
                {item.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8E8E93' }}>
                {item.description}
              </Typography>
            </Box>

            <ChevronRightIcon sx={{ color: '#48484A', fontSize: 20 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

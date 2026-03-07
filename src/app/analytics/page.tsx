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
      icon: <CompareArrowsIcon sx={{ fontSize: 24, color: '#3B82F6' }} />,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconBorder: 'rgba(59, 130, 246, 0.15)',
      href: '/analytics/h2h',
    },
    {
      title: 'Global Analytics',
      description: 'All-time career stats and rankings',
      icon: <PublicIcon sx={{ fontSize: 24, color: '#A855F7' }} />,
      iconBg: 'rgba(168, 85, 247, 0.1)',
      iconBorder: 'rgba(168, 85, 247, 0.15)',
      href: '/analytics/global',
    },
    {
      title: 'League Analytics',
      description: 'Tournament-specific stats and rankings',
      icon: <LeaderboardIcon sx={{ fontSize: 24, color: '#F59E0B' }} />,
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconBorder: 'rgba(245, 158, 11, 0.15)',
      href: '/analytics/league',
    },
  ];

  return (
    <Box>
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
          Analytics
        </Typography>
      </Box>

      {/* Glass List */}
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
        {items.map((item, index) => (
          <Box
            key={item.title}
            onClick={() => router.push(item.href)}
            className="list-row"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 2,
              cursor: 'pointer',
              borderBottom: index < items.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
              transition: 'background 150ms ease',
            }}
          >
            {/* Icon */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: item.iconBg,
                border: `1px solid ${item.iconBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </Box>

            {/* Text */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
                {item.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                {item.description}
              </Typography>
            </Box>

            <ChevronRightIcon sx={{ color: '#334155', fontSize: 20 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

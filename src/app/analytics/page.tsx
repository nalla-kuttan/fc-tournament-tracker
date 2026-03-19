'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PublicIcon from '@mui/icons-material/Public';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BarChartIcon from '@mui/icons-material/BarChart';
import Tilt from 'react-parallax-tilt';

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
            <BarChartIcon sx={{ fontSize: 32, color: '#22C55E', transform: 'translateZ(30px)', filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))' }} />
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
              Analytics
            </Typography>
          </Box>
        </Tilt>
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

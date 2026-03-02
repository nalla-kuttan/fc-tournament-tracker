'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CardContent from '@mui/material/CardContent';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PublicIcon from '@mui/icons-material/Public';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import GlassCard from '@/components/shared/GlassCard';

export default function AnalyticsPage() {
  const router = useRouter();

  const cards = [
    {
      title: 'Head-to-Head',
      description: 'Compare two players across all tournaments',
      icon: <CompareArrowsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />,
      href: '/analytics/h2h',
      borderColor: 'rgba(0,212,255,0.3)',
    },
    {
      title: 'Global Analytics',
      description: 'All-time career stats, leaderboards, and rankings',
      icon: <PublicIcon sx={{ fontSize: 48, color: '#BF5AF2', mb: 2 }} />,
      href: '/analytics/global',
      borderColor: 'rgba(168,85,247,0.3)',
    },
    {
      title: 'League Analytics',
      description: 'Tournament-specific stats and player rankings',
      icon: <LeaderboardIcon sx={{ fontSize: 48, color: '#FF9F0A', mb: 2 }} />,
      href: '/analytics/league',
      borderColor: 'rgba(255,159,10,0.3)',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Deep-dive into player stats, head-to-head comparisons, and leaderboards
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.title}>
            <GlassCard
              sx={{
                cursor: 'pointer',
                '&:hover': { borderColor: card.borderColor, transform: 'translateY(-4px)' },
              }}
              onClick={() => router.push(card.href)}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                {card.icon}
                <Typography variant="h6" fontWeight={600}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PublicIcon from '@mui/icons-material/Public';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BarChartIcon from '@mui/icons-material/BarChart';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import GlassCard from '@/components/shared/GlassCard';
import { getAnalyticsSummary, getRivalries, type GoalLite } from '@/lib/analytics-insights';
import type { CareerStats, Match, RegisteredPlayer } from '@/lib/types';

interface GlobalData {
  career_stats: CareerStats[];
  all_matches: Match[];
  all_goals: GoalLite[];
  registered_players: RegisteredPlayer[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data } = useSWR<GlobalData>('/api/analytics/global', fetcher, { revalidateOnFocus: false });
  const summary = data ? getAnalyticsSummary(data.career_stats, data.all_matches, data.all_goals, data.registered_players) : null;
  const rivalries = data ? getRivalries(data.registered_players, data.player_instances, data.all_matches) : [];

  const items = [
    {
      title: 'Head-to-Head',
      description: rivalries[0] ? `${rivalries[0].p1Name} vs ${rivalries[0].p2Name} leads ${rivalries[0].matches.length} tracked meetings` : 'Compare two players across all tournaments',
      icon: <CompareArrowsIcon sx={{ fontSize: 24, color: '#3B82F6' }} />,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconBorder: 'rgba(59, 130, 246, 0.15)',
      href: '/analytics/h2h',
    },
    {
      title: 'Global Analytics',
      description: summary?.topScorer ? `${summary.topScorer.player_name} leads with ${summary.topScorer.total_goals} goals` : 'All-time career stats and rankings',
      icon: <PublicIcon sx={{ fontSize: 24, color: '#A855F7' }} />,
      iconBg: 'rgba(168, 85, 247, 0.1)',
      iconBorder: 'rgba(168, 85, 247, 0.15)',
      href: '/analytics/global',
    },
    {
      title: 'League Analytics',
      description: summary?.latestMatch ? `Latest: ${summary.latestMatch.home_player?.name ?? 'Home'} ${summary.latestMatch.home_score}-${summary.latestMatch.away_score} ${summary.latestMatch.away_player?.name ?? 'Away'}` : 'Tournament-specific stats and rankings',
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
            <BarChartIcon sx={{ fontSize: 32, color: '#22C55E', filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#F8FAFC',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              Analytics
            </Typography>
          </Box>
      </Box>

      {summary && (
        <Grid container spacing={1.5} className="animate-section" sx={{ mb: 3 }}>
          {[
            { label: 'Matches', value: summary.matches, icon: <SportsSoccerIcon />, color: '#22C55E' },
            { label: 'Goals', value: summary.goals, icon: <EmojiEventsIcon />, color: '#F59E0B' },
            { label: 'Players', value: summary.players, icon: <PeopleIcon />, color: '#3B82F6' },
            { label: 'Best WR', value: summary.bestWinRate ? `${summary.bestWinRate.win_rate.toFixed(0)}%` : '—', icon: <TrendingUpIcon />, color: '#A855F7' },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
              <GlassCard>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.75, '&:last-child': { pb: 1.75 } }}>
                  <Box sx={{ color: stat.color, display: 'flex' }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </CardContent>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      )}

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

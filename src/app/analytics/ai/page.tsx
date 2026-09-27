'use client';

import useSWR from 'swr';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BackButton from '@/components/shared/BackButton';
import GlassCard from '@/components/shared/GlassCard';
import AIStatQuery from '@/components/ai/AIStatQuery';
import { fetcher } from '@/lib/fetcher';
import type { CareerStats } from '@/lib/types';
import PageSkeleton from '@/components/shared/PageSkeleton';

interface GlobalData {
  career_stats: CareerStats[];
}

export default function AIAnalystPage() {
  const { data, isLoading } = useSWR<GlobalData>('/api/analytics/global', fetcher, { revalidateOnFocus: false });
  const careerStats = data?.career_stats ?? [];
  const topScorer = [...careerStats].sort((a, b) => b.total_goals - a.total_goals)[0];
  const bestRating = [...careerStats].sort((a, b) => b.avg_rating - a.avg_rating)[0];

  if (isLoading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <Box>
      <BackButton />
      <GlassCard
        sx={{
          mb: 2,
          background: 'linear-gradient(135deg, rgba(51, 64, 117, 0.14), rgba(36, 16, 25, 0.72) 55%, rgba(18, 8, 12, 0.58))',
          border: '1px solid rgba(51, 64, 117, 0.22)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#7E8CC2', fontSize: 34 }} />
            <Typography component="h1" variant="h4" fontWeight={900}>
              AI Analyst
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
            Ask the analyst booth for stat-backed reads on form, awards, rankings, rivalries, and patterns hiding in the numbers.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Chip size="small" label={`${careerStats.length} players indexed`} sx={{ color: '#FFF7F6', bgcolor: 'rgba(18, 8, 12, 0.35)', fontWeight: 850 }} />
            {topScorer && (
              <Chip size="small" label={`Top scorer: ${topScorer.player_name}`} sx={{ color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.12)', fontWeight: 850 }} />
            )}
            {bestRating && (
              <Chip size="small" label={`Best rating: ${bestRating.player_name}`} sx={{ color: '#FF8A73', bgcolor: 'rgba(234, 108, 86, 0.12)', fontWeight: 850 }} />
            )}
          </Box>
        </CardContent>
      </GlassCard>

      {careerStats.length ? (
        <AIStatQuery careerStats={careerStats} />
      ) : (
        <Typography color="text.secondary">No player stats available yet. Play some matches first.</Typography>
      )}
    </Box>
  );
}

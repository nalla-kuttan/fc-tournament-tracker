'use client';

import useSWR from 'swr';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BackButton from '@/components/shared/BackButton';
import GlassCard from '@/components/shared/GlassCard';
import AIStatQuery from '@/components/ai/AIStatQuery';
import { fetcher } from '@/lib/fetcher';
import type { CareerStats } from '@/lib/types';

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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <BackButton />
      <GlassCard
        sx={{
          mb: 2,
          background: 'linear-gradient(135deg, rgba(191, 90, 242, 0.16), rgba(15, 23, 42, 0.62) 55%, rgba(34, 197, 94, 0.08))',
          border: '1px solid rgba(191, 90, 242, 0.22)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#E879F9', fontSize: 34 }} />
            <Typography variant="h4" fontWeight={900}>
              AI Analyst
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
            Ask the analyst about all-time player stats, form, awards, rankings, and patterns hiding in the numbers.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Typography sx={{ px: 1.25, py: 0.7, borderRadius: '999px', bgcolor: 'rgba(2, 6, 23, 0.35)', color: '#DDE7F4', fontSize: '0.76rem', fontWeight: 850 }}>
              {careerStats.length} players indexed
            </Typography>
            {topScorer && (
              <Typography sx={{ px: 1.25, py: 0.7, borderRadius: '999px', bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#FCD34D', fontSize: '0.76rem', fontWeight: 850 }}>
                Top scorer: {topScorer.player_name}
              </Typography>
            )}
            {bestRating && (
              <Typography sx={{ px: 1.25, py: 0.7, borderRadius: '999px', bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#86EFAC', fontSize: '0.76rem', fontWeight: 850 }}>
                Best rating: {bestRating.player_name}
              </Typography>
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

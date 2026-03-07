'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import type { CareerStats } from '@/lib/types';

interface Award {
  emoji: string;
  title: string;
  color: string;
  winner: string;
  team: string;
  value: string;
}

function computeAwards(stats: CareerStats[]): Award[] {
  if (stats.length === 0) return [];

  const awards: Award[] = [];

  // Golden Boot — most total goals
  const topScorer = [...stats].sort((a, b) => b.total_goals - a.total_goals)[0];
  if (topScorer && topScorer.total_goals > 0) {
    awards.push({
      emoji: '⚽',
      title: 'Golden Boot',
      color: '#FF9F0A',
      winner: topScorer.player_name,
      team: topScorer.base_team,
      value: `${topScorer.total_goals} goals`,
    });
  }

  // Best Manager — highest avg rating (min 3 matches)
  const qualified = stats.filter((s) => s.total_matches >= 3);
  const bestRated = [...qualified].filter((s) => s.avg_rating > 0).sort((a, b) => b.avg_rating - a.avg_rating)[0];
  if (bestRated) {
    awards.push({
      emoji: '⭐',
      title: 'Best Manager',
      color: '#22C55E',
      winner: bestRated.player_name,
      team: bestRated.base_team,
      value: `${bestRated.avg_rating.toFixed(1)} avg rating`,
    });
  }

  // Iron Wall — most clean sheets
  const ironWall = [...stats].sort((a, b) => b.clean_sheets - a.clean_sheets)[0];
  if (ironWall && ironWall.clean_sheets > 0) {
    awards.push({
      emoji: '🧤',
      title: 'Iron Wall',
      color: '#34C759',
      winner: ironWall.player_name,
      team: ironWall.base_team,
      value: `${ironWall.clean_sheets} clean sheets`,
    });
  }

  // MOTM Magnet — most MOTM awards
  const motmKing = [...stats].filter((s) => s.motm_awards > 0).sort((a, b) => b.motm_awards - a.motm_awards)[0];
  if (motmKing) {
    awards.push({
      emoji: '🌟',
      title: 'MOTM Magnet',
      color: '#BF5AF2',
      winner: motmKing.player_name,
      team: motmKing.base_team,
      value: `${motmKing.motm_awards} awards`,
    });
  }

  // Possession Master — highest avg possession
  const possKing = [...stats].filter((s) => s.avg_possession > 0).sort((a, b) => b.avg_possession - a.avg_possession)[0];
  if (possKing) {
    awards.push({
      emoji: '🔄',
      title: 'Possession Master',
      color: '#5AC8FA',
      winner: possKing.player_name,
      team: possKing.base_team,
      value: `${possKing.avg_possession.toFixed(0)}% avg`,
    });
  }

  // Goal Machine — highest goals per match (min 3 matches)
  const goalMachine = [...qualified].sort((a, b) => b.goals_per_match - a.goals_per_match)[0];
  if (goalMachine && goalMachine.goals_per_match > 0) {
    awards.push({
      emoji: '💥',
      title: 'Goal Machine',
      color: '#FF3B30',
      winner: goalMachine.player_name,
      team: goalMachine.base_team,
      value: `${goalMachine.goals_per_match.toFixed(2)} per match`,
    });
  }

  return awards;
}

export default function SeasonAwards({ stats }: { stats: CareerStats[] }) {
  const awards = computeAwards(stats);

  if (awards.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="body2"
        sx={{
          color: '#64748B',
          textTransform: 'uppercase',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.5px',
          px: 2,
          mb: 1.5,
        }}
      >
        Season Awards
      </Typography>
      <Grid container spacing={1.5}>
        {awards.map((award) => (
          <Grid key={award.title} size={{ xs: 6, sm: 4, md: 4 }}>
            <Box
              sx={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                height: '100%',
              }}
            >
              {/* Emoji in colored square */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: `${award.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0,
                }}
              >
                {award.emoji}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{ color: award.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {award.title}
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {award.winner}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }} noWrap>
                  {award.value}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

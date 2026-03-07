'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { CareerStats } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  stats: CareerStats;
  title?: string;
}

export default function WDLDoughnut({ stats, title }: Props) {
  const data = {
    labels: ['Wins', 'Draws', 'Losses'],
    datasets: [
      {
        data: [stats.wins, stats.draws, stats.losses],
        backgroundColor: ['#22C55E', '#BF5AF2', '#FF9F0A'],
        borderColor: ['#009fcc', '#7c3aed', '#ccac00'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#FFFFFF', padding: 16 },
      },
    },
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      {title && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ maxWidth: 250, mx: 'auto', position: 'relative' }}>
        <Doughnut data={data} options={options} />
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            {stats.total_matches}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Matches
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

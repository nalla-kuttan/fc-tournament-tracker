'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PlayerSelector from '@/components/analytics/PlayerSelector';
import H2HComparison from '@/components/analytics/H2HComparison';
import BackButton from '@/components/shared/BackButton';
import type { RegisteredPlayer, H2HData } from '@/lib/types';

export default function H2HPage() {
  const [player1, setPlayer1] = useState<RegisteredPlayer | null>(null);
  const [player2, setPlayer2] = useState<RegisteredPlayer | null>(null);
  const [h2hData, setH2hData] = useState<H2HData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!player1 || !player2) return;

    setLoading(true);
    setError('');
    setH2hData(null);

    try {
      const res = await fetch(`/api/analytics/h2h?p1=${player1.id}&p2=${player2.id}`);
      if (!res.ok) {
        throw new Error('Failed to load H2H data');
      }
      const data = await res.json();
      setH2hData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <BackButton />
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Head-to-Head
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Compare career stats and direct encounters between two players
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Player Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 5 }}>
          <PlayerSelector
            label="Player 1"
            value={player1}
            onChange={setPlayer1}
            excludeId={player2?.id}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: 'center' }}>
          <CompareArrowsIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <PlayerSelector
            label="Player 2"
            value={player2}
            onChange={setPlayer2}
            excludeId={player1?.id}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        onClick={handleCompare}
        disabled={!player1 || !player2 || loading}
        fullWidth
        sx={{ mb: 4 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Compare'}
      </Button>

      {/* Results */}
      {h2hData && <H2HComparison data={h2hData} />}
    </Box>
  );
}

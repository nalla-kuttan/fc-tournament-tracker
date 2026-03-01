'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import { TEAMS } from '@/lib/constants';

export default function RegisterPlayerForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [baseTeam, setBaseTeam] = useState(TEAMS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), base_team: baseTeam }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register player');
      }

      router.push('/players');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard sx={{ maxWidth: 500, mx: 'auto' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h6">Player Details</Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Player Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ruban"
        />

        <FormControl fullWidth>
          <InputLabel>Base Team</InputLabel>
          <Select value={baseTeam} label="Base Team" onChange={(e) => setBaseTeam(e.target.value)}>
            {TEAMS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Register Player'}
        </Button>
      </CardContent>
    </GlassCard>
  );
}

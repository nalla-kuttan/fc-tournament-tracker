'use client';

import React, { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import GlassCard from '@/components/shared/GlassCard';
import type { CareerStats } from '@/lib/types';

interface AIStatQueryProps {
  careerStats: CareerStats[];
}

const PROMPTS = [
  'Who is the most complete player overall?',
  'Who scores a lot but struggles defensively?',
  'Who has the best win rate with at least 10 matches?',
  'Which player is underrated by goals alone?',
  'Who deserves a rivalry spotlight next?',
];

export default function AIStatQuery({ careerStats }: AIStatQueryProps) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const contextStats = useMemo(() => {
    const matches = careerStats.reduce((sum, player) => sum + player.total_matches, 0);
    const goals = careerStats.reduce((sum, player) => sum + player.total_goals, 0);
    const motm = careerStats.reduce((sum, player) => sum + player.motm_awards, 0);
    return [
      { label: 'Players', value: careerStats.length },
      { label: 'Matches', value: matches },
      { label: 'Goals', value: goals },
      { label: 'MOTM', value: motm },
    ];
  }, [careerStats]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const res = await fetch('/api/ai/stat-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, careerStats }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to query AI Analyst');
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query AI Analyst');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)' }, gap: 2 }}>
      <GlassCard
        sx={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(42, 18, 67, 0.42))',
          border: '1px solid rgba(191, 90, 242, 0.24)',
          boxShadow: '0 22px 70px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(191, 90, 242, 0.06)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, minWidth: 0 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#F5D0FE',
                  background: 'rgba(191, 90, 242, 0.18)',
                  border: '1px solid rgba(191, 90, 242, 0.3)',
                  boxShadow: '0 0 28px rgba(191, 90, 242, 0.18)',
                  flexShrink: 0,
                }}
              >
                <AutoAwesomeIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 950, lineHeight: 1.1 }}>
                  Ask the AI Analyst
                </Typography>
                <Typography sx={{ color: '#A7B5CA', fontSize: '0.88rem', mt: 0.35 }}>
                  Query your all-time player stats in plain English.
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label="Global data"
              sx={{ color: '#E9D5FF', bgcolor: 'rgba(191, 90, 242, 0.16)', borderColor: 'rgba(191, 90, 242, 0.28)', fontWeight: 800 }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1, mb: 2.5 }}>
            {contextStats.map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  p: 1.25,
                  borderRadius: '12px',
                  bgcolor: 'rgba(2, 6, 23, 0.35)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  minWidth: 0,
                }}
              >
                <Typography sx={{ fontWeight: 950, fontSize: '1.2rem', lineHeight: 1 }}>{stat.value}</Typography>
                <Typography sx={{ color: '#8798B0', fontSize: '0.68rem', fontWeight: 800, mt: 0.35 }}>{stat.label}</Typography>
              </Box>
            ))}
          </Box>

          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              placeholder="Ask about form, goals, win rates, ratings, awards, rivalries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  alignItems: 'flex-start',
                  bgcolor: 'rgba(2, 6, 23, 0.42)',
                  borderRadius: '14px',
                  fontSize: '0.95rem',
                  '& fieldset': { borderColor: 'rgba(191, 90, 242, 0.18)' },
                  '&:hover fieldset': { borderColor: 'rgba(191, 90, 242, 0.34)' },
                  '&.Mui-focused fieldset': { borderColor: '#BF5AF2' },
                },
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ color: '#7788A0', fontSize: '0.74rem' }}>
                Uses current career stats only.
              </Typography>
              <Button
                type="submit"
                variant="contained"
                disabled={!query.trim() || loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                sx={{
                  minWidth: 136,
                  bgcolor: '#BF5AF2',
                  color: '#FFFFFF',
                  boxShadow: '0 10px 30px rgba(191, 90, 242, 0.22)',
                  '&:hover': { bgcolor: '#A855F7' },
                }}
              >
                {loading ? 'Thinking' : 'Ask Analyst'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </GlassCard>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <GlassCard>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Suggested Questions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {PROMPTS.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  onClick={() => setQuery(prompt)}
                  sx={{
                    height: 'auto',
                    py: 0.7,
                    '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.25 },
                    color: '#DDE7F4',
                    bgcolor: 'rgba(148, 163, 184, 0.08)',
                    borderColor: 'rgba(148, 163, 184, 0.13)',
                    fontWeight: 750,
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </GlassCard>

        <GlassCard
          sx={{
            minHeight: 260,
            background: answer || error || loading
              ? 'rgba(15, 23, 42, 0.72)'
              : 'linear-gradient(135deg, rgba(15, 23, 42, 0.58), rgba(2, 6, 23, 0.72))',
          }}
        >
          <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <SearchIcon sx={{ color: '#93C5FD', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 900 }}>Analyst Response</Typography>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#A7B5CA', py: 5 }}>
                <CircularProgress size={22} />
                <Typography sx={{ fontWeight: 750 }}>Reading the stat sheet...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5' }}>
                {error}
              </Alert>
            ) : answer ? (
              <Box
                sx={{
                  color: '#DDE7F4',
                  '& h1, & h2, & h3': { color: '#E9D5FF', mb: 1.5, fontWeight: 900 },
                  '& p': { mb: 1.5, lineHeight: 1.65 },
                  '& ul': { pl: 2.5, mb: 1.5 },
                  '& li': { mb: 0.7, lineHeight: 1.55 },
                  '& strong': { color: '#F8FAFC' },
                }}
              >
                <ReactMarkdown>{answer}</ReactMarkdown>
              </Box>
            ) : (
              <Box sx={{ color: '#8798B0', py: 4 }}>
                <Typography sx={{ fontWeight: 850, color: '#C9D5E5', mb: 0.6 }}>No question asked yet</Typography>
                <Typography sx={{ lineHeight: 1.55 }}>
                  Pick a suggested question or ask your own. The answer will appear here with direct stat-backed analysis.
                </Typography>
              </Box>
            )}
          </CardContent>
        </GlassCard>
      </Box>
    </Box>
  );
}

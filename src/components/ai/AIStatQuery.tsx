'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import ReactMarkdown from 'react-markdown';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { CareerStats } from '@/lib/types';

interface AIStatQueryProps {
    careerStats: CareerStats[];
}

export default function AIStatQuery({ careerStats }: AIStatQueryProps) {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                throw new Error(data.error || 'Failed to query Oracle');
            }

            setAnswer(data.answer);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard sx={{ mb: 4, overflow: 'visible' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AutoAwesomeIcon sx={{ color: '#BF5AF2' }} />
                    <Typography variant="h6" fontWeight={700}>
                        Ask the AI Oracle
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Ask natural language questions about all-time player stats. E.g., "Who has the best win rate but the worst xG?"
                </Typography>

                <form onSubmit={handleSearch}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type your question..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!query.trim() || loading}
                            sx={{
                                bgcolor: '#BF5AF2',
                                '&:hover': { bgcolor: '#aa3ce3' },
                                minWidth: '120px'
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                        >
                            {loading ? 'Asking...' : 'Ask'}
                        </Button>
                    </Box>
                </form>

                <Collapse in={!!answer || !!error}>
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {error ? (
                            <Typography color="error">{error}</Typography>
                        ) : (
                            <Box sx={{
                                '& h1, & h2, & h3': { color: 'primary.main', mb: 2 },
                                '& p': { mb: 2, lineHeight: 1.6 },
                                '& ul': { pl: 3, mb: 2 },
                                '& li': { mb: 1, lineHeight: 1.6 }
                            }}>
                                <ReactMarkdown>{answer}</ReactMarkdown>
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </CardContent>
        </GlassCard>
    );
}

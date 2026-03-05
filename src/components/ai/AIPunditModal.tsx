'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReactMarkdown from 'react-markdown';
import type { Tournament, StandingRow, Match } from '@/lib/types';

interface AIPunditModalProps {
    open: boolean;
    onClose: () => void;
    tournament: any;
    standings: StandingRow[];
    matches?: Match[];
}

export default function AIPunditModal({
    open,
    onClose,
    tournament,
    standings,
    matches,
}: AIPunditModalProps) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateSummary = async () => {
        setLoading(true);
        setError('');
        setSummary('');

        try {
            const res = await fetch('/api/ai/tournament-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournament, standings, matches }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate summary');
            }

            setSummary(data.summary);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Generate on mount if opening and no summary exists
    React.useEffect(() => {
        if (open && !summary && !loading && !error) {
            generateSummary();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: '#FF9F0A' }} />
                <Typography variant="h6" fontWeight={700}>
                    AI Pundit Summary
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                        <CircularProgress sx={{ color: '#FF9F0A' }} />
                        <Typography variant="body2" color="text.secondary">
                            Analyzing the tournament...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : summary ? (
                    <Box sx={{
                        '& h1, & h2, & h3': { color: 'primary.main', mb: 2 },
                        '& p': { mb: 2, lineHeight: 1.6 },
                        '& ul': { pl: 3, mb: 2 },
                        '& li': { mb: 1, lineHeight: 1.6 }
                    }}>
                        <ReactMarkdown>{summary}</ReactMarkdown>
                    </Box>
                ) : (
                    <Typography>Click generate to begin</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
                    Close
                </Button>
                <Button
                    onClick={generateSummary}
                    disabled={loading}
                    variant="contained"
                    sx={{ bgcolor: '#FF9F0A', '&:hover': { bgcolor: '#e08905' } }}
                >
                    Regenerate
                </Button>
            </DialogActions>
        </Dialog>
    );
}

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
import DescriptionIcon from '@mui/icons-material/Description';
import ReactMarkdown from 'react-markdown';
import type { RegisteredPlayer, CareerStats } from '@/lib/types';

interface AIScoutModalProps {
    open: boolean;
    onClose: () => void;
    player: RegisteredPlayer;
    stats: CareerStats;
}

export default function AIScoutModal({
    open,
    onClose,
    player,
    stats,
}: AIScoutModalProps) {
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateReport = async () => {
        setLoading(true);
        setError('');
        setReport('');

        try {
            const res = await fetch('/api/ai/player-scout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player, stats }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate report');
            }

            setReport(data.report);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Generate on mount if opening and no report exists
    React.useEffect(() => {
        if (open && !report && !loading && !error) {
            generateReport();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ color: '#0A84FF' }} />
                <Typography variant="h6" fontWeight={700}>
                    AI Scouting Report
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                        <CircularProgress sx={{ color: '#0A84FF' }} />
                        <Typography variant="body2" color="text.secondary">
                            Scouting the player...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : report ? (
                    <Box sx={{
                        '& h1, & h2, & h3': { color: 'primary.main', mb: 2 },
                        '& p': { mb: 2, lineHeight: 1.6 },
                        '& ul': { pl: 3, mb: 2 },
                        '& li': { mb: 1, lineHeight: 1.6 }
                    }}>
                        <ReactMarkdown>{report}</ReactMarkdown>
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
                    onClick={generateReport}
                    disabled={loading}
                    variant="contained"
                    sx={{ bgcolor: '#0A84FF', '&:hover': { bgcolor: '#0062cc' } }}
                >
                    Regenerate
                </Button>
            </DialogActions>
        </Dialog>
    );
}

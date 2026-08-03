'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ReactMarkdown from 'react-markdown';
import type { RegisteredPlayer, H2HData } from '@/lib/types';

interface AIH2HModalProps {
    open: boolean;
    onClose: () => void;
    player1: RegisteredPlayer;
    player2: RegisteredPlayer;
    h2hData: H2HData;
}

export default function AIH2HModal({
    open,
    onClose,
    player1,
    player2,
}: AIH2HModalProps) {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateAnalysis = async () => {
        setLoading(true);
        setError('');
        setAnalysis('');

        try {
            const res = await fetch('/api/ai/h2h', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player1Id: player1.id, player2Id: player2.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate analysis');
            }

            setAnalysis(data.analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate analysis');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareArrowsIcon sx={{ color: '#22C55E' }} />
                <Typography variant="h6" fontWeight={700}>
                    AI Rivalry Analyst
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                        <CircularProgress sx={{ color: '#22C55E' }} />
                        <Typography variant="body2" color="text.secondary">
                            Analyzing the rivalry...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : analysis ? (
                    <Box sx={{
                        '& h1, & h2, & h3': { color: 'primary.main', mb: 2 },
                        '& p': { mb: 2, lineHeight: 1.6 },
                        '& ul': { pl: 3, mb: 2 },
                        '& li': { mb: 1, lineHeight: 1.6 }
                    }}>
                        <ReactMarkdown>{analysis}</ReactMarkdown>
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
                    onClick={generateAnalysis}
                    disabled={loading}
                    variant="contained"
                    sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#2aa649' } }}
                >
                    {analysis ? 'Regenerate' : 'Generate'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

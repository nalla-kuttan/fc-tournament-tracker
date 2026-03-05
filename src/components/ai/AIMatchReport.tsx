'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import Typography from '@mui/material/Typography';
import ReactMarkdown from 'react-markdown';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';

interface AIMatchReportProps {
    match: any;
    stats: any;
}

export default function AIMatchReport({ match, stats }: AIMatchReportProps) {
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateReport = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/ai/match-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ match, stats }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate match report');
            }

            setReport(data.report);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: report ? 'left' : 'center' }}>
                {!report && !loading && (
                    <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Post-Match Newspaper
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Have the AI write a catchy headline and short newspaper recap of this match.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={generateReport}
                            startIcon={<NewspaperIcon />}
                            sx={{ color: '#0A84FF', borderColor: 'rgba(10,132,255,0.5)' }}
                        >
                            Generate Report
                        </Button>
                    </Box>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 2 }}>
                        <CircularProgress sx={{ color: '#0A84FF' }} />
                        <Typography variant="body2" color="text.secondary">
                            Writing the headline...
                        </Typography>
                    </Box>
                )}

                {error && <Typography color="error">{error}</Typography>}

                {report && (
                    <Box sx={{ position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                            <Button size="small" variant="text" onClick={generateReport} startIcon={<NewspaperIcon />}>
                                Rewrite
                            </Button>
                        </Box>
                        <Box sx={{
                            fontFamily: '"Georgia", serif', // Newspaper feel
                            '& h1, & h2, & h3, & strong': { fontWeight: 800, mb: 1, color: '#E5E5EA', display: 'block' },
                            '& p': { mb: 2, lineHeight: 1.6, color: '#D1D1D6' },
                        }}>
                            <ReactMarkdown>{report}</ReactMarkdown>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </GlassCard>
    );
}

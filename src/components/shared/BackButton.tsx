'use client';

import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

export default function BackButton() {
    const router = useRouter();
    return (
        <Button
            variant="text"
            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '0.9rem !important' }} />}
            onClick={() => router.back()}
            sx={{
                color: '#EA6C56',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9375rem',
                p: 0,
                mb: 1,
                minWidth: 'auto',
                '&:hover': {
                    background: 'rgba(234, 108, 86, 0.08)',
                },
            }}
        >
            Back
        </Button>
    );
}

'use client';

import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export default function BackButton() {
    const router = useRouter();
    return (
        <Button
            onClick={() => router.back()}
            startIcon={<ChevronLeftIcon />}
            sx={{ mb: 2, textTransform: 'none', color: 'text.secondary', pl: 0 }}
        >
            Back
        </Button>
    );
}

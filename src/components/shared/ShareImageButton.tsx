'use client';

import { useState } from 'react';
import Button, { type ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IosShareIcon from '@mui/icons-material/IosShare';

interface Props extends Omit<ButtonProps, 'onClick'> {
  src: string;
  fileName: string;
  title: string;
  label?: string;
}

// Opens the share sheet with the image where the device supports it
// (phones), otherwise downloads it.
export default function ShareImageButton({ src, fileName, title, label = 'Share image', ...buttonProps }: Props) {
  const [state, setState] = useState<'idle' | 'working' | 'failed'>('idle');

  const share = async () => {
    setState('working');
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error('Image failed');
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title });
        } catch (error) {
          // Closing the share sheet isn't a failure.
          if ((error as Error).name !== 'AbortError') throw error;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setState('idle');
    } catch {
      setState('failed');
      window.setTimeout(() => setState('idle'), 2500);
    }
  };

  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={state === 'working' ? <CircularProgress size={16} color="inherit" /> : <IosShareIcon />}
      disabled={state === 'working'}
      onClick={() => void share()}
      aria-live="polite"
      {...buttonProps}
    >
      {state === 'failed' ? 'Try again' : state === 'working' ? 'Preparing…' : label}
    </Button>
  );
}

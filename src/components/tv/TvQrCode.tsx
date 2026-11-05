'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import QRCode from 'qrcode';

// A code friends can scan to open the tournament on their phones: the table,
// predictions and the live scorer.
export default function TvQrCode({ path }: { path: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const target = new URL(path, window.location.origin).toString();
    let cancelled = false;
    QRCode.toString(target, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#12080C', light: '#FFF7F6' } })
      .then((markup) => { if (!cancelled) { setSvg(markup); setUrl(target); } })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [path]);

  if (!svg) return null;
  return (
    <Box component="section" aria-label="Follow on your phone" sx={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: '20px', p: 2, bgcolor: 'rgba(36, 16, 25, 0.6)', border: '1px solid rgba(201, 185, 190, 0.08)' }}>
      <Box
        role="img"
        aria-label={`QR code for ${url}`}
        sx={{ width: 112, height: 112, flexShrink: 0, borderRadius: '10px', overflow: 'hidden', '& svg': { display: 'block', width: '100%', height: '100%' } }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.24em', color: '#7E8CC2' }}>ON YOUR PHONE</Typography>
        <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, lineHeight: 1.25, mt: 0.5 }}>Scan to predict the next match and follow the table</Typography>
      </Box>
    </Box>
  );
}

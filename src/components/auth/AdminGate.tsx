'use client';

import { useState, ReactNode } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/Lock';
import Box from '@mui/material/Box';

interface AdminGateProps {
  tournamentId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminGate({ tournamentId, children, fallback }: AdminGateProps) {
  const { isAdmin, verifyPin } = useAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAdmin(tournamentId)) {
    return <>{children}</>;
  }

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const success = await verifyPin(tournamentId, pin);
    setLoading(false);

    if (success) {
      setDialogOpen(false);
      setPin('');
    } else {
      setError('Invalid PIN. Try again.');
    }
  };

  return (
    <>
      {fallback ?? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LockIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Admin Access Required
          </Typography>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Enter Admin PIN
          </Button>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enter Admin PIN</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            error={!!error}
            helperText={error}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !pin}>
            {loading ? 'Verifying...' : 'Unlock'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

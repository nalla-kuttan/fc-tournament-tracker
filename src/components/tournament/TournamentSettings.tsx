'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CardContent from '@mui/material/CardContent';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AdminGate from '@/components/auth/AdminGate';
import GlassCard from '@/components/shared/GlassCard';
import { useAdmin } from '@/contexts/AdminContext';
import type { Tournament } from '@/lib/types';

interface Props {
  tournamentId: string;
}

export default function TournamentSettings({ tournamentId }: Props) {
  const router = useRouter();
  const { getPinForTournament } = useAdmin();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [name, setName] = useState('');
  const [format, setFormat] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}`)
      .then((r) => r.json())
      .then((data) => {
        setTournament(data);
        setName(data.name);
        setFormat(data.format);
        setStatus(data.status);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  const handleSaveDetails = async () => {
    const pin = getPinForTournament(tournamentId);
    if (!pin) return;
    setSaving(true);
    setEditMsg(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, name, format }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const updated = await res.json();
      setTournament((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditMsg({ type: 'success', text: 'Tournament details updated' });
    } catch (err) {
      setEditMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    const pin = getPinForTournament(tournamentId);
    if (!pin) return;
    setStatusSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      const updated = await res.json();
      setTournament((prev) => (prev ? { ...prev, ...updated } : prev));
      setStatusMsg({ type: 'success', text: `Status changed to ${updated.status}` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update' });
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    const pin = getPinForTournament(tournamentId);
    if (!pin) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      router.push('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournament) return null;

  const detailsChanged = name !== tournament.name || format !== tournament.format;
  const statusChanged = status !== tournament.status;

  return (
    <AdminGate tournamentId={tournamentId}>
      <Box sx={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Edit Details */}
        <GlassCard>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="h6" fontWeight={600}>
              Tournament Details
            </Typography>

            {editMsg && (
              <Alert severity={editMsg.type} onClose={() => setEditMsg(null)}>
                {editMsg.text}
              </Alert>
            )}

            <TextField
              label="Tournament Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Format
              </Typography>
              <ToggleButtonGroup
                value={format}
                exclusive
                onChange={(_, v) => v && setFormat(v)}
                fullWidth
              >
                <ToggleButton value="league">League</ToggleButton>
                <ToggleButton value="knockout">Knockout</ToggleButton>
                <ToggleButton value="cup">Cup</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
              onClick={handleSaveDetails}
              disabled={saving || !detailsChanged || !name.trim()}
            >
              Save Changes
            </Button>
          </CardContent>
        </GlassCard>

        {/* Status */}
        <GlassCard>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="h6" fontWeight={600}>
              Tournament Status
            </Typography>

            {statusMsg && (
              <Alert severity={statusMsg.type} onClose={() => setStatusMsg(null)}>
                {statusMsg.text}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={statusSaving ? <CircularProgress size={18} /> : <SaveIcon />}
              onClick={handleUpdateStatus}
              disabled={statusSaving || !statusChanged}
            >
              Update Status
            </Button>
          </CardContent>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard sx={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" fontWeight={600} color="error">
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deleting a tournament permanently removes all matches, goals, player entries, and standings.
              This action cannot be undone.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete Tournament
            </Button>
          </CardContent>
        </GlassCard>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#FF3B30' }}>Delete Tournament</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This will permanently delete <strong>{tournament.name}</strong> and all its data.
              Type the tournament name below to confirm.
            </Typography>
            {deleteError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {deleteError}
              </Alert>
            )}
            <TextField
              fullWidth
              placeholder={tournament.name}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); setDeleteError(''); }}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== tournament.name}
              startIcon={deleting ? <CircularProgress size={18} /> : <DeleteForeverIcon />}
            >
              Delete Forever
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminGate>
  );
}

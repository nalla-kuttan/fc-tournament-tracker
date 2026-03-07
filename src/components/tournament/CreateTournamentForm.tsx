'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import StadiumIcon from '@mui/icons-material/Stadium';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import { TEAMS } from '@/lib/constants';
import type { RegisteredPlayer } from '@/lib/types';

const STEPS = ['Tournament Info', 'Select Players', 'Set Admin PIN'];

export default function CreateTournamentForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<string>('league');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [teamOverrides, setTeamOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openAddPlayer, setOpenAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  const handleAddPlayer = async () => {
    if (!newPlayerName || !newPlayerTeam) return;
    setAddingPlayer(true);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName, base_team: newPlayerTeam }),
      });
      if (res.ok) {
        const added = await res.json();
        setRegisteredPlayers([...registeredPlayers, added]);
        setSelectedPlayerIds((prev) => new Set(prev).add(added.id));
        setOpenAddPlayer(false);
        setNewPlayerName('');
        setNewPlayerTeam('');
      } else {
        const data = await res.json();
        setError(data.error);
        setOpenAddPlayer(false);
      }
    } catch {
      setError("Failed to add player");
      setOpenAddPlayer(false);
    } finally {
      setAddingPlayer(false);
    }
  };

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((data) => setRegisteredPlayers(data))
      .catch(() => { });
  }, []);

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (pin !== pinConfirm) {
      setError('PINs do not match');
      return;
    }
    if (selectedPlayerIds.size < 2) {
      setError('Select at least 2 players');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const playerSelections = registeredPlayers
        .filter((p) => selectedPlayerIds.has(p.id))
        .map((p) => ({
          registered_player_id: p.id,
          name: p.name,
          team: teamOverrides[p.id] || p.base_team,
        }));

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, format, pin, playerSelections }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tournament');
      }

      const tournament = await res.json();
      router.push(`/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeStep === 0 && (
        <GlassCard>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6">Tournament Details</Typography>
            <TextField
              label="Tournament Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FC 26 Championship"
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
                <ToggleButton value="league"><StadiumIcon sx={{ fontSize: 18, mr: 0.75 }} /> League</ToggleButton>
                <ToggleButton value="knockout"><EmojiEventsIcon sx={{ fontSize: 18, mr: 0.75 }} /> Knockout</ToggleButton>
                <ToggleButton value="cup"><MilitaryTechIcon sx={{ fontSize: 18, mr: 0.75 }} /> Cup</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={!name}
              fullWidth
            >
              Next
            </Button>
          </CardContent>
        </GlassCard>
      )}

      {activeStep === 1 && (
        <GlassCard>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Select Players</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose players for this tournament. You can override their team for this tournament.
            </Typography>

            {registeredPlayers.length === 0 ? (
              <Alert severity="info">
                No players registered yet.{' '}
                <span style={{ color: '#22C55E', cursor: 'pointer' }} onClick={() => setOpenAddPlayer(true)}>
                  Register players first
                </span>
              </Alert>
            ) : (
              registeredPlayers.map((player) => (
                <Box
                  key={player.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: selectedPlayerIds.has(player.id) ? 'rgba(34, 197, 94, 0.06)' : 'transparent',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPlayerIds.has(player.id)}
                        onChange={() => togglePlayer(player.id)}
                      />
                    }
                    label={player.name}
                    sx={{ minWidth: 140 }}
                  />
                  {selectedPlayerIds.has(player.id) && (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Autocomplete
                        freeSolo
                        size="small"
                        options={TEAMS}
                        value={teamOverrides[player.id] || player.base_team}
                        onInputChange={(_, newValue) => {
                          setTeamOverrides((prev) => ({ ...prev, [player.id]: newValue }));
                        }}
                        onChange={(_, newValue) => {
                          if (newValue) {
                            setTeamOverrides((prev) => ({ ...prev, [player.id]: newValue }));
                          }
                        }}
                        renderInput={(params) => <TextField {...params} label="Team" />}
                      />
                    </FormControl>
                  )}
                </Box>
              ))
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)} fullWidth>
                Back
              </Button>
              <Button variant="outlined" onClick={() => setOpenAddPlayer(true)} fullWidth>
                Enter Player
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={selectedPlayerIds.size < 2}
                fullWidth
              >
                Next ({selectedPlayerIds.size} selected)
              </Button>
            </Box>
          </CardContent>
        </GlassCard>
      )}

      {activeStep === 2 && (
        <GlassCard>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6">Set Admin PIN</Typography>
            <Typography variant="body2" color="text.secondary">
              This PIN is required to enter match results and manage the tournament.
            </Typography>
            <TextField
              label="Admin PIN"
              type="password"
              fullWidth
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <TextField
              label="Confirm PIN"
              type="password"
              fullWidth
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value)}
              error={pinConfirm !== '' && pin !== pinConfirm}
              helperText={pinConfirm !== '' && pin !== pinConfirm ? 'PINs do not match' : ''}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(1)} fullWidth>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !pin || pin !== pinConfirm}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Create Tournament'}
              </Button>
            </Box>
          </CardContent>
        </GlassCard>
      )}

      {/* Add Player Dialog */}
      <Dialog open={openAddPlayer} onClose={() => setOpenAddPlayer(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enter New Player</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Player Name"
            name="playerNameNew"
            fullWidth
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Autocomplete
            freeSolo
            options={TEAMS}
            value={newPlayerTeam}
            onInputChange={(_, newValue) => setNewPlayerTeam(newValue)}
            onChange={(_, newValue) => {
              if (newValue) setNewPlayerTeam(newValue);
            }}
            renderInput={(params) => <TextField {...params} label="Default Team" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddPlayer(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddPlayer}
            disabled={!newPlayerName || !newPlayerTeam || addingPlayer}
          >
            {addingPlayer ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

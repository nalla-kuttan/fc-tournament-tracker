'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import { useAdmin } from '@/contexts/AdminContext';

interface Player {
  id: string;
  name: string;
  team: string;
}

interface GoalEntry {
  player_id: string;
  minute: number | '';
}

interface Props {
  match: {
    id: string;
    tournament_id: string;
    home_player: Player | null;
    away_player: Player | null;
    round_number: number;
    stage: string | null;
    home_score?: number | null;
    away_score?: number | null;
    is_played?: boolean;
    stats?: Record<string, any>;
    goals?: Array<{ id: string; player: { id: string; name: string } | null; minute: number | null }>;
  };
  isEditing?: boolean;
  onSuccess?: () => void;
}

export default function MatchResultForm({ match, isEditing = false, onSuccess }: Props) {
  const router = useRouter();
  const { getPinForTournament } = useAdmin();

  // Initialize with existing data if editing
  const stats = match.stats || {};

  const [homeScore, setHomeScore] = useState<number | ''>(match.home_score ?? 0);
  const [awayScore, setAwayScore] = useState<number | ''>(match.away_score ?? 0);
  const [goals, setGoals] = useState<GoalEntry[]>(
    match.goals?.map(g => ({ player_id: g.player?.id ?? '', minute: g.minute ?? '' })) ?? []
  );

  // Advanced stats
  const [homeXg, setHomeXg] = useState<number | ''>(stats.home_xg ?? '');
  const [awayXg, setAwayXg] = useState<number | ''>(stats.away_xg ?? '');
  const [homePossession, setHomePossession] = useState<number>(stats.home_possession ?? 50);
  const [awayPossession, setAwayPossession] = useState<number>(stats.away_possession ?? 50);
  const [homeTackles, setHomeTackles] = useState<number | ''>(stats.home_tackles ?? '');
  const [awayTackles, setAwayTackles] = useState<number | ''>(stats.away_tackles ?? '');
  const [homeInterceptions, setHomeInterceptions] = useState<number | ''>(stats.home_interceptions ?? '');
  const [awayInterceptions, setAwayInterceptions] = useState<number | ''>(stats.away_interceptions ?? '');
  const [homeRating, setHomeRating] = useState<number>(stats.home_rating ?? 6);
  const [awayRating, setAwayRating] = useState<number>(stats.away_rating ?? 6);
  const [motmPlayerId, setMotmPlayerId] = useState<string>(stats.motm_player_id ?? '');
  const [motmRating, setMotmRating] = useState<number>(stats.motm_rating ?? 7);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allPlayers = [match.home_player, match.away_player].filter(Boolean) as Player[];
  const homePlayerId = match.home_player?.id;
  const awayPlayerId = match.away_player?.id;

  // Automatically update goals when score changes
  useEffect(() => {
    const targetHomeGoals = typeof homeScore === 'number' ? homeScore : 0;
    const targetAwayGoals = typeof awayScore === 'number' ? awayScore : 0;
    const targetTotalGoals = targetHomeGoals + targetAwayGoals;

    // Count current home and away goals
    const currentHomeGoals = goals.filter(g => g.player_id === homePlayerId).length;
    const currentAwayGoals = goals.filter(g => g.player_id === awayPlayerId).length;

    setGoals((prev) => {
      let updated = [...prev];

      // Add home goals if needed
      if (currentHomeGoals < targetHomeGoals) {
        const goalsToAdd = targetHomeGoals - currentHomeGoals;
        for (let i = 0; i < goalsToAdd; i++) {
          updated.push({ player_id: homePlayerId ?? '', minute: '' });
        }
      }

      // Remove home goals if needed (from the end)
      if (currentHomeGoals > targetHomeGoals) {
        const goalsToRemove = currentHomeGoals - targetHomeGoals;
        let removed = 0;
        for (let i = updated.length - 1; i >= 0 && removed < goalsToRemove; i--) {
          if (updated[i].player_id === homePlayerId) {
            updated.splice(i, 1);
            removed++;
          }
        }
      }

      // Count again after home goal updates
      const newHomeGoals = updated.filter(g => g.player_id === homePlayerId).length;
      const newAwayGoals = updated.filter(g => g.player_id === awayPlayerId).length;

      // Add away goals if needed
      if (newAwayGoals < targetAwayGoals) {
        const goalsToAdd = targetAwayGoals - newAwayGoals;
        for (let i = 0; i < goalsToAdd; i++) {
          updated.push({ player_id: awayPlayerId ?? '', minute: '' });
        }
      }

      // Remove away goals if needed (from the end)
      if (newAwayGoals > targetAwayGoals) {
        const goalsToRemove = newAwayGoals - targetAwayGoals;
        let removed = 0;
        for (let i = updated.length - 1; i >= 0 && removed < goalsToRemove; i--) {
          if (updated[i].player_id === awayPlayerId) {
            updated.splice(i, 1);
            removed++;
          }
        }
      }

      return updated;
    });
  }, [homeScore, awayScore, homePlayerId, awayPlayerId]);

  const addGoal = () => {
    setGoals((prev) => [...prev, { player_id: allPlayers[0]?.id ?? '', minute: '' }]);
  };

  const removeGoal = (idx: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePossessionChange = (value: number) => {
    setHomePossession(value);
    setAwayPossession(100 - value);
  };

  const handleSubmit = async () => {
    const pin = getPinForTournament(match.tournament_id);
    if (!pin) {
      setError('Not authenticated. Please unlock admin access first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const stats = {
        home_xg: homeXg !== '' ? homeXg : undefined,
        away_xg: awayXg !== '' ? awayXg : undefined,
        home_possession: homePossession,
        away_possession: awayPossession,
        home_tackles: homeTackles !== '' ? homeTackles : undefined,
        away_tackles: awayTackles !== '' ? awayTackles : undefined,
        home_interceptions: homeInterceptions !== '' ? homeInterceptions : undefined,
        away_interceptions: awayInterceptions !== '' ? awayInterceptions : undefined,
        home_rating: homeRating,
        away_rating: awayRating,
        motm_player_id: motmPlayerId || undefined,
        motm_rating: motmPlayerId ? motmRating : undefined,
      };

      // Submit match result
      const matchRes = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_score: homeScore,
          away_score: awayScore,
          stats,
          pin,
          tournamentId: match.tournament_id,
        }),
      });

      if (!matchRes.ok) {
        const data = await matchRes.json();
        throw new Error(data.error || 'Failed to submit result');
      }

      // Submit goals (POST endpoint handles deletion of old goals and insertion of new ones)
      // Always submit when editing (even with empty goals) to delete old ones; only submit when creating if goals exist
      if (isEditing || goals.length > 0) {
        const goalRes = await fetch(`/api/matches/${match.id}/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goals: goals.map((g) => ({
              player_id: g.player_id,
              minute: g.minute !== '' ? g.minute : null,
            })),
            pin,
            tournamentId: match.tournament_id,
          }),
        });

        if (!goalRes.ok) {
          const data = await goalRes.json();
          throw new Error(data.error || 'Failed to save goals');
        }
      }

      // For knockout: advance winner (only if not editing and scores differ)
      const updatedMatch = await matchRes.json();
      if (!isEditing && updatedMatch.stage && homeScore !== '' && awayScore !== '' && homeScore !== awayScore) {
        await fetch(`/api/tournaments/${match.tournament_id}/bracket/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId: match.id, pin }),
        });
      }

      // If editing, call onSuccess callback; otherwise navigate
      if (isEditing) {
        onSuccess?.();
      } else {
        router.push(`/tournaments/${match.tournament_id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}

      {/* Score Input */}
      <GlassCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Score
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {match.home_player?.name} ({match.home_player?.team})
              </Typography>
              <TextField
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value === '' ? '' : Number(e.target.value))}
                inputProps={{ min: 0, style: { textAlign: 'center', fontSize: 32, fontWeight: 700 } }}
                sx={{ width: 100 }}
              />
            </Box>
            <Typography variant="h4" color="text.secondary">
              —
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {match.away_player?.name} ({match.away_player?.team})
              </Typography>
              <TextField
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value === '' ? '' : Number(e.target.value))}
                inputProps={{ min: 0, style: { textAlign: 'center', fontSize: 32, fontWeight: 700 } }}
                sx={{ width: 100 }}
              />
            </Box>
          </Box>
        </CardContent>
      </GlassCard>

      {/* Goal Scorers */}
      <Accordion sx={{ bgcolor: 'rgba(148, 163, 184, 0.03)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Goal Scorers ({goals.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {goals.map((goal, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Scorer</InputLabel>
                <Select
                  value={goal.player_id}
                  label="Scorer"
                  onChange={(e) => {
                    const next = [...goals];
                    next[idx].player_id = e.target.value;
                    setGoals(next);
                  }}
                >
                  {allPlayers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="number"
                label="Min"
                value={goal.minute}
                onChange={(e) => {
                  const next = [...goals];
                  next[idx].minute = e.target.value === '' ? '' : Number(e.target.value);
                  setGoals(next);
                }}
                sx={{ width: 80 }}
              />
              <IconButton onClick={() => removeGoal(idx)} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addGoal} size="small">
            Add Goal
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Advanced Stats */}
      <Accordion sx={{ bgcolor: 'rgba(148, 163, 184, 0.03)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Advanced Stats</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* xG */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={`${match.home_player?.name} xG`}
                type="number"
                value={homeXg}
                onChange={(e) => setHomeXg(e.target.value === '' ? '' : Number(e.target.value))}
                inputProps={{ step: 0.1, min: 0 }}
                fullWidth
              />
              <TextField
                label={`${match.away_player?.name} xG`}
                type="number"
                value={awayXg}
                onChange={(e) => setAwayXg(e.target.value === '' ? '' : Number(e.target.value))}
                inputProps={{ step: 0.1, min: 0 }}
                fullWidth
              />
            </Box>

            {/* Possession */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Possession: {homePossession}% - {awayPossession}%
              </Typography>
              <Slider
                value={homePossession}
                onChange={(_, v) => handlePossessionChange(v as number)}
                min={0}
                max={100}
                sx={{ color: 'primary.main' }}
              />
            </Box>

            {/* Tackles & Interceptions */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={`${match.home_player?.name} Tackles`}
                type="number"
                value={homeTackles}
                onChange={(e) => setHomeTackles(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
              />
              <TextField
                label={`${match.away_player?.name} Tackles`}
                type="number"
                value={awayTackles}
                onChange={(e) => setAwayTackles(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={`${match.home_player?.name} Interceptions`}
                type="number"
                value={homeInterceptions}
                onChange={(e) => setHomeInterceptions(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
              />
              <TextField
                label={`${match.away_player?.name} Interceptions`}
                type="number"
                value={awayInterceptions}
                onChange={(e) => setAwayInterceptions(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
              />
            </Box>

            {/* Ratings */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {match.home_player?.name} Rating: {homeRating}
                </Typography>
                <Slider
                  value={homeRating}
                  onChange={(_, v) => setHomeRating(v as number)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {match.away_player?.name} Rating: {awayRating}
                </Typography>
                <Slider
                  value={awayRating}
                  onChange={(_, v) => setAwayRating(v as number)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </Box>
            </Box>

            {/* MOTM */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Man of the Match</InputLabel>
                <Select
                  value={motmPlayerId}
                  label="Man of the Match"
                  onChange={(e) => setMotmPlayerId(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {allPlayers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {motmPlayerId && (
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="body2" color="text.secondary">
                    MOTM Rating: {motmRating}
                  </Typography>
                  <Slider
                    value={motmRating}
                    onChange={(_, v) => setMotmRating(v as number)}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Submit */}
      <Button
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={loading || homeScore === '' || awayScore === ''}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : 'Save & Mark as Played'}
      </Button>
    </Box>
  );
}

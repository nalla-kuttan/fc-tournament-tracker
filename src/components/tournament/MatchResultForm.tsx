'use client';

import { useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import GlassCard from '@/components/shared/GlassCard';
import { useAdmin } from '@/contexts/AdminContext';
import { BRAND_COLORS } from '@/design-tokens';
import { imageFileToUpload } from '@/lib/client-image';
import { fetcher } from '@/lib/fetcher';
import {
  EMPTY_SHEET,
  goalMinuteError,
  goalsForScore,
  mergeStatsForSave,
  nextFixture,
  sheetFromStats,
  statsFromSheet,
  swapSheetSides,
  validateSheet,
  type GoalEntry,
  type StatField,
  type StatSheet,
} from '@/lib/match-entry';
import type { ReadStatsResult } from '@/lib/match-stats-reading';
import type { Match, MatchStats } from '@/lib/types';
import { setResultFlash, type SavedResultPayload } from './SavedResultNotice';

interface Player {
  id: string;
  name: string;
  team: string;
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
    stats?: MatchStats;
    goals?: Array<{ id: string; player: { id: string; name: string } | null; minute: number | null }>;
  };
  isEditing?: boolean;
  onSuccess?: () => void;
}

const MAX_SCORE = 99;
const PHOTO_OUTLINE = 'rgba(126, 140, 194, 0.75)';

type StatRowSpec = {
  label: string;
  home: StatField;
  away?: StatField;
  inputMode: 'numeric' | 'decimal';
  suffix?: string;
};

// Same order as the EA FC match-facts screen, so a photo can be copied top to bottom.
const STAT_ROWS: StatRowSpec[] = [
  { label: 'Possession', home: 'homePossession', inputMode: 'numeric', suffix: '%' },
  { label: 'xG', home: 'homeXg', away: 'awayXg', inputMode: 'decimal' },
  { label: 'Tackles', home: 'homeTackles', away: 'awayTackles', inputMode: 'numeric' },
  { label: 'Interceptions', home: 'homeInterceptions', away: 'awayInterceptions', inputMode: 'numeric' },
  { label: 'Rating', home: 'homeRating', away: 'awayRating', inputMode: 'decimal' },
];

function inputSx(error: boolean, fromPhoto: boolean) {
  return {
    width: '100%',
    minHeight: 48,
    px: 1,
    borderRadius: '12px',
    bgcolor: BRAND_COLORS.background,
    border: '1px solid',
    borderColor: error ? 'error.main' : fromPhoto ? PHOTO_OUTLINE : 'rgba(201, 185, 190, 0.18)',
    color: BRAND_COLORS.text,
    fontWeight: 700,
    fontSize: '1.125rem',
    fontVariantNumeric: 'tabular-nums',
    transition: 'border-color 150ms ease-out',
    '& input': { textAlign: 'center', p: 0 },
    '&.Mui-focused': { borderColor: 'primary.main', boxShadow: '0 0 0 3px rgba(234, 108, 86, 0.22)' },
    '& input::placeholder': { color: BRAND_COLORS.textSecondary, opacity: 1 },
  } as const;
}

function ScoreStepper({ player, value, onChange, side }: {
  player: Player | null;
  value: number;
  onChange: (value: number) => void;
  side: 'Home' | 'Away';
}) {
  const inputId = useId();
  const name = player?.name ?? side;
  return (
    <Box sx={{ minWidth: 0, textAlign: 'center' }}>
      <Typography component="label" htmlFor={inputId} sx={{ display: 'block', fontWeight: 700, fontSize: '1.05rem' }} noWrap>
        {name}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mb: 1.25 }} noWrap>
        {player?.team ?? side}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.5, sm: 1 } }}>
        <IconButton
          aria-label={`Remove a goal for ${name}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          sx={{ width: 44, height: 44, border: '1px solid rgba(201, 185, 190, 0.18)' }}
        >
          <RemoveIcon />
        </IconButton>
        <InputBase
          id={inputId}
          value={String(value)}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(-2);
            onChange(Math.min(MAX_SCORE, digits === '' ? 0 : Number(digits)));
          }}
          onFocus={(event) => event.target.select()}
          inputProps={{ inputMode: 'numeric', 'aria-label': `${name} goals`, pattern: '[0-9]*' }}
          sx={{
            ...inputSx(false, false),
            width: { xs: 64, sm: 80 },
            minHeight: { xs: 64, sm: 72 },
            fontSize: { xs: '2rem', sm: '2.5rem' },
          }}
        />
        <IconButton
          aria-label={`Add a goal for ${name}`}
          onClick={() => onChange(Math.min(MAX_SCORE, value + 1))}
          sx={{ width: 44, height: 44, border: '1px solid rgba(201, 185, 190, 0.18)' }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

function StatInput({ id, label, value, onChange, error, fromPhoto, inputMode, suffix }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  fromPhoto: boolean;
  inputMode: 'numeric' | 'decimal';
  suffix?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <Box sx={{ minWidth: 0 }}>
      <InputBase
        id={id}
        value={value}
        placeholder="–"
        onChange={(event) => onChange(event.target.value)}
        endAdornment={suffix && value ? <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}>{suffix}</Box> : undefined}
        inputProps={{
          inputMode,
          'aria-label': label,
          'aria-invalid': Boolean(error),
          'aria-describedby': error ? errorId : undefined,
          autoComplete: 'off',
        }}
        sx={inputSx(Boolean(error), fromPhoto)}
      />
      {error && (
        <Typography id={errorId} role="alert" sx={{ color: 'error.light', fontSize: '0.75rem', mt: 0.5, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <GlassCard sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </GlassCard>
  );
}

export default function MatchResultForm({ match, isEditing = false, onSuccess }: Props) {
  const router = useRouter();
  const { getPinForTournament } = useAdmin();
  const fileInput = useRef<HTMLInputElement>(null);
  const fieldPrefix = useId();

  const home = match.home_player;
  const away = match.away_player;
  const players = { homeId: home?.id, awayId: away?.id };

  const [homeScore, setHomeScore] = useState(match.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0);
  const [goals, setGoals] = useState<GoalEntry[]>(() => goalsForScore(
    (match.goals ?? []).map((goal) => ({ player_id: goal.player?.id ?? '', minute: goal.minute == null ? '' : String(goal.minute) })),
    home?.id, away?.id, match.home_score ?? 0, match.away_score ?? 0
  ));
  const [showMinutes, setShowMinutes] = useState(() => (match.goals ?? []).some((goal) => goal.minute != null));
  const [sheet, setSheet] = useState<StatSheet>(() => (match.stats ? sheetFromStats(match.stats, players) : EMPTY_SHEET));
  const [photoFields, setPhotoFields] = useState<Set<string>>(new Set());
  const [photo, setPhoto] = useState<{ status: 'idle' | 'reading' } | { status: 'done'; result: ReadStatsResult } | { status: 'error'; message: string }>({ status: 'idle' });
  const [saving, setSaving] = useState<'next' | 'stay' | null>(null);
  const [saveError, setSaveError] = useState('');

  const { data: tournament } = useSWR<{ matches: Match[] }>(
    isEditing ? null : `/api/tournaments/${match.tournament_id}`,
    fetcher,
    { onError: () => undefined, revalidateOnFocus: false }
  );
  const upcoming = tournament ? nextFixture(tournament.matches, match.id) : undefined;

  const [previousResult] = useState<SavedResultPayload>(() => ({
    home_score: match.home_score ?? 0,
    away_score: match.away_score ?? 0,
    stats: (match.stats ?? {}) as Record<string, unknown>,
    goals: (match.goals ?? []).map((goal) => ({ player_id: goal.player?.id ?? '', minute: goal.minute ?? null })),
  }));
  const previousSummary = `${home?.name ?? 'Home'} ${match.home_score ?? 0}–${match.away_score ?? 0} ${away?.name ?? 'Away'}`;

  const errors = validateSheet(sheet);
  const minuteErrors = goals.map((goal) => goalMinuteError(goal.minute));
  const hasErrors = Object.keys(errors).length > 0 || minuteErrors.some(Boolean);

  const updateScore = (side: 'home' | 'away', value: number) => {
    const nextHome = side === 'home' ? value : homeScore;
    const nextAway = side === 'away' ? value : awayScore;
    if (side === 'home') setHomeScore(value); else setAwayScore(value);
    setGoals((current) => goalsForScore(current, home?.id, away?.id, nextHome, nextAway));
    setPhotoFields((current) => { const next = new Set(current); next.delete(`${side}Score`); return next; });
  };

  const updateField = (field: StatField, value: string) => {
    setSheet((current) => ({ ...current, [field]: value }));
    setPhotoFields((current) => { const next = new Set(current); next.delete(field); return next; });
  };

  const setAwayPossession = (value: string) => {
    const parsed = Number(value.replace(',', '.'));
    updateField('homePossession', value.trim() === '' ? '' : Number.isFinite(parsed) ? String(100 - parsed) : value);
  };

  const readPhoto = async (file: File) => {
    const pin = getPinForTournament(match.tournament_id);
    if (!pin) {
      setPhoto({ status: 'error', message: 'Unlock with the tournament PIN, then try the photo again.' });
      return;
    }
    setPhoto({ status: 'reading' });
    try {
      const image = await imageFileToUpload(file);
      const response = await fetch('/api/ai/read-match-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, pin, image }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'The photo could not be read. Try again.');
      const result = body as ReadStatsResult;
      if (!result.notStatsScreen) {
        setSheet((current) => ({ ...current, ...result.sheet }));
        const filled = new Set<string>(Object.keys(result.sheet));
        if (result.score) {
          setHomeScore(result.score.home);
          setAwayScore(result.score.away);
          setGoals((current) => goalsForScore(current, home?.id, away?.id, result.score!.home, result.score!.away));
          filled.add('homeScore').add('awayScore');
        }
        setPhotoFields(filled);
      }
      setPhoto({ status: 'done', result });
    } catch (error) {
      setPhoto({ status: 'error', message: error instanceof Error ? error.message : 'The photo could not be read. Try again.' });
    }
  };

  const swapSides = () => {
    setSheet((current) => swapSheetSides(current));
    setHomeScore(awayScore);
    setAwayScore(homeScore);
    setGoals((current) => goalsForScore(current, home?.id, away?.id, awayScore, homeScore));
    setPhotoFields((current) => {
      const mirrored = new Set<string>();
      for (const field of current) mirrored.add(field.startsWith('home') ? field.replace('home', 'away') : field.replace('away', 'home'));
      if (current.has('homePossession')) mirrored.add('homePossession');
      return mirrored;
    });
  };

  const save = async (mode: 'next' | 'stay') => {
    if (hasErrors) {
      const firstField = (Object.keys(errors) as StatField[])[0];
      document.getElementById(`${fieldPrefix}-${firstField ?? 'minutes'}`)?.focus();
      setSaveError('Fix the highlighted values, then save again.');
      return;
    }
    const pin = getPinForTournament(match.tournament_id);
    if (!pin) {
      setSaveError('Unlock with the tournament PIN, then save again.');
      return;
    }

    setSaving(mode);
    setSaveError('');
    try {
      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_score: homeScore,
          away_score: awayScore,
          stats: mergeStatsForSave(match.stats as Record<string, unknown> | undefined, statsFromSheet(sheet, players)),
          goals: goals.map((goal) => ({ player_id: goal.player_id, minute: goal.minute.trim() === '' ? null : Number(goal.minute) })),
          advance_bracket: !isEditing,
          pin,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'The result was not saved. Check your connection and save again.');
      }

      const summary = `${home?.name ?? 'Home'} ${homeScore}–${awayScore} ${away?.name ?? 'Away'}`;
      if (isEditing) {
        setResultFlash({
          message: `Saved changes · ${summary}`,
          undo: { matchId: match.id, tournamentId: match.tournament_id, previous: previousResult, summary: previousSummary },
        });
        onSuccess?.();
        return;
      }
      // A new result can't be un-recorded, but it can be reopened and corrected.
      const fix = { href: `/tournaments/${match.tournament_id}/matches/${match.id}?edit=1` };

      // Re-read the fixtures: a knockout result may have created the next tie.
      const latest = await fetch(`/api/tournaments/${match.tournament_id}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null) as { matches: Match[] } | null;
      const next = latest ? nextFixture(latest.matches, match.id) : null;

      if (mode === 'next' && next) {
        setResultFlash({ message: `Saved · ${summary}. Next: ${next.home_player?.name ?? 'Home'} vs ${next.away_player?.name ?? 'Away'}`, fix });
        router.push(`/tournaments/${match.tournament_id}/matches/${next.id}`);
      } else if (!next && latest) {
        setResultFlash({ message: `Saved · ${summary}. All fixtures recorded.`, fix });
        router.push(`/tournaments/${match.tournament_id}/standings`);
      } else {
        setResultFlash({ message: `Saved · ${summary}`, fix });
        router.push(`/tournaments/${match.tournament_id}`);
      }
      router.refresh();
    } catch (error) {
      setSaving(null);
      setSaveError(error instanceof Error ? error.message : 'The result was not saved. Save again.');
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void save(isEditing ? 'stay' : 'next');
  };

  const fieldId = (field: string) => `${fieldPrefix}-${field}`;
  const busy = saving !== null;
  const photoResult = photo.status === 'done' ? photo.result : null;
  const primaryLabel = isEditing
    ? 'Save changes'
    : upcoming === null ? 'Save & finish' : 'Save & next fixture';
  const awayPossession = (() => {
    const value = Number(sheet.homePossession.replace(',', '.'));
    return sheet.homePossession.trim() === '' || !Number.isFinite(value) ? '' : String(100 - value);
  })();
  const goalsBy = (playerId?: string) => goals
    .map((goal, index) => ({ goal, index }))
    .filter(({ goal }) => goal.player_id === playerId);

  return (
    <Box component="form" noValidate onSubmit={onSubmit} aria-busy={busy} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
      {/* Photo reading */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={photo.status === 'reading' ? <CircularProgress size={18} color="inherit" /> : <PhotoCameraOutlinedIcon />}
          onClick={() => {
            if (!getPinForTournament(match.tournament_id)) {
              setPhoto({ status: 'error', message: 'Unlock with the tournament PIN, then try the photo again.' });
              return;
            }
            fileInput.current?.click();
          }}
          disabled={photo.status === 'reading' || busy}
        >
          {photo.status === 'reading' ? 'Reading photo…' : 'Read from photo'}
        </Button>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', flex: '1 1 220px' }}>
          Snap the post-match stats screen and the sheet fills itself. Check it before saving.
        </Typography>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void readPhoto(file);
          }}
        />
      </Box>

      <Box aria-live="polite">
        {photo.status === 'error' && <Alert severity="error" onClose={() => setPhoto({ status: 'idle' })}>{photo.message}</Alert>}
        {photoResult?.notStatsScreen && (
          <Alert severity="warning" onClose={() => setPhoto({ status: 'idle' })}>
            That doesn’t look like the match stats screen. Try a photo of the post-match stats.
          </Alert>
        )}
        {photoResult && !photoResult.notStatsScreen && (
          <Alert
            severity={photoResult.sidesUncertain ? 'warning' : 'info'}
            onClose={() => setPhoto({ status: 'idle' })}
            action={<Button color="inherit" size="small" startIcon={<SwapHorizIcon />} onClick={swapSides}>Swap sides</Button>}
            sx={{ '& .MuiAlert-action': { alignItems: 'center' } }}
          >
            {photoResult.filledFields > 0
              ? `Filled ${photoResult.filledFields} values from the photo. Blue outlines show them; check each against the screen.`
              : 'No readable numbers in that photo. Try a sharper, straight-on shot.'}
            {photoResult.sidesUncertain && photoResult.filledFields > 0 && ` Couldn’t tell which team is ${home?.name ?? 'home'}, so the left column went to ${home?.name ?? 'home'}.`}
          </Alert>
        )}
      </Box>

      {/* Score */}
      <Section title="Score">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'end', gap: { xs: 1, sm: 3 } }}>
          <Box sx={photoFields.has('homeScore') ? { '& input': { color: BRAND_COLORS.frenchBlueLight } } : undefined}>
            <ScoreStepper player={home} side="Home" value={homeScore} onChange={(value) => updateScore('home', value)} />
          </Box>
          <Typography aria-hidden sx={{ color: 'text.secondary', fontSize: '1.5rem', pb: { xs: 2, sm: 2.5 } }}>–</Typography>
          <Box sx={photoFields.has('awayScore') ? { '& input': { color: BRAND_COLORS.frenchBlueLight } } : undefined}>
            <ScoreStepper player={away} side="Away" value={awayScore} onChange={(value) => updateScore('away', value)} />
          </Box>
        </Box>
      </Section>

      {/* Stat sheet */}
      <Section title="Match stats">
        <Box
          role="group"
          aria-label="Match stats"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(84px, auto) minmax(0, 1fr)',
            columnGap: { xs: 1, sm: 2 },
            rowGap: 1.25,
            alignItems: 'start',
          }}
        >
          <Typography sx={{ fontWeight: 700, textAlign: 'center', fontSize: '0.875rem' }} noWrap>{home?.name ?? 'Home'}</Typography>
          <span />
          <Typography sx={{ fontWeight: 700, textAlign: 'center', fontSize: '0.875rem' }} noWrap>{away?.name ?? 'Away'}</Typography>

          {STAT_ROWS.map((row) => (
            <Box key={row.label} sx={{ display: 'contents' }}>
              <StatInput
                id={fieldId(row.home)}
                label={`${home?.name ?? 'Home'} ${row.label}`}
                value={sheet[row.home]}
                onChange={(value) => updateField(row.home, value)}
                error={errors[row.home]}
                fromPhoto={photoFields.has(row.home)}
                inputMode={row.inputMode}
                suffix={row.suffix}
              />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', alignSelf: 'center', lineHeight: 1.2 }}>
                {row.label}
              </Typography>
              {row.away ? (
                <StatInput
                  id={fieldId(row.away)}
                  label={`${away?.name ?? 'Away'} ${row.label}`}
                  value={sheet[row.away]}
                  onChange={(value) => updateField(row.away!, value)}
                  error={errors[row.away]}
                  fromPhoto={photoFields.has(row.away)}
                  inputMode={row.inputMode}
                  suffix={row.suffix}
                />
              ) : (
                <StatInput
                  id={fieldId(`${row.home}-away`)}
                  label={`${away?.name ?? 'Away'} ${row.label}`}
                  value={awayPossession}
                  onChange={setAwayPossession}
                  fromPhoto={photoFields.has(row.home)}
                  inputMode={row.inputMode}
                  suffix={row.suffix}
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Man of the Match */}
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid rgba(201, 185, 190, 0.1)' }}>
          <Typography id={fieldId('motm-label')} sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>Man of the Match</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1.5 }}>
            <ToggleButtonGroup
              exclusive
              value={sheet.motmSide || null}
              onChange={(_, value: 'home' | 'away' | null) => {
                setSheet((current) => ({ ...current, motmSide: value ?? '', motmRating: value ? current.motmRating : '' }));
                setPhotoFields((current) => { const next = new Set(current); next.delete('motmSide'); return next; });
              }}
              aria-labelledby={fieldId('motm-label')}
              sx={{
                flex: '1 1 220px',
                '& .MuiToggleButton-root': { flex: 1, minHeight: 48, textTransform: 'none', fontWeight: 700 },
                ...(photoFields.has('motmSide') && { '& .Mui-selected': { borderColor: `${PHOTO_OUTLINE} !important` } }),
              }}
            >
              <ToggleButton value="home">{home?.name ?? 'Home'}</ToggleButton>
              <ToggleButton value="away">{away?.name ?? 'Away'}</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ width: 120 }}>
              <StatInput
                id={fieldId('motmRating')}
                label="Man of the Match rating"
                value={sheet.motmRating}
                onChange={(value) => updateField('motmRating', value)}
                error={errors.motmRating}
                fromPhoto={photoFields.has('motmRating')}
                inputMode="decimal"
              />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', textAlign: 'center', mt: 0.5 }}>Rating</Typography>
            </Box>
          </Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mt: 1 }}>
            Leave any stat blank if it wasn’t shown; blanks are saved as not recorded.
          </Typography>
        </Box>
      </Section>

      {/* Goal minutes (optional) */}
      {goals.length > 0 && (
        showMinutes ? (
          <Section title="Goal minutes" action={<Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>Optional</Typography>}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {[home, away].map((player) => player && goalsBy(player.id).length > 0 && (
                <Box key={player.id}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>{player.name}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {goalsBy(player.id).map(({ goal, index }, position) => (
                      <Box key={index} sx={{ width: 76 }}>
                        <StatInput
                          id={position === 0 && player.id === home?.id ? fieldId('minutes') : fieldId(`minute-${index}`)}
                          label={`${player.name} goal ${position + 1} minute`}
                          value={goal.minute}
                          onChange={(value) => setGoals((current) => current.map((entry, i) => (i === index ? { ...entry, minute: value.replace(/\D/g, '').slice(0, 3) } : entry)))}
                          error={minuteErrors[index] ?? undefined}
                          fromPhoto={false}
                          inputMode="numeric"
                          suffix="′"
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Section>
        ) : (
          <Button onClick={() => setShowMinutes(true)} sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}>
            Add goal minutes (optional)
          </Button>
        )
      )}

      {saveError && <Alert severity="error" role="alert">{saveError}</Alert>}

      {/* Sticky save bar, above the mobile bottom navigation */}
      <Box
        sx={{
          position: 'sticky',
          bottom: { xs: 'calc(74px + env(safe-area-inset-bottom))', lg: 0 },
          zIndex: 2,
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 0 },
          py: 1.5,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          bgcolor: BRAND_COLORS.background,
          borderTop: '1px solid rgba(201, 185, 190, 0.1)',
        }}
      >
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={busy}
          sx={{ flex: '1 1 220px', minHeight: 52 }}
        >
          {saving === (isEditing ? 'stay' : 'next') ? <CircularProgress size={22} color="inherit" /> : primaryLabel}
        </Button>
        {!isEditing && (
          <Button
            variant="outlined"
            size="large"
            disabled={busy}
            onClick={() => void save('stay')}
            sx={{ flex: '0 1 auto', minHeight: 52 }}
          >
            {saving === 'stay' ? <CircularProgress size={22} color="inherit" /> : 'Save'}
          </Button>
        )}
      </Box>
    </Box>
  );
}

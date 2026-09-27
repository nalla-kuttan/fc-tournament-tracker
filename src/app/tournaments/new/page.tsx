import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CreateTournamentForm, { type TournamentPrefill } from '@/components/tournament/CreateTournamentForm';
import BackButton from '@/components/shared/BackButton';
import { uuidSchema } from '@/lib/validation';

const FORMATS = new Set(['league', 'knockout', 'cup']);

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Links like "Start Season 25" carry the previous tournament so the form can
// start from the same format and line-up. Anything unexpected is ignored.
function readPrefill(params: Record<string, string | string[] | undefined>): TournamentPrefill {
  const name = first(params.name)?.trim().slice(0, 100);
  const format = first(params.format);
  const from = first(params.from);
  return {
    name: name || undefined,
    format: format && FORMATS.has(format) ? format : undefined,
    fromTournamentId: from && uuidSchema.safeParse(from).success ? from : undefined,
  };
}

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const prefill = readPrefill(await searchParams);
  return (
    <Box>
      <BackButton />
      <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
        {prefill.name ? `Start ${prefill.name}` : 'Create Tournament'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {prefill.fromTournamentId
          ? 'Same format and players as last time. Change anything before you create it.'
          : 'Set up a new tournament with your friends'}
      </Typography>
      <CreateTournamentForm prefill={prefill} />
    </Box>
  );
}

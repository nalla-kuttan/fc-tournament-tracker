'use client';

import useSWR from 'swr';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import GlassCard from '@/components/shared/GlassCard';
import SectionTitle from '@/components/shared/SectionTitle';
import { fetcher } from '@/lib/fetcher';
import type { PunditRow } from '@/lib/predictions';

// The tournament's prediction league. The ratings model sits in the table
// as a rival, scored on the same matches people predicted.
export default function PunditTable({ tournamentId }: { tournamentId: string }) {
  const { data } = useSWR<{ available: boolean; open: number; table: PunditRow[] }>(`/api/tournaments/${tournamentId}/pundits`, fetcher, { revalidateOnFocus: false, onError: () => undefined });
  if (!data?.available || (data.table.length === 0 && data.open === 0)) return null;

  const people = data.table.filter((row) => !row.model);
  const model = data.table.find((row) => row.model);
  const beatModel = model ? people.filter((row) => row.correct > model.correct) : [];

  return (
    <Box sx={{ mt: 3 }}>
      <SectionTitle title="Pundit table" />
      <GlassCard>
        <CardContent>
          {data.table.length === 0 ? (
            <Typography color="text.secondary">{data.open} {data.open === 1 ? 'pick is' : 'picks are'} in. The table fills in as results are saved.</Typography>
          ) : (
            <>
              <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.75 }}>
                {data.table.map((row, index) => (
                  <Box component="li" key={row.predictorId} sx={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: 1, color: row.model ? 'text.secondary' : 'text.primary' }}>
                    <Typography sx={{ fontWeight: 700, color: index === 0 ? 'primary.main' : 'text.secondary' }}>{index + 1}</Typography>
                    <Typography sx={{ fontWeight: row.model ? 500 : 700, fontStyle: row.model ? 'italic' : 'normal' }} noWrap>{row.name}</Typography>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}><strong>{row.correct}</strong> / {row.picks}</Typography>
                  </Box>
                ))}
              </Box>
              {model && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mt: 1.5 }}>
                  {beatModel.length ? `${beatModel.map((row) => row.name).join(', ')} ${beatModel.length === 1 ? 'is' : 'are'} beating the ratings model.` : 'Nobody is beating the ratings model yet.'}
                  {data.open > 0 && ` ${data.open} open ${data.open === 1 ? 'pick' : 'picks'}.`}
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </GlassCard>
    </Box>
  );
}

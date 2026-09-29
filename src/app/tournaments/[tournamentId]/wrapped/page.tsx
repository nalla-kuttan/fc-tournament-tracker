'use client';

import { Suspense } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import UltimateCard from '@/components/player/UltimateCard';
import PageSkeleton from '@/components/shared/PageSkeleton';
import WrappedStory from '@/components/tournament/WrappedStory';
import { fetcher } from '@/lib/fetcher';
import { userFacingError } from '@/lib/user-error';
import type { PlayerCardData } from '@/lib/player-cards';
import type { TournamentWrapped } from '@/lib/tournament-wrapped';

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

function WrappedContent() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data, error, isLoading } = useSWR<TournamentWrapped & { cards: PlayerCardData[] }>(`/api/tournaments/${tournamentId}/wrapped`, fetcher, { revalidateOnFocus: false });
  const selectedId = searchParams.get('player');

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <Alert severity="error">{userFacingError(error, 'Wrapped', 'loaded')}</Alert>;
  if (data.players.length === 0) return <Typography color="text.secondary">Wrapped appears once matches have been played.</Typography>;

  const cardFor = (playerId: string) => data.cards.find((card) => card.playerId === playerId);
  const selected = data.players.find((player) => player.playerId === selectedId);
  const open = (playerId: string | null) => router.replace(playerId ? `${pathname}?player=${playerId}` : pathname, { scroll: false });

  return (
    <Box>
      <Typography component="h2" variant="h5" fontWeight={700}>Wrapped</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Pick a player to relive their {data.tournament.name}.</Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: { xs: 2, sm: 3 } }}>
        {data.players.map((player) => {
          const card = cardFor(player.playerId);
          return (
            <Box component="li" key={player.playerId}>
              <ButtonBase
                onClick={() => open(player.playerId)}
                aria-label={`Play ${player.name}'s Wrapped (${ordinal(player.position)})`}
                sx={{ display: 'block', width: '100%', borderRadius: '16px', textAlign: 'center' }}
              >
                {card ? <UltimateCard card={card} width="100%" /> : <Box sx={{ aspectRatio: '5 / 7', display: 'grid', placeItems: 'center' }}>{player.name}</Box>}
                <Typography sx={{ mt: 1, fontWeight: 700 }}>{ordinal(player.position)} · {player.points} pts</Typography>
              </ButtonBase>
            </Box>
          );
        })}
      </Box>
      {selected && (
        <WrappedStory
          key={selected.playerId}
          story={selected}
          tournamentName={data.tournament.name}
          card={cardFor(selected.playerId)}
          onClose={() => open(null)}
        />
      )}
    </Box>
  );
}

export default function WrappedPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WrappedContent />
    </Suspense>
  );
}

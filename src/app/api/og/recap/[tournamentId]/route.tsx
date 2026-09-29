import { ImageResponse } from 'next/og';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { buildPlayerCards } from '@/lib/player-cards';
import { getPlayerImagePath } from '@/lib/player-images';
import { loadOgFonts, loadPlayerPhoto } from '@/lib/og/assets';
import { CardArt, STADIUM_BACKGROUND } from '@/lib/og/card-art';
import { loadTournamentRecap } from '@/lib/tournament-recap-data';
import { uuidSchema } from '@/lib/validation';

const PODIUM = ['#F59E0B', '#C9B9BE', '#B7794A'];
const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;

// A tournament recap as a 1080×1920 story image.
export async function GET(_request: Request, { params }: { params: Promise<{ tournamentId: string }> }) {
  try {
    const { tournamentId } = await params;
    if (!uuidSchema.safeParse(tournamentId).success) throw new ApiError('Tournament not found', 404, 'NOT_FOUND');
    const [recap, data, fonts] = await Promise.all([loadTournamentRecap(tournamentId), getCompetitiveData(), loadOgFonts()]);
    if (recap.matchesPlayed === 0) throw new ApiError('No matches played yet', 404, 'NOT_FOUND');

    const leaderName = recap.podium[0]?.player_name;
    const leader = data.registeredPlayers.find((player) => player.name === leaderName);
    const card = leader ? buildPlayerCards(data.registeredPlayers, data.playerInstances, data.matches, data.tournaments).find((entry) => entry.playerId === leader.id) : undefined;
    const photo = card ? await loadPlayerPhoto(getPlayerImagePath(card.name)) : null;

    const facts = [
      ...recap.awards.map((award) => [award.label, `${award.winners.join(' & ')} · ${award.value}`]),
      recap.biggestWin && ['Biggest win', `${recap.biggestWin.winner} ${recap.biggestWin.score} ${recap.biggestWin.loser}`],
      recap.biggestRiser && ['Biggest riser', `${recap.biggestRiser.name} ${signed(recap.biggestRiser.change)}`],
    ].filter((fact): fact is string[] => Boolean(fact)).slice(0, 5);

    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', backgroundImage: STADIUM_BACKGROUND, color: '#FFF7F6', fontFamily: 'Chakra Petch', padding: '90px 80px' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: 6, color: '#FF8A73' }}>FC TRACKER</div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, marginTop: 18, textAlign: 'center' }}>{recap.tournament.name}</div>
          <div style={{ display: 'flex', fontSize: 30, color: '#C9B9BE', marginTop: 8 }}>
            {`${recap.decided ? 'Final recap' : 'Recap so far'} · ${recap.matchesPlayed} matches · ${recap.goals} goals`}
          </div>

          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: 4, color: '#F59E0B', marginTop: 56 }}>
            {recap.decided ? 'CHAMPION' : 'LEADER'}
          </div>
          {card ? (
            <div style={{ display: 'flex', marginTop: 20 }}>
              <CardArt card={card} photo={photo} width={420} />
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 90, fontWeight: 700, marginTop: 20 }}>{recap.champion ?? '—'}</div>
          )}

          <div style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: 44 }}>
            {recap.podium.map((row, index) => (
              <div key={row.player_name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 280, padding: '22px 10px', margin: '0 10px', borderRadius: 24, background: 'rgba(36, 16, 25, 0.85)', border: `2px solid ${PODIUM[index]}66` }}>
                <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: PODIUM[index] }}>{`${index + 1}`}</div>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, marginTop: 4 }}>{row.player_name}</div>
                <div style={{ display: 'flex', fontSize: 26, color: '#C9B9BE', marginTop: 4 }}>{`${row.points} pts · ${signed(row.goal_difference)}`}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 40, padding: '10px 36px', borderRadius: 28, background: 'rgba(36, 16, 25, 0.85)', border: '2px solid rgba(201, 185, 190, 0.12)' }}>
            {facts.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(201, 185, 190, 0.1)' }}>
                <div style={{ display: 'flex', fontSize: 28, color: '#C9B9BE' }}>{label}</div>
                <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, maxWidth: 560, textAlign: 'right' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      { width: 1080, height: 1920, fonts, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'Draw tournament recap');
  }
}

import { ImageResponse } from 'next/og';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { buildPlayerCards } from '@/lib/player-cards';
import { getPlayerImagePath } from '@/lib/player-images';
import { loadOgFonts, loadPlayerPhoto } from '@/lib/og/assets';
import { CardArt, STADIUM_BACKGROUND } from '@/lib/og/card-art';
import { uuidSchema } from '@/lib/validation';

// A player's card as a 1080×1350 image for sharing.
export async function GET(_request: Request, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    const { playerId } = await params;
    if (!uuidSchema.safeParse(playerId).success) throw new ApiError('Player not found', 404, 'NOT_FOUND');
    const data = await getCompetitiveData();
    const card = buildPlayerCards(data.registeredPlayers, data.playerInstances, data.matches, data.tournaments).find((entry) => entry.playerId === playerId);
    if (!card) throw new ApiError('Player not found', 404, 'NOT_FOUND');
    const [fonts, photo] = await Promise.all([loadOgFonts(), loadPlayerPhoto(getPlayerImagePath(card.name))]);

    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', backgroundImage: STADIUM_BACKGROUND, color: '#FFF7F6', fontFamily: 'Chakra Petch', padding: '64px 0' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: 6, color: '#FF8A73' }}>FC TRACKER</div>
          <div style={{ display: 'flex', fontSize: 26, color: '#C9B9BE', marginTop: 6 }}>Player card</div>
          <div style={{ display: 'flex', marginTop: 48 }}>
            <CardArt card={card} photo={photo} width={640} />
          </div>
          <div style={{ display: 'flex', marginTop: 40, fontSize: 30, color: '#C9B9BE' }}>
            {`Rating ${card.rating} · Peak ${card.peakRating} · ${card.matches} matches${card.titles ? ` · ${card.titles} ${card.titles === 1 ? 'title' : 'titles'}` : ''}`}
          </div>
        </div>
      ),
      { width: 1080, height: 1350, fonts, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'Draw player card');
  }
}

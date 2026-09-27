import { NextResponse } from 'next/server';
import { readImageJson } from '@/lib/ai';
import { ApiError, handleApiError, rateLimit, readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import { statsReadingJsonSchema, statsReadingSchema, toReadStatsResult } from '@/lib/match-stats-reading';
import { createServerClient } from '@/lib/supabase/server';
import { aiReadMatchStatsSchema, MAX_STATS_IMAGE_BASE64_LENGTH } from '@/lib/validation';

const TASK = `Read the match statistics from this EA SPORTS FC screen.
For each team column (left and right) report: team name, goals, possession percentage, expected goals (xG), tackles, and interceptions.
Also report which side the Player of the Match played for and their match rating, if shown.
Set is_match_stats_screen to false if the image is not an FC match statistics or summary screen.`;

// Reads suggested values from a photo of the stats screen. Nothing is saved;
// the organizer reviews the filled form and saves it through the match route.
export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'ai:read-match-stats', 10, 5 * 60);
    if (limited) return limited;
    const { matchId, pin, image } = await readJsonBody(
      request,
      aiReadMatchStatsSchema,
      MAX_STATS_IMAGE_BASE64_LENGTH + 4_096
    );

    const supabase = createServerClient();
    const { data: match, error } = await supabase
      .from('match')
      .select('id, tournament_id, home_player:home_player_id(team), away_player:away_player_id(team)')
      .eq('id', matchId)
      .maybeSingle();
    if (error) throw error;
    if (!match) throw new ApiError('Match not found', 404, 'NOT_FOUND');

    const pinCheck = await verifyTournamentPin(supabase, match.tournament_id, pin);
    if (!pinCheck.ok) return pinCheck.response;

    const raw = await readImageJson(image, TASK, statsReadingJsonSchema);
    const parsed = statsReadingSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('The photo could not be read. Try a sharper photo of the stats screen.', 502, 'AI_UNREADABLE');
    }

    const team = (player: unknown) => (player && typeof player === 'object' && 'team' in player ? String(player.team) : null);
    return NextResponse.json(
      toReadStatsResult(parsed.data, { homeTeam: team(match.home_player), awayTeam: team(match.away_player) }),
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'Read match stats from photo');
  }
}

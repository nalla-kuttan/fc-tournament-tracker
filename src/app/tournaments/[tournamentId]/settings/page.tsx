'use client';

import { useParams } from 'next/navigation';
import TournamentSettings from '@/components/tournament/TournamentSettings';

export default function SettingsPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  return <TournamentSettings tournamentId={tournamentId} />;
}

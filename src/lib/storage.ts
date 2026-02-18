import { Tournament } from "./types";
import {
    listTournaments as listTournamentsAction,
    loadTournament as loadTournamentAction,
    saveTournament as saveTournamentAction,
    deleteTournament as deleteTournamentAction,
    completeTournament as completeTournamentAction,
    getHallOfFame as getHallOfFameAction
} from "./actions/tournamentActions";

export async function listTournaments(): Promise<Tournament[]> {
    return await listTournamentsAction();
}

export async function loadTournament(id: string): Promise<Tournament | null> {
    return await loadTournamentAction(id);
}

export async function saveTournament(tournament: Tournament): Promise<void> {
    await saveTournamentAction(tournament);
}



export async function deleteTournament(id: string): Promise<void> {
    await deleteTournamentAction(id);
}

export async function completeTournament(id: string): Promise<void> {
    await completeTournamentAction(id);
}

export async function getHallOfFame(): Promise<any[]> {
    return await getHallOfFameAction();
}

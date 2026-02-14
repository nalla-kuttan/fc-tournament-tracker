import { Tournament } from "./types";

const STORAGE_KEY = "fc-tracker-tournaments";

function readAll(): Tournament[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeAll(tournaments: Tournament[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
}

export function listTournaments(): Tournament[] {
    return readAll();
}

export function loadTournament(id: string): Tournament | null {
    return readAll().find((t) => t.id === id) ?? null;
}

export function saveTournament(tournament: Tournament): void {
    const all = readAll();
    const idx = all.findIndex((t) => t.id === tournament.id);
    if (idx >= 0) {
        all[idx] = tournament;
    } else {
        all.push(tournament);
    }
    writeAll(all);
}

export function deleteTournament(id: string): void {
    writeAll(readAll().filter((t) => t.id !== id));
}

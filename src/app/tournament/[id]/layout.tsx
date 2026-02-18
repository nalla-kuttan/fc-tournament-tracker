"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/lib/types";
import { loadTournament, saveTournament } from "@/lib/storage";
import { updateTournamentName } from "@/lib/actions/tournamentActions";
import Navbar from "@/components/Navbar";
import PinGate from "@/components/PinGate";

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const id = params.id as string;
    const [tournament, setTournament] = useState<Tournament | null>(null);

    const refresh = useCallback(async () => {
        const t = await loadTournament(id);
        setTournament(t);
    }, [id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleRename = async (newName: string) => {
        await updateTournamentName(id, newName);
        refresh();
    };

    if (!tournament) {
        return (
            <div className="container page">
                <div className="empty-state">
                    <div className="empty-state-icon">😕</div>
                    <div className="empty-state-title">Tournament not found</div>
                    <p>This tournament may have been deleted.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar
                tournamentId={tournament.id}
                tournamentName={tournament.name}
                onRename={handleRename}
            />
            <PinGate correctPin={tournament.adminPin} />
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<{ tournament: Tournament; onUpdate: () => void }>, {
                        tournament,
                        onUpdate: refresh,
                    })
                    : child
            )}
        </>
    );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Track {
    name: string;
    src: string;
}

const MUSIC_DIR = "/music/";

export default function MusicPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.4);
    const [showVolume, setShowVolume] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isShuffled, setIsShuffled] = useState(false);
    const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Fetch track list from API route
    useEffect(() => {
        fetch("/api/music")
            .then((r) => r.json())
            .then((data: { files: string[] }) => {
                if (data.files && data.files.length > 0) {
                    const t = data.files.map((f) => ({
                        name: f.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
                        src: MUSIC_DIR + f,
                    }));
                    setTracks(t);
                    setShuffleOrder(generateShuffleOrder(t.length));
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    const generateShuffleOrder = (len: number) => {
        const arr = Array.from({ length: len }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const getTrackIndex = useCallback(
        (idx: number) => (isShuffled ? shuffleOrder[idx % shuffleOrder.length] : idx),
        [isShuffled, shuffleOrder]
    );

    const currentTrack = tracks.length > 0 ? tracks[getTrackIndex(currentIndex)] : null;

    // Set volume
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // Progress tracker
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const update = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        audio.addEventListener("timeupdate", update);
        return () => audio.removeEventListener("timeupdate", update);
    }, [currentTrack]);

    const play = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const next = useCallback(() => {
        if (tracks.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % tracks.length);
    }, [tracks.length]);

    const prev = () => {
        if (tracks.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    };

    const toggleShuffle = () => {
        setIsShuffled((s) => {
            if (!s) setShuffleOrder(generateShuffleOrder(tracks.length));
            return !s;
        });
    };

    // Auto-play next track when current ends
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handleEnd = () => next();
        audio.addEventListener("ended", handleEnd);
        return () => audio.removeEventListener("ended", handleEnd);
    }, [next]);

    // Load and play new track when index changes
    useEffect(() => {
        if (!currentTrack || !audioRef.current) return;
        audioRef.current.src = currentTrack.src;
        audioRef.current.load();
        if (isPlaying) {
            audioRef.current.play().catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, currentTrack?.src]);

    if (!loaded || tracks.length === 0) return null;

    return (
        <>
            <audio ref={audioRef} preload="auto" />

            {/* Floating player */}
            <div
                style={{
                    position: "fixed",
                    bottom: 20,
                    right: 20,
                    zIndex: 999,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                }}
            >
                {/* Expanded panel */}
                {isExpanded && (
                    <div
                        style={{
                            background: "rgba(10, 14, 26, 0.92)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 16,
                            padding: 16,
                            width: 280,
                            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(0,229,255,0.08)",
                            animation: "scaleIn 0.25s ease-out",
                        }}
                    >
                        {/* Track name */}
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: 4,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontFamily: "var(--font-heading)",
                            }}
                        >
                            🎵 {currentTrack?.name}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                                marginBottom: 12,
                            }}
                        >
                            Track {getTrackIndex(currentIndex) + 1} of {tracks.length}
                            {isShuffled && " · Shuffled"}
                        </div>

                        {/* Progress bar */}
                        <div
                            style={{
                                height: 3,
                                background: "rgba(255,255,255,0.06)",
                                borderRadius: 2,
                                marginBottom: 14,
                                overflow: "hidden",
                                cursor: "pointer",
                            }}
                            onClick={(e) => {
                                if (!audioRef.current) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left) / rect.width;
                                audioRef.current.currentTime = pct * audioRef.current.duration;
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    background: "var(--gradient-accent)",
                                    borderRadius: 2,
                                    transition: "width 0.3s linear",
                                }}
                            />
                        </div>

                        {/* Controls */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                            }}
                        >
                            {/* Shuffle */}
                            <button
                                onClick={toggleShuffle}
                                style={{
                                    background: isShuffled ? "rgba(0,229,255,0.12)" : "transparent",
                                    border: "none",
                                    color: isShuffled ? "var(--accent-cyan)" : "var(--text-muted)",
                                    cursor: "pointer",
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    fontSize: 14,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s",
                                }}
                                title="Shuffle"
                            >
                                🔀
                            </button>

                            {/* Prev */}
                            <button
                                onClick={prev}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    fontSize: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                ⏮
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={isPlaying ? pause : play}
                                style={{
                                    background: "var(--gradient-accent)",
                                    border: "none",
                                    color: "#060a14",
                                    cursor: "pointer",
                                    width: 42,
                                    height: 42,
                                    borderRadius: "50%",
                                    fontSize: 18,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: isPlaying ? "0 0 20px rgba(0,229,255,0.3)" : "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                {isPlaying ? "⏸" : "▶"}
                            </button>

                            {/* Next */}
                            <button
                                onClick={next}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    fontSize: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                ⏭
                            </button>

                            {/* Volume */}
                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => setShowVolume((v) => !v)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        fontSize: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    title="Volume"
                                >
                                    {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                                </button>

                                {showVolume && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 40,
                                            right: -4,
                                            background: "rgba(10,14,26,0.95)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 10,
                                            padding: "12px 8px",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            style={{
                                                writingMode: "vertical-lr",
                                                direction: "rtl",
                                                height: 80,
                                                width: 20,
                                                accentColor: "var(--accent-cyan)",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Track list */}
                        <div
                            style={{
                                marginTop: 14,
                                maxHeight: 140,
                                overflowY: "auto",
                                borderTop: "1px solid rgba(255,255,255,0.06)",
                                paddingTop: 10,
                            }}
                        >
                            {tracks.map((t, i) => {
                                const realIdx = isShuffled
                                    ? shuffleOrder.indexOf(i)
                                    : i;
                                const isCurrent = getTrackIndex(currentIndex) === i;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setCurrentIndex(realIdx);
                                            setIsPlaying(true);
                                            setTimeout(() => audioRef.current?.play().catch(() => { }), 100);
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            width: "100%",
                                            padding: "6px 8px",
                                            background: isCurrent ? "rgba(0,229,255,0.08)" : "transparent",
                                            border: "none",
                                            borderRadius: 6,
                                            color: isCurrent ? "var(--accent-cyan)" : "var(--text-secondary)",
                                            cursor: "pointer",
                                            fontSize: 12,
                                            fontWeight: isCurrent ? 700 : 500,
                                            textAlign: "left",
                                            transition: "all 0.15s",
                                            fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        <span style={{ fontSize: 10, width: 14 }}>
                                            {isCurrent && isPlaying ? "♫" : ""}
                                        </span>
                                        <span
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {t.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Mini floating button */}
                <button
                    onClick={() => setIsExpanded((e) => !e)}
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: isPlaying
                            ? "var(--gradient-accent)"
                            : "rgba(14, 21, 40, 0.9)",
                        border: isPlaying
                            ? "none"
                            : "1px solid rgba(255,255,255,0.1)",
                        color: isPlaying ? "#060a14" : "var(--text-primary)",
                        fontSize: 22,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isPlaying
                            ? "0 0 25px rgba(0,229,255,0.3), 0 4px 20px rgba(0,0,0,0.4)"
                            : "0 4px 20px rgba(0,0,0,0.4)",
                        transition: "all 0.3s",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        animation: isPlaying ? "glowPulse 3s ease-in-out infinite" : "none",
                    }}
                    title={isExpanded ? "Collapse" : "Music Player"}
                >
                    {isPlaying ? "♫" : "🎵"}
                </button>
            </div>
        </>
    );
}

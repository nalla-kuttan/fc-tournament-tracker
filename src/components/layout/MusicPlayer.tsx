'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import type { MusicTrack } from '@/lib/types';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
        }
      })
      .catch(() => { });
  }, []);

  const currentTrack = tracks[currentIndex];

  const play = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const prevTrack = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(() => { });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => nextTrack();

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextTrack]);

  if (tracks.length === 0) return null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <audio ref={audioRef} />
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(2, 6, 23, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(148, 163, 184, 0.06)',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          zIndex: 1300,
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Track Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 200 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MusicNoteIcon sx={{ color: '#22C55E', fontSize: 18 }} />
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.875rem' }}>
              {currentTrack?.title ?? 'No track'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }} noWrap>
              {currentTrack?.artist ?? ''}
            </Typography>
          </Box>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={prevTrack}
            size="small"
            sx={{
              color: '#94A3B8',
              transition: 'color 150ms ease',
              '&:hover': { color: '#F8FAFC' },
            }}
          >
            <SkipPreviousIcon />
          </IconButton>
          <IconButton
            onClick={isPlaying ? pause : play}
            sx={{
              color: '#020617',
              bgcolor: '#22C55E',
              width: 36,
              height: 36,
              transition: 'all 200ms ease',
              '&:hover': {
                bgcolor: '#4ADE80',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              },
            }}
          >
            {isPlaying ? <PauseIcon sx={{ fontSize: 20 }} /> : <PlayArrowIcon sx={{ fontSize: 20 }} />}
          </IconButton>
          <IconButton
            onClick={nextTrack}
            size="small"
            sx={{
              color: '#94A3B8',
              transition: 'color 150ms ease',
              '&:hover': { color: '#F8FAFC' },
            }}
          >
            <SkipNextIcon />
          </IconButton>
        </Box>

        {/* Progress */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748B', minWidth: 40, fontSize: '0.7rem' }}>
            {formatTime(progress)}
          </Typography>
          <Slider
            value={progress}
            max={duration || 100}
            onChange={(_, v) => {
              if (audioRef.current) {
                audioRef.current.currentTime = v as number;
              }
            }}
            size="small"
            sx={{
              color: '#22C55E',
              '& .MuiSlider-track': {
                background: 'linear-gradient(90deg, #22C55E, #3B82F6)',
              },
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover': {
                  boxShadow: '0 0 0 6px rgba(34, 197, 94, 0.15)',
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.15,
              },
            }}
          />
          <Typography variant="caption" sx={{ color: '#64748B', minWidth: 40, fontSize: '0.7rem' }}>
            {formatTime(duration)}
          </Typography>
        </Box>

        {/* Volume */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 120 }}>
          <IconButton
            onClick={() => setVolume((v) => (v === 0 ? 0.5 : 0))}
            size="small"
            sx={{
              color: '#64748B',
              transition: 'color 150ms ease',
              '&:hover': { color: '#94A3B8' },
            }}
          >
            {volume === 0 ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
          </IconButton>
          <Slider
            value={volume}
            max={1}
            step={0.05}
            onChange={(_, v) => setVolume(v as number)}
            size="small"
            sx={{
              color: '#64748B',
              '& .MuiSlider-thumb': {
                width: 10,
                height: 10,
              },
              '& .MuiSlider-rail': {
                opacity: 0.15,
              },
            }}
          />
        </Box>
      </Box>
    </>
  );
}

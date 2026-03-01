'use client';

import { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { RegisteredPlayer } from '@/lib/types';

interface Props {
  label: string;
  value: RegisteredPlayer | null;
  onChange: (player: RegisteredPlayer | null) => void;
  excludeId?: string;
}

export default function PlayerSelector({ label, value, onChange, excludeId }: Props) {
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((data) => setPlayers(data))
      .catch(() => {});
  }, []);

  const filtered = excludeId ? players.filter((p) => p.id !== excludeId) : players;

  return (
    <Autocomplete
      options={filtered}
      getOptionLabel={(option) => `${option.name} (${option.base_team})`}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={(params) => <TextField {...params} label={label} />}
      isOptionEqualToValue={(option, val) => option.id === val.id}
    />
  );
}

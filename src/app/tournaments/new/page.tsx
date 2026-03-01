import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CreateTournamentForm from '@/components/tournament/CreateTournamentForm';

export default function NewTournamentPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Create Tournament
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Set up a new tournament with your friends
      </Typography>
      <CreateTournamentForm />
    </Box>
  );
}

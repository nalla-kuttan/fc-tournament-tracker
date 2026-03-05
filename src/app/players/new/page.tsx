import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RegisterPlayerForm from '@/components/player/RegisterPlayerForm';
import BackButton from '@/components/shared/BackButton';

export default function NewPlayerPage() {
  return (
    <Box>
      <BackButton />
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Register Player
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Add a new player to the global registry
      </Typography>
      <RegisterPlayerForm />
    </Box>
  );
}

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GlassCard from '@/components/shared/GlassCard';
import type { PerformanceRecords, RecordEntry } from '@/lib/records/types';

interface Highlight {
  title: string;
  entry: RecordEntry;
  suffix: string;
}

export default function AdvancedHighlights({ records }: { records: PerformanceRecords }) {
  const highlights: Array<Highlight | null> = [
    leader('Finishing Efficiency', records.finishingEfficiency, '%'),
    leader('xG Overperformance', records.xgOverperformance),
    leader('Counterpunch Rate', records.counterpunchWinRate, '%'),
    leader('MOTM Rate', records.motmRate, '%'),
    leader('Defensive Work Rate', records.defensiveWorkRate),
    leader('Pressure Performance', records.pressurePerformance, '%'),
  ];
  const qualified = highlights.filter((highlight): highlight is Highlight => highlight != null);
  if (qualified.length === 0) return null;

  return (
    <Box component="section" aria-labelledby="advanced-highlights-title" sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography id="advanced-highlights-title" component="h2" variant="h6" fontWeight={700}>Advanced Highlights</Typography>
          <Typography variant="body2" color="text.secondary">Qualified leaders for the current analytics lens.</Typography>
        </Box>
        <Button component={Link} href="/competitive" endIcon={<ArrowForwardIcon />} size="small">Complete record book</Button>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
        {qualified.map(({ title, entry, suffix }) => (
          <GlassCard key={title} sx={{ height: '100%' }}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{title}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mt: 0.75 }}>
                <Typography fontWeight={700} noWrap>{entry.playerName}</Typography>
                <Typography fontWeight={800} sx={{ color: '#4ADE80' }}>{entry.value}{suffix}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" noWrap>{entry.detail}</Typography>
            </CardContent>
          </GlassCard>
        ))}
      </Box>
    </Box>
  );
}

function leader(title: string, entries: RecordEntry[], suffix = ''): Highlight | null {
  return entries[0] ? { title, entry: entries[0], suffix } : null;
}

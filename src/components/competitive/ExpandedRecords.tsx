import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RecordBoard, { type RecordBoardRow } from './RecordBoard';
import type { ExpandedRecords as ExpandedRecordsData, RivalryRecord, TeamRecord } from '@/lib/records/types';

interface Board {
  title: string;
  rows: RecordBoardRow[];
  suffix?: string;
}

function rivalryRows(rows: RivalryRecord[]): RecordBoardRow[] {
  return rows.map((row) => ({ ...row, playerName: `${row.playerName} vs ${row.opponentName}` }));
}

function teamRows(rows: TeamRecord[]): RecordBoardRow[] {
  return rows.map((row) => ({ ...row, playerName: `${row.playerName} · ${row.team}` }));
}

function RecordSection({ id, title, description, boards }: { id: string; title: string; description: string; boards: Board[] }) {
  return (
    <Box component="section" aria-labelledby={id} sx={{ contentVisibility: 'auto', containIntrinsicSize: '640px', mt: 3 }}>
      <Typography id={id} component="h3" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{title}</Typography>
      <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', mt: 0.25, mb: 1.5 }}>{description}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {boards.map((board) => <RecordBoard key={board.title} {...board} />)}
      </Box>
    </Box>
  );
}

export default function ExpandedRecords({ records }: { records: ExpandedRecordsData }) {
  const { runs, campaigns, performance, rivalries, teams } = records;
  return (
    <Box component="section" aria-labelledby="expanded-records-title" sx={{ mt: 3 }}>
      <Typography id="expanded-records-title" component="h2" sx={{ fontWeight: 700, fontSize: '1.4rem' }}>Expanded Record Book</Typography>
      <Typography sx={{ color: '#B6C3D5', mt: 0.5 }}>Records derived only from scorelines and match statistics captured by the tracker.</Typography>

      <RecordSection id="runs-records-title" title="Runs & Resilience" description="Career sequences, responses to defeat, dominance, and single-match scoring." boards={[
        { title: 'Longest Unbeaten Run', rows: runs.longestUnbeaten },
        { title: 'Longest Scoring Run', rows: runs.longestScoring },
        { title: 'Longest MOTM Streak', rows: runs.longestMotm },
        { title: 'Bounce-Back Rate', rows: runs.bounceBack, suffix: '%' },
        { title: 'Dominance Rate', rows: runs.dominanceRate, suffix: '%' },
        { title: '3+ Goal Performances', rows: runs.threePlusGoals },
        { title: '4+ Goal Performances', rows: runs.fourPlusGoals },
        { title: 'Best Match Output', rows: runs.bestMatchOutput },
      ]} />

      <RecordSection id="campaign-records-title" title="Campaign Dominance" description="Completed campaigns with at least three eligible matches." boards={[
        { title: 'Perfect Campaigns', rows: campaigns.perfectCampaigns.map((row) => ({ ...row, playerName: `${row.playerName} · ${row.tournamentName}` })) },
        { title: 'Unbeaten Campaigns', rows: campaigns.unbeatenCampaigns.map((row) => ({ ...row, playerName: `${row.playerName} · ${row.tournamentName}` })) },
        { title: 'Best Campaign Goal Difference', rows: campaigns.bestGoalDifference.map((row) => ({ ...row, playerName: `${row.playerName} · ${row.tournamentName}` })) },
        { title: 'Largest League Title Margin', rows: campaigns.largestTitleMargins.map((row) => ({ ...row, playerName: `${row.playerName} · ${row.tournamentName}` })) },
      ]} />

      <RecordSection id="performance-records-title" title="Advanced Performance" description="Qualified xG, possession, MOTM, defensive-action, rating, and pressure metrics." boards={[
        { title: 'Finishing Efficiency', rows: performance.finishingEfficiency, suffix: '%' },
        { title: 'xG Overperformance', rows: performance.xgOverperformance },
        { title: 'Defensive xG Overperformance', rows: performance.defensiveXgOverperformance },
        { title: 'Counterpunch Win Rate', rows: performance.counterpunchWinRate, suffix: '%' },
        { title: 'MOTM Rate', rows: performance.motmRate, suffix: '%' },
        { title: 'Defensive Work Rate', rows: performance.defensiveWorkRate },
        { title: 'Rating Consistency', rows: performance.ratingConsistency },
        { title: 'Expected Points Surplus', rows: performance.expectedPointsSurplus },
        { title: 'Pressure Performance', rows: performance.pressurePerformance, suffix: '%' },
      ]} />

      <RecordSection id="rivalry-records-title" title="Rivalries" description="Head-to-head records require at least five direct meetings." boards={[
        { title: 'Most-Played Rivalry', rows: rivalryRows(rivalries.mostPlayed) },
        { title: 'Rivalry Dominance', rows: rivalryRows(rivalries.dominance), suffix: '%' },
        { title: 'Rivalry Reversals', rows: rivalryRows(rivalries.reversals) },
        { title: 'Nemesis Index', rows: rivalryRows(rivalries.nemesisIndex), suffix: '%' },
        { title: 'Closest Rivalry', rows: rivalryRows(rivalries.closest) },
      ]} />

      <RecordSection id="team-records-title" title="Teams" description="Selected-team records use the club or national team chosen for each tournament." boards={[
        { title: 'Club Specialist', rows: teamRows(teams.clubSpecialists), suffix: '%' },
        { title: 'Best Player / Team Combination', rows: teamRows(teams.bestCombinations), suffix: '%' },
        { title: 'Most Versatile Winner', rows: teams.versatileWinners },
      ]} />
    </Box>
  );
}

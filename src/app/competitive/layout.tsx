import StatsNavigation from '@/components/analytics/StatsNavigation';
export default function CompetitiveLayout({ children }: { children: React.ReactNode }) {
  return <><StatsNavigation />{children}</>;
}

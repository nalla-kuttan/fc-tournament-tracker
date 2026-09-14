import StatsNavigation from '@/components/analytics/StatsNavigation';
export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <><StatsNavigation />{children}</>;
}

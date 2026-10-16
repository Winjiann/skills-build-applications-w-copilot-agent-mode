import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiData<LeaderboardResponse>('/api/leaderboard');
  const leaderboard = data?.leaderboard ?? [];

  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {loading ? <p role="status">Loading leaderboard...</p> : error ? <p role="alert">Unable to load leaderboard: {error}</p> : leaderboard.length === 0
      ? <p>No leaderboard rankings yet.</p>
      : <ol>{leaderboard.map((entry) => <li key={`${entry.rank}-${entry.teamName}`}>{entry.teamName}: {entry.totalPoints} points (rank {entry.rank})</li>)}</ol>}
  </CapabilityCard>;
}

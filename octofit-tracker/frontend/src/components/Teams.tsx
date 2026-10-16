import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type Team = { _id?: string; name: string; mascot?: string; members: unknown[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiData<TeamsResponse>('/api/teams');
  const teams = data?.teams ?? [];

  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {loading ? <p role="status">Loading teams...</p> : error ? <p role="alert">Unable to load teams: {error}</p> : teams.length === 0
      ? <p>No teams yet.</p>
      : <ul>{teams.map((team, index) => <li key={team._id ?? `${team.name}-${index}`}>{team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members.length} members</li>)}</ul>}
  </CapabilityCard>;
}

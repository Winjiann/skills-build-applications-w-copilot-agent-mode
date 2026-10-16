import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiData<ActivitiesResponse>('/api/activities');
  const activities = data?.activities ?? [];

  return <CapabilityCard title="Activities" description="Track student activity minutes and points.">
    {loading ? <p role="status">Loading activities...</p> : error ? <p role="alert">Unable to load activities: {error}</p> : activities.length === 0
      ? <p>No activities yet.</p>
      : <ul>{activities.map((activity, index) => <li key={activity._id ?? `${activity.type}-${index}`}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>)}</ul>}
  </CapabilityCard>;
}

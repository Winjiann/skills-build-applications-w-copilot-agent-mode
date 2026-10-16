import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../hooks/useApiData.js';

type WorkoutSuggestion = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type SuggestionsResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const email = 'mona@example.com';
  const { data, loading, error } = useApiData<SuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);
  const suggestions = data?.suggestions ?? [];

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
    {loading ? <p role="status">Loading workout suggestions...</p> : error ? <p role="alert">Unable to load workout suggestions: {error}</p> : suggestions.length === 0
      ? <p>No workout suggestions yet.</p>
      : <ul>{suggestions.map((suggestion, index) => <li key={`${suggestion.title}-${index}`}><strong>{suggestion.title}</strong> — {suggestion.focus}, {suggestion.minutes} minutes, {suggestion.difficulty}. {suggestion.reason}</li>)}</ul>}
  </CapabilityCard>;
}

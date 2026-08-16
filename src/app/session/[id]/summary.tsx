import { useLocalSearchParams } from 'expo-router';

import { SummaryScreen } from '@/features/summary';

/**
 * Sleep Summary route — loads persisted session by `[id]` (survives app restart).
 *
 * Sharing is not implemented; the mockup share icon is omitted so we do not ship a dead
 * affordance (Guideline 2.1).
 */
export default function SessionSummaryRoute() {
  const params = useLocalSearchParams<{ id: string; fromCalendar?: string }>();
  const sessionId =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const fromCalendarRaw = params.fromCalendar;
  const fromCalendar =
    fromCalendarRaw === '1' ||
    (Array.isArray(fromCalendarRaw) && fromCalendarRaw[0] === '1');

  return <SummaryScreen sessionId={sessionId} fromCalendar={fromCalendar} />;
}

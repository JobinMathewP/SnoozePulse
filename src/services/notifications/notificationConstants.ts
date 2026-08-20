/**
 * Local morning-summary notification (feature PRD §14). Copy matches that block
 * in intent; the OS presents it after a successful completed session.
 */
export const MORNING_NOTIFICATION = {
  channelId: 'morning-summary',
  channelName: 'Sleep summary',
  title: 'Your sleep summary is ready',
  body: 'See how you slept last night.',
  dataSessionIdKey: 'sessionId',
} as const;

export function summaryNotificationId(sessionId: string): string {
  return `summary:${sessionId}`;
}

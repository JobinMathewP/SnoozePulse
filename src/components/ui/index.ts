/**
 * Shared visual primitives.
 *
 * Screens compose from these rather than inventing layout per route. Styling values come
 * only from `src/theme/` — never literal colors, spacing, or radii.
 */

export { Screen } from './Screen';
export { Card, CardRow, type CardWidth } from './Card';
export { SectionHeader } from './SectionHeader';
export { StatusCard, type StatusCardTone } from './StatusCard';
export { MetricCard } from './MetricCard';
export { Button } from './Button';
export { ConfirmDialog } from './ConfirmDialog';
export { InfoDialog } from './InfoDialog';
export { ErrorPanel } from './ErrorPanel';
export { Waveform, type WaveformProps } from './Waveform';
export {
  TimelineCard,
  type TimelineBarModel,
  type TimelinePeakCallout,
} from './TimelineCard';
export { SegmentedControl, type SegmentOption } from './SegmentedControl';
export { TOUCH_TARGET, hitSlopForVisualSize } from './touchTarget';

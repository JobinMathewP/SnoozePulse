/**
 * Web stub — SnoozePulse does not target web (ADR / tech stack). Methods reject so a
 * mistaken web import fails loudly instead of silently no-oping.
 */

import type { NativeCalibrationPayload } from './SnoozePulseAudio.types';

const unsupported = async (): Promise<never> => {
  throw new Error('snoozepulse-audio is not available on web');
};

export default {
  HEARTBEAT_INTERVAL_MS: 150,
  startRecording: unsupported,
  stopRecording: unsupported,
  pauseRecording: unsupported,
  resumeRecording: unsupported,
  calibrate: unsupported as () => Promise<NativeCalibrationPayload>,
  addListener() {
    return { remove() {} };
  },
};

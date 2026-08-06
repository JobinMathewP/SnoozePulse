import type { AppError } from '@/types';

/**
 * User-facing titles and recovery hints for typed {@link AppError} values (Task 5.5).
 * Prefer these over raw `message` when presenting recovery UI.
 */
export function errorTitle(error: AppError): string {
  switch (error.code) {
    case 'PERMISSION_DENIED':
      return 'Microphone permission needed';
    case 'AUDIO_BUSY':
      return 'Microphone in use';
    case 'AUDIO_ENGINE':
      return 'Recording problem';
    case 'ILLEGAL_TRANSITION':
      return 'Session out of sync';
    case 'PERSISTENCE':
      return 'Could not save data';
    case 'STORAGE_QUOTA':
      return 'Storage nearly full';
    case 'NOT_FOUND':
      return 'Not found';
    case 'CALIBRATION':
      return 'Calibration failed';
  }
}

export function errorRecoveryHint(error: AppError): string {
  switch (error.code) {
    case 'PERMISSION_DENIED':
      return 'Allow microphone access in Settings, then try again.';
    case 'AUDIO_BUSY':
      return 'Close other apps using the mic, then try again.';
    case 'AUDIO_ENGINE':
      return 'End this session and start a new one.';
    case 'ILLEGAL_TRANSITION':
      return 'Return home and start a fresh session.';
    case 'PERSISTENCE':
      return 'Check free storage, then retry.';
    case 'STORAGE_QUOTA':
      return 'Older snore clips will be removed automatically. New clips may be skipped until space frees up.';
    case 'NOT_FOUND':
      return 'Go back and pick another night.';
    case 'CALIBRATION':
      return 'Find a quieter spot and try again.';
  }
}

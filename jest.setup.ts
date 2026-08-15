/**
 * Jest setup for SnoozePulse.
 */

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const View = require('react-native').View;
  const shared = (initial: number) => ({ value: initial });
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: unknown) => component,
      call: () => undefined,
    },
    makeMutable: shared,
    useSharedValue: (initial: number) => React.useRef({ value: initial }).current,
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (toValue: number) => toValue,
    Easing: { out: () => undefined, cubic: undefined },
  };
});

jest.mock('react-native-worklets', () => ({}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(async () => undefined),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    duration: 0,
  })),
  setAudioModeAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(async () => false),
  requestReview: jest.fn(async () => undefined),
  hasAction: jest.fn(async () => false),
  storeUrl: jest.fn(() => null),
}));

jest.mock('expo-file-system', () => ({
  Paths: {
    document: 'file:///document/',
    availableDiskSpace: 10 * 1024 * 1024 * 1024,
    totalDiskSpace: 64 * 1024 * 1024 * 1024,
  },
  Directory: class {
    uri = 'file:///document/snippets/';
    exists = true;
    create() {
      return undefined;
    }
    list() {
      return [];
    }
  },
  File: class {
    uri = '';
    exists = false;
    size = 0;
    lastModified = 0;
    delete() {
      return undefined;
    }
  },
}));

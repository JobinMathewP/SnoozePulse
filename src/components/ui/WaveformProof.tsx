import { memo, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Text, View } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { Waveform } from './Waveform';

const STREAM_HZ = 10;
const PROOF_MS = 2000;
const TICK_MS = 1000 / STREAM_HZ;

type WaveformProofProps = {
  /** Called once when the 10 Hz burst finishes, with the React render count. */
  readonly onComplete?: (renderCount: number) => void;
};

/**
 * Mountable harness that drives `Waveform.level` at 10 Hz for two seconds and counts
 * React renders of the waveform subtree.
 *
 * The waveform is isolated in a `memo` child so status `setState` calls in the controller
 * cannot invalidate it. Expected result: render count = 1 while the shared value ticks
 * ~20 times (ADR-13).
 */
export function WaveformProof({ onComplete }: WaveformProofProps) {
  const level = useSharedValue(0.2);
  const renderCountRef = useRef(0);

  return (
    <View style={{ gap: spacing.md, alignItems: 'center', padding: spacing.md }}>
      <Text
        style={{
          color: colors.fg,
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.body,
          lineHeight: lineHeight.body,
        }}
      >
        Waveform 10 Hz proof
      </Text>
      <CountedWaveform level={level} renderCountRef={renderCountRef} />
      <ProofController level={level} renderCountRef={renderCountRef} onComplete={onComplete} />
    </View>
  );
}

type CountedProps = {
  readonly level: SharedValue<number>;
  readonly renderCountRef: MutableRefObject<number>;
};

const CountedWaveform = memo(function CountedWaveform({ level, renderCountRef }: CountedProps) {
  useEffect(() => {
    renderCountRef.current += 1;
  });

  return <Waveform level={level} width={spacing.xl * 10} height={spacing.xl * 3} />;
});

type ControllerProps = {
  readonly level: SharedValue<number>;
  readonly renderCountRef: MutableRefObject<number>;
  readonly onComplete?: (renderCount: number) => void;
};

function ProofController({ level, renderCountRef, onComplete }: ControllerProps) {
  const [phase, setPhase] = useState<'running' | 'done'>('running');
  const [tickCount, setTickCount] = useState(0);
  const [finalRenders, setFinalRenders] = useState<number | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    const started = Date.now();
    let ticks = 0;

    const id = setInterval(() => {
      ticks += 1;
      level.value = 0.15 + 0.8 * Math.abs(Math.sin(ticks / 3));
      setTickCount(ticks);

      if (Date.now() - started >= PROOF_MS) {
        clearInterval(id);
        if (!finished.current) {
          finished.current = true;
          const renders = renderCountRef.current;
          setFinalRenders(renders);
          setPhase('done');
          onComplete?.(renders);
          console.log(
            `[WaveformProof] done — React renders=${renders}, shared-value ticks=${ticks}, stream=${STREAM_HZ}Hz`,
          );
        }
      }
    }, TICK_MS);

    return () => {
      clearInterval(id);
    };
  }, [level, onComplete, renderCountRef]);

  return (
    <Text
      style={{
        color: colors.fgCaption,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.caption,
        lineHeight: lineHeight.caption,
        textAlign: 'center',
      }}
    >
      {phase === 'running'
        ? `Streaming… ticks=${tickCount}`
        : `Done. React renders=${finalRenders} (expect 1). Ticks=${tickCount}`}
    </Text>
  );
}

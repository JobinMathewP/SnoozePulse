import { Text } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight } from '@/theme';

import type { HeadingPart } from './copy';

type HighlightHeadingProps = {
  readonly parts: readonly HeadingPart[];
};

/** Mockup heading: white Inter bold with a sampled-violet span. */
export function HighlightHeading({ parts }: HighlightHeadingProps) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: colors.fg,
        fontFamily: fontFamily.bold,
        fontSize: fontSize.heading,
        lineHeight: lineHeight.heading,
        textAlign: 'center',
      }}
    >
      {parts.map((part, i) => (
        <Text
          key={`${part.text}-${i}`}
          style={{
            color: part.accent ? colors.onboardAccentMuted : colors.fg,
            fontFamily: fontFamily.bold,
            fontSize: fontSize.heading,
            lineHeight: lineHeight.heading,
          }}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

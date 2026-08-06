import { Pressable, ScrollView, Text } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type { SnoreScoreBand } from '@/types';

import type { DayColumnModel } from './mock';

type DayScoreStripProps = {
  readonly days: readonly DayColumnModel[];
  readonly selectedDate: string;
  readonly onSelect: (date: string) => void;
  readonly testID?: string;
};

const bandColor = (band: SnoreScoreBand): string => {
  switch (band) {
    case 'mild':
      return colors.successText;
    case 'moderate':
      return colors.warning;
    case 'heavy':
      return colors.alertText;
  }
};

/**
 * Horizontal snore-score day strip from history-screen.jpg.
 * Selected day gets a thin ring in its band colour.
 */
export function DayScoreStrip({ days, selectedDate, onSelect, testID }: DayScoreStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: days.length <= 7 ? 'space-between' : 'flex-start',
        gap: days.length <= 7 ? spacing.xs : spacing.sm,
        paddingVertical: spacing.xs,
      }}
      testID={testID}
    >
      {days.map((day) => {
        const selected = day.summary.date === selectedDate;
        const accent = bandColor(day.band);
        return (
          <Pressable
            key={day.summary.date}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${day.weekdayLabel} ${day.dayNumberLabel}, ${day.bandLabel}`}
            onPress={() => {
              onSelect(day.summary.date);
            }}
            style={{
              alignItems: 'center',
              minWidth: spacing.xl + spacing.md,
              minHeight: spacing.xl + spacing.lg,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xs,
              borderRadius: spacing.xl,
              borderWidth: selected ? 1.5 : 0,
              borderColor: selected ? accent : colors.bgApp,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: colors.fgCaption,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.caption,
                lineHeight: lineHeight.caption,
                opacity: 0.7,
              }}
            >
              {day.weekdayLabel}
            </Text>
            <Text
              style={{
                color: colors.fg,
                fontFamily: fontFamily.semibold,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
                marginTop: spacing.xs / 2,
              }}
            >
              {day.dayNumberLabel}
            </Text>
            <Text
              style={{
                color: accent,
                fontFamily: fontFamily.medium,
                fontSize: fontSize.caption,
                lineHeight: lineHeight.caption,
                marginTop: spacing.xs,
              }}
            >
              {day.bandLabel}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

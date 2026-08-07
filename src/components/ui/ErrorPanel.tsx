import { Pressable, Text, View } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type { AppError } from '@/types';
import { errorRecoveryHint, errorTitle } from '@/utils';

import { Button } from './Button';
import { Card } from './Card';
import { TOUCH_TARGET } from './touchTarget';

type ErrorPanelProps = {
  readonly error: AppError;
  /** Optional override of the body (defaults to error.message + recovery hint). */
  readonly detail?: string;
  readonly primaryLabel: string;
  readonly primaryAccessibilityLabel: string;
  readonly onPrimary: () => void;
  readonly secondaryLabel?: string;
  readonly secondaryAccessibilityLabel?: string;
  readonly onSecondary?: () => void;
  readonly testID?: string;
};

/**
 * Recoverable failure surface — title, typed detail, and one or two actions (Task 5.5).
 */
export function ErrorPanel({
  error,
  detail,
  primaryLabel,
  primaryAccessibilityLabel,
  onPrimary,
  secondaryLabel,
  secondaryAccessibilityLabel,
  onSecondary,
  testID,
}: ErrorPanelProps) {
  const body = detail ?? `${error.message}\n${errorRecoveryHint(error)}`;

  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="comfortable" testID={testID}>
      <View style={{ gap: spacing.sm }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.alertText,
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.title,
            lineHeight: lineHeight.title,
          }}
        >
          {errorTitle(error)}
        </Text>
        <Text
          accessibilityRole="alert"
          style={{
            color: colors.fgBody,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
          }}
        >
          {body}
        </Text>
        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          <Button
            variant="primary"
            label={primaryLabel}
            accessibilityLabel={primaryAccessibilityLabel}
            onPress={onPrimary}
            testID={testID ? `${testID}-primary` : undefined}
          />
          {secondaryLabel && onSecondary && secondaryAccessibilityLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={secondaryAccessibilityLabel}
              onPress={onSecondary}
              style={{
                minHeight: TOUCH_TARGET,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
              }}
              testID={testID ? `${testID}-secondary` : undefined}
            >
              <Text
                style={{
                  color: colors.fgCaption,
                  fontFamily: fontFamily.medium,
                  fontSize: fontSize.body,
                  lineHeight: lineHeight.body,
                }}
              >
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

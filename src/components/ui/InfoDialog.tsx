import { Modal, Pressable, Text } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { TOUCH_TARGET } from './touchTarget';

type InfoDialogProps = {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly dismissLabel: string;
  readonly dismissAccessibilityLabel: string;
  readonly onDismiss: () => void;
  readonly testID?: string;
};

/**
 * Single-button explanatory modal (e.g. "what does the Snoring Timeline show?"). Distinct
 * from {@link ConfirmDialog}: there is no risky action, just an acknowledgement — so the only
 * control dismisses. Backdrop tap and hardware back also dismiss.
 */
export function InfoDialog({
  visible,
  title,
  message,
  dismissLabel,
  dismissAccessibilityLabel,
  onDismiss,
  testID,
}: InfoDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID={testID}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dismissAccessibilityLabel}
        onPress={onDismiss}
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            width: '100%',
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.borderCard,
            padding: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.title,
              lineHeight: lineHeight.title,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.fgBody,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {message}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissAccessibilityLabel}
            onPress={onDismiss}
            style={{
              minHeight: TOUCH_TARGET,
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: spacing.sm,
            }}
          >
            <Text
              style={{
                color: colors.fg,
                fontFamily: fontFamily.semibold,
                fontSize: fontSize.body,
              }}
            >
              {dismissLabel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

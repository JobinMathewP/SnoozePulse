import { Modal, Pressable, Text, View } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { TOUCH_TARGET } from './touchTarget';

type ConfirmDialogProps = {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly confirmAccessibilityLabel: string;
  readonly cancelLabel: string;
  readonly cancelAccessibilityLabel: string;
  /** Tints the confirm action with the alert color for irreversible actions. */
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly testID?: string;
};

/**
 * Centered modal confirmation for consequential choices — discarding a too-short session
 * (ADR-30) and wiping all data in Settings. Cancel is always the safe default (backdrop tap
 * and hardware back both cancel); the confirm button carries the risk tint when destructive.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  confirmAccessibilityLabel,
  cancelLabel,
  cancelAccessibilityLabel,
  destructive = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cancelAccessibilityLabel}
        onPress={onCancel}
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

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelAccessibilityLabel}
              onPress={onCancel}
              style={{
                minHeight: TOUCH_TARGET,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: colors.fgBody,
                  fontFamily: fontFamily.medium,
                  fontSize: fontSize.body,
                }}
              >
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmAccessibilityLabel}
              onPress={onConfirm}
              style={{
                minHeight: TOUCH_TARGET,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: destructive ? colors.alert : colors.primary,
              }}
            >
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.body,
                }}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

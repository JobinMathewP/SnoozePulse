import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, radius, shadows, spacing } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SettingsIcon = {
  readonly ion?: IoniconName;
  readonly image?: number;
  readonly imageAccessibilityLabel?: string;
};

type SettingsRowProps = {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly onPress?: () => void;
  readonly icon?: SettingsIcon;
  readonly description?: string;
  /** `link` shows an external-link glyph; `nav` a chevron; `destructive` tints the row; `none` no trailing. */
  readonly variant?: 'link' | 'nav' | 'destructive' | 'none';
  readonly accessory?: ReactNode;
  /**
   * When true with `onPress`, only the label/icon cluster is pressable. `accessory`
   * stays a sibling so a Switch can receive its own Android touches.
   */
  readonly isolateAccessory?: boolean;
  readonly accessibilityRole?: 'button' | 'switch';
  readonly checked?: boolean;
  readonly testID?: string;
};

const ICON_TILE = spacing.xl + spacing.sm;

function IconTile({ icon, destructive }: { readonly icon: SettingsIcon; readonly destructive: boolean }) {
  if (icon.image !== undefined) {
    return (
      <View
        style={{
          width: ICON_TILE,
          height: ICON_TILE,
          borderRadius: radius.md,
          backgroundColor: colors.bgOled,
          overflow: 'hidden',
          ...shadows.settingsGlow,
        }}
      >
        <Image
          source={icon.image}
          contentFit="contain"
          style={{ width: ICON_TILE, height: ICON_TILE }}
          accessibilityLabel={icon.imageAccessibilityLabel}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: ICON_TILE,
        height: ICON_TILE,
        borderRadius: radius.md,
        backgroundColor: destructive ? 'transparent' : colors.settingsIconTile,
        alignItems: 'center',
        justifyContent: 'center',
        ...(destructive ? undefined : shadows.settingsGlow),
      }}
    >
      {icon.ion ? (
        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no"
          name={icon.ion}
          size={fontSize.title}
          color={destructive ? colors.settingsDestructive : colors.settingsAccent}
        />
      ) : null}
    </View>
  );
}

/**
 * One Settings row (optional leading tile, label, trailing affordance). Presentational so
 * the screen does not repeat the 44 dp target or card padding.
 */
export function SettingsRow({
  label,
  accessibilityLabel,
  onPress,
  icon,
  description,
  variant = 'nav',
  accessory,
  isolateAccessory = false,
  accessibilityRole = 'button',
  checked,
  testID,
}: SettingsRowProps) {
  const destructive = variant === 'destructive';
  const trailing =
    variant === 'link' ? 'open-outline' : variant === 'none' ? null : 'chevron-forward';
  const trailingColor = destructive ? colors.settingsDestructive : colors.fgCaption;

  const leading = (
    <>
      {icon ? <IconTile icon={icon} destructive={destructive} /> : null}
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text
          style={{
            color: destructive ? colors.settingsDestructive : colors.fg,
            fontFamily: fontFamily.medium,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
          }}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </>
  );

  const trailingIcon = trailing ? (
    <Ionicons
      accessibilityElementsHidden
      importantForAccessibility="no"
      name={trailing}
      size={fontSize.bodyLg}
      color={trailingColor}
    />
  ) : null;

  const rowStyle = {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    gap: spacing.md,
  };

  if (onPress && isolateAccessory) {
    return (
      <View style={rowStyle} testID={testID}>
        <Pressable
          accessibilityRole={accessibilityRole}
          accessibilityState={
            accessibilityRole === 'switch' ? { checked: checked === true } : undefined
          }
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          style={{
            flex: 1,
            minHeight: TOUCH_TARGET,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          {leading}
        </Pressable>
        {accessory}
      </View>
    );
  }

  const body = (
    <>
      {leading}
      {accessory}
      {trailingIcon}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityState={
          accessibilityRole === 'switch' ? { checked: checked === true } : undefined
        }
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={rowStyle}
        testID={testID}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View style={rowStyle} testID={testID}>
      {body}
    </View>
  );
}

type SettingsSectionProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
};

/** Uppercase section label + grouped card. */
export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        accessibilityRole="header"
        style={{
          color: colors.settingsSection,
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.caption,
          lineHeight: lineHeight.caption,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginLeft: spacing.xs,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.settingsCard,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.settingsCardBorder,
          paddingHorizontal: spacing.md,
        }}
      >
        {children}
      </View>
      {footer}
    </View>
  );
}

export function SettingsDivider() {
  return <View style={{ height: 1, backgroundColor: colors.settingsCardBorder }} />;
}

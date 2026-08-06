import { type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type ScreenBackground = 'app' | 'oled';

type ScreenProps = {
  readonly children: ReactNode;
  /**
   * `fixed` — content fills the viewport (Active Session).
   * `scroll` — content may grow past the viewport (Summary, History, Home).
   */
  readonly variant?: 'fixed' | 'scroll';
  /** `app` is the navy page fill; `oled` is true black for Active Session. */
  readonly background?: ScreenBackground;
  /** Safe-area edges to inset. Defaults to all four. */
  readonly edges?: readonly Edge[];
  readonly style?: StyleProp<ViewStyle>;
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

const backgroundColorFor = (background: ScreenBackground): string =>
  background === 'oled' ? colors.bgOled : colors.bgApp;

/**
 * Screen shell: safe area, background token, and scroll vs fixed layout.
 *
 * Every product screen should compose from this rather than wiring SafeAreaView and
 * ScrollView ad hoc, so padding and background stay consistent with the reference images.
 */
export function Screen({
  children,
  variant = 'fixed',
  background = 'app',
  edges = ['top', 'right', 'bottom', 'left'],
  style,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  const backgroundColor = backgroundColorFor(background);

  if (variant === 'scroll') {
    return (
      <SafeAreaView edges={[...edges]} style={[{ flex: 1, backgroundColor }, style]} testID={testID}>
        <ScrollView
          contentContainerStyle={[
            {
              flexGrow: 1,
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.lg,
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[...edges]} style={[{ flex: 1, backgroundColor }, style]} testID={testID}>
      <View
        style={[
          {
            flex: 1,
            paddingHorizontal: spacing.md,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

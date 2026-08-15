import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { colors, spacing } from '@/theme';

/**
 * Bottom tabs: Home and History only (ADR-09).
 * Settings is reached from the Home header gear, not from a third tab.
 */
export default function TabsLayout() {
  const pill = spacing.xl + spacing.sm;

  return (
    <Tabs
      screenOptions={{
        headerTintColor: colors.fg,
        headerStyle: { backgroundColor: colors.bgApp },
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', color: colors.fg },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabbar,
          borderTopColor: colors.borderCard,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: pill,
                height: pill,
                borderRadius: pill / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? colors.homeTabPill : 'transparent',
              }}
            >
              <Ionicons
                accessibilityElementsHidden
                importantForAccessibility="no"
                name="home"
                color={color}
                size={size}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarAccessibilityLabel: 'History tab',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="bar-chart-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

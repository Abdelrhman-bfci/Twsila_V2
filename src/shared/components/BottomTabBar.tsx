import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { BorderRadius, Colors, FontFamily, Shadows, Spacing } from '@core/theme';

const ICON_MAP: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  ExploreTab: { active: 'compass', inactive: 'compass-outline' },
  MyTripsTab: { active: 'bus', inactive: 'bus-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
  WalletTab: {
    active: 'wallet',
    inactive: 'wallet-outline',
  },
  MarketplaceTab: { active: 'storefront', inactive: 'storefront-outline' },
  MyBidsTab: { active: 'hammer', inactive: 'hammer-outline' },
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 14);

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {state.routes.map((route, idx) => {
        const focused = state.index === idx;
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;

        const icons =
          ICON_MAP[route.name] ??
          ({
            active: 'ellipse',
            inactive: 'ellipse-outline',
          } as const);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
            android_ripple={{
              color: Colors.primarySoft,
              borderless: false,
            }}
            style={({ pressed }) => [
              styles.itemPress,
              Platform.OS === 'web' && pressed && styles.itemPressWebHover,
            ]}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.item,
                  focused && styles.itemActive,
                  pressed && !focused && styles.itemPressed,
                ]}
              >
                <Ionicons
                  name={focused ? icons.active : icons.inactive}
                  size={focused ? 23 : 20}
                  color={focused ? Colors.primary : Colors.textLight}
                />
                <Text
                  style={[
                    styles.label,
                    focused && styles.labelActive,
                    pressed && styles.labelPressed,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    ...Shadows.elevated,
  },
  itemPress: {
    flex: 1,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  itemPressWebHover: {
    opacity: 0.92,
  },
  item: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.xl,
    minWidth: 68,
    width: '100%',
    maxWidth: 120,
    alignSelf: 'center',
  },
  itemActive: {
    backgroundColor: Colors.primarySoft,
  },
  itemPressed: {
    backgroundColor: Colors.surface1,
    transform: [{ scale: 0.97 }],
  },
  label: {
    marginTop: 5,
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.15,
  },
  labelActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  labelPressed: {
    color: Colors.text,
  },
});

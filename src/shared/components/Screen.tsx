import React from 'react';
import {
  StyleSheet,
  StatusBar,
  ScrollView,
  ScrollViewProps,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@core/theme';
import { useResponsiveLayout } from '@shared/hooks/useResponsiveLayout';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  background?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /**
   * When true, content is centered horizontally and capped at the responsive
   * `contentMaxWidth`. Use this for screens with structured content (forms,
   * dashboards, lists) that should look balanced on tablet & landscape.
   */
  centered?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  background = Colors.background,
  edges = ['top'],
  contentContainerStyle,
  scrollProps,
  style,
  padded = false,
  centered = false,
}) => {
  const { contentMaxWidth, isCompact } = useResponsiveLayout();

  const centeredWrapper: ViewStyle | null =
    centered && !isCompact
      ? {
          maxWidth: contentMaxWidth,
          width: '100%',
          alignSelf: 'center',
        }
      : null;

  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: background }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={background} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            padded && styles.padded,
            centeredWrapper,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padded && styles.padded, centeredWrapper, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  padded: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
});

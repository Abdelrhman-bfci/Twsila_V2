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

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  background?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
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
}) => {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: background }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={background} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            padded && styles.padded,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padded && styles.padded, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  padded: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
});

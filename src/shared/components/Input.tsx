import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  I18nManager,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  BorderRadius,
  Spacing,
  Typography,
  FontFamily,
} from '@core/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  helper,
  containerStyle,
  secureTextEntry,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(!!secureTextEntry);

  const showToggle = !!secureTextEntry;
  const effectiveRightIcon = showToggle
    ? isHidden
      ? 'eye-off-outline'
      : 'eye-outline'
    : rightIcon;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputBox,
          focused && styles.focused,
          !!error && styles.errorBorder,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? Colors.primary : Colors.textLight}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...rest}
          secureTextEntry={isHidden}
          style={[styles.input, rest.style]}
          placeholderTextColor={Colors.textLight}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />

        {effectiveRightIcon ? (
          <Pressable
            onPress={() => {
              if (showToggle) setIsHidden((v) => !v);
              else onRightIconPress?.();
            }}
            hitSlop={8}
          >
            <Ionicons
              name={effectiveRightIcon}
              size={18}
              color={Colors.textLight}
              style={styles.rightIcon}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.sm, alignSelf: 'stretch' },
  label: {
    ...Typography.labelMd,
    marginBottom: 6,
    color: Colors.text,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  errorBorder: { borderColor: Colors.error },
  input: {
    flex: 1,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    paddingVertical: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  leftIcon: { marginEnd: Spacing.xs },
  rightIcon: { marginStart: Spacing.xs },
  error: {
    ...Typography.labelSm,
    color: Colors.error,
    marginTop: 4,
  },
  helper: {
    ...Typography.labelSm,
    marginTop: 4,
    color: Colors.textLight,
  },
});

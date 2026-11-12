import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, palette } from '@/theme/colors';
import { layout, radius } from '@/theme/metrics';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: IconName;
  trailingIcon?: IconName;
  onTrailingIconPress?: () => void;
  isPassword?: boolean;
  prefix?: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  required?: boolean;
  rightLabel?: ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  icon,
  trailingIcon,
  onTrailingIconPress,
  isPassword = false,
  prefix,
  style,
  containerStyle,
  required,
  rightLabel,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = isPassword;
  const isSecure = isPassword ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="label-sm" weight={700} color={colors.brandNavy} uppercase>
            {label} {required ? <AppText color={colors.statusDanger}>*</AppText> : null}
          </AppText>
          {rightLabel}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}>
        {prefix ? (
          <View style={styles.prefixContainer}>
            {icon ? <Icon name={icon} size={18} color={colors.textMuted} /> : null}
            <AppText variant="label-md" weight={700} color={colors.brandNavy}>
              {prefix}
            </AppText>
          </View>
        ) : icon ? (
          <View style={styles.leadingIcon}>
            <Icon name={icon} size={20} color={colors.textMuted} />
          </View>
        ) : null}

        <TextInput
          {...rest}
          secureTextEntry={isSecure}
          placeholderTextColor={palette.slate400}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          style={styles.textInput}
        />

        {showPasswordToggle ? (
          <PressableScale
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.trailingAction}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}>
            <Icon
              name={isPasswordVisible ? 'visibility_off' : 'visibility'}
              size={20}
              color={colors.textMuted}
            />
          </PressableScale>
        ) : trailingIcon ? (
          <PressableScale
            onPress={onTrailingIconPress}
            disabled={!onTrailingIconPress}
            style={styles.trailingAction}>
            <Icon name={trailingIcon} size={20} color={colors.textMuted} />
          </PressableScale>
        ) : null}
      </View>

      {error ? (
        <AppText variant="body-sm" color={colors.statusDanger} style={styles.caption}>
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="body-sm" color={colors.textMuted} style={styles.caption}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  inputContainer: {
    height: layout.inputHeight,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: colors.secondary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.statusDanger,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    marginRight: 6,
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
  },
  leadingIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: colors.brandNavy,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    paddingVertical: 0,
  },
  trailingAction: {
    padding: 6,
    marginLeft: 4,
  },
  caption: {
    marginTop: 2,
    marginLeft: 2,
  },
});

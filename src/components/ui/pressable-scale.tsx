import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Pressed style applied on top of `style` (e.g. Tailwind `active:bg-*`). */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Tailwind `active:scale-95` → 0.95 (default), `active:scale-[0.98]` → 0.98. */
  activeScale?: number;
}

/**
 * Pressable that reproduces the `active:scale-95 transition-all` press
 * feedback used throughout the designs.
 */
export function PressableScale({
  style,
  pressedStyle,
  activeScale = 0.97,
  disabled,
  ...rest
}: PressableScaleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? [{ transform: [{ scale: activeScale }] }, pressedStyle] : null,
        disabled ? { opacity: 0.5 } : null,
      ]}
    />
  );
}

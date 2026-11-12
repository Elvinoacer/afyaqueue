import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, palette } from '@/theme/colors';
import { radius, shadows } from '@/theme/metrics';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

export interface ModalSheetProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  titleIcon?: IconName;
  titleIconColor?: string;
  showCloseButton?: boolean;
  showDragHandle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** If true, wraps in a full React Native Modal. If false, renders as a standalone sheet view (for Expo Router modal routes). */
  asModal?: boolean;
}

export function ModalSheet({
  visible = true,
  onClose,
  title,
  subtitle,
  titleIcon,
  titleIconColor = colors.secondary,
  showCloseButton = true,
  showDragHandle = true,
  children,
  footer,
  contentStyle,
  containerStyle,
  asModal = false,
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();

  const sheetContent = (
    <View
      style={[
        styles.sheet,
        { paddingBottom: Math.max(insets.bottom, 16) },
        containerStyle,
      ]}>
      {/* Top drag handle indicator */}
      {showDragHandle ? (
        <View style={styles.dragHandleWrapper}>
          <View style={styles.dragHandle} />
        </View>
      ) : null}

      {/* Sheet Header */}
      {title || showCloseButton ? (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {titleIcon ? (
              <View style={styles.iconCircle}>
                <Icon name={titleIcon} size={18} color={titleIconColor} />
              </View>
            ) : null}
            <View style={styles.titleTextCol}>
              {title ? (
                <AppText variant="headline-md" weight={700} color={colors.brandNavy} numberOfLines={1}>
                  {title}
                </AppText>
              ) : null}
              {subtitle ? (
                <AppText variant="body-sm" color={colors.textMuted} numberOfLines={1}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          </View>

          {showCloseButton && onClose ? (
            <PressableScale
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close sheet">
              <Icon name="close" size={20} color={colors.textMuted} />
            </PressableScale>
          ) : null}
        </View>
      ) : null}

      {/* Main Body */}
      <View style={[styles.body, contentStyle]}>{children}</View>

      {/* Optional sticky footer */}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  if (!asModal) {
    return sheetContent;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {sheetContent}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.lg,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.slate300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextCol: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexShrink: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

/** Font family names used by the icon component. */
export const ICON_FONT = 'MaterialSymbolsOutlined';
export const ICON_FONT_FILLED = 'MaterialSymbolsOutlinedFilled';

/** All fonts required before the first frame renders. */
export const appFonts = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
  [ICON_FONT]: require('@/assets/fonts/MaterialSymbolsOutlined.ttf'),
  [ICON_FONT_FILLED]: require('@/assets/fonts/MaterialSymbolsOutlinedFilled.ttf'),
};

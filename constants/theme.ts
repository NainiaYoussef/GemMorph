/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Cartier-inspired luxury color palette
const tintColorLight = '#C9A961'; // Cartier gold
const tintColorDark = '#D4AF37'; // Bright gold

export const Colors = {
  light: {
    text: '#000000', // Pure black like Cartier
    background: '#FFFFFF', // Pure white
    tint: tintColorLight,
    icon: '#666666',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorLight,
    primary: '#C9A961', // Cartier gold
    secondary: '#000000', // Black
    accent: '#F8F8F8', // Very light gray
    border: '#E5E5E5', // Subtle border
    gold: '#C9A961',
    black: '#000000',
    white: '#FFFFFF',
  },
  dark: {
    text: '#FFFFFF', // Pure white
    background: '#000000', // Pure black
    tint: tintColorDark,
    icon: '#999999',
    tabIconDefault: '#999999',
    tabIconSelected: tintColorDark,
    primary: '#D4AF37', // Bright gold
    secondary: '#FFFFFF', // White
    accent: '#1A1A1A', // Dark gray
    border: '#333333', // Dark border
    gold: '#D4AF37',
    black: '#000000',
    white: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

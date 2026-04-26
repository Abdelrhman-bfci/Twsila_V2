/**
 * Loads the Cairo font family.
 *
 * To enable custom fonts:
 *   1. Download the Cairo family (https://fonts.google.com/specimen/Cairo).
 *   2. Drop the .ttf files into `assets/fonts/` (see `assets/fonts/README.md`).
 *   3. Uncomment the `Font.loadAsync` block below.
 *
 * If left as-is, the app falls back to the system font, which still renders
 * Arabic text correctly on Android and iOS.
 */
export const loadFonts = async (): Promise<void> => {
  // import * as Font from 'expo-font';
  // await Font.loadAsync({
  //   'Cairo-Regular':   require('../../../assets/fonts/Cairo-Regular.ttf'),
  //   'Cairo-Medium':    require('../../../assets/fonts/Cairo-Medium.ttf'),
  //   'Cairo-SemiBold':  require('../../../assets/fonts/Cairo-SemiBold.ttf'),
  //   'Cairo-Bold':      require('../../../assets/fonts/Cairo-Bold.ttf'),
  //   'Cairo-ExtraBold': require('../../../assets/fonts/Cairo-ExtraBold.ttf'),
  //   'Cairo-Black':     require('../../../assets/fonts/Cairo-Black.ttf'),
  // });
};

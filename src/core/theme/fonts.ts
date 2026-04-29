import * as Font from 'expo-font';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black,
} from '@expo-google-fonts/cairo';

/**
 * Loads the Cairo font family.
 */
export const loadFonts = async (): Promise<void> => {
  await Font.loadAsync({
    'Cairo-Regular': Cairo_400Regular,
    'Cairo-Medium': Cairo_500Medium,
    'Cairo-SemiBold': Cairo_600SemiBold,
    'Cairo-Bold': Cairo_700Bold,
    'Cairo-ExtraBold': Cairo_800ExtraBold,
    'Cairo-Black': Cairo_900Black,
  });
};

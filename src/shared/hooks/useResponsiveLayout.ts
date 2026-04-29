import { useWindowDimensions } from 'react-native';

export type LayoutSize = 'compact' | 'medium' | 'wide';

export interface ResponsiveLayout {
  width: number;
  height: number;
  size: LayoutSize;
  isCompact: boolean;
  isMedium: boolean;
  isWide: boolean;
  contentMaxWidth: number;
  columns: number;
}

const COMPACT_BREAKPOINT = 600;
const WIDE_BREAKPOINT = 900;

export const useResponsiveLayout = (): ResponsiveLayout => {
  const { width, height } = useWindowDimensions();

  const size: LayoutSize =
    width < COMPACT_BREAKPOINT ? 'compact' : width < WIDE_BREAKPOINT ? 'medium' : 'wide';

  const columns = size === 'compact' ? 1 : size === 'medium' ? 2 : 3;
  const contentMaxWidth = size === 'wide' ? 1080 : size === 'medium' ? 720 : width;

  return {
    width,
    height,
    size,
    isCompact: size === 'compact',
    isMedium: size === 'medium',
    isWide: size === 'wide',
    contentMaxWidth,
    columns,
  };
};

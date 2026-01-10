import { useWindowDimensions } from 'react-native';

export type ScreenSize = 'phone' | 'tablet' | 'desktop';

export interface ResponsiveValues {
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: ScreenSize;
  width: number;
  height: number;
  // Responsive values
  numColumns: number;
  contentMaxWidth: number;
  horizontalPadding: number;
  cardSpacing: number;
}

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
};

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  const isPhone = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  const screenSize: ScreenSize = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone';

  // Responsive columns for grid layouts
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  // Max width for content to prevent stretching on large screens
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : width;

  // Adaptive padding
  const horizontalPadding = isDesktop ? 32 : isTablet ? 24 : 16;

  // Spacing between cards
  const cardSpacing = isDesktop ? 20 : isTablet ? 16 : 12;

  return {
    isPhone,
    isTablet,
    isDesktop,
    screenSize,
    width,
    height,
    numColumns,
    contentMaxWidth,
    horizontalPadding,
    cardSpacing,
  };
}

// Utility function for responsive values
export function useResponsiveValue<T>(values: { phone: T; tablet: T; desktop: T }): T {
  const { screenSize } = useResponsive();
  return values[screenSize];
}

import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const baseWidth = 375;
const baseHeight = 812;

export function wp(percentage: number): number {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
}

export function hp(percentage: number): number {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
}

export function scale(size: number): number {
  return Math.round((SCREEN_WIDTH / baseWidth) * size);
}

export function verticalScale(size: number): number {
  return Math.round((SCREEN_HEIGHT / baseHeight) * size);
}

export function moderateScale(size: number, factor: number = 0.5): number {
  return Math.round(size + (scale(size) - size) * factor);
}

export function normalizeFont(size: number): number {
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

export const deviceSizes = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
};

export function getResponsivePadding(): number {
  if (deviceSizes.isSmallDevice) return wp(4);
  if (deviceSizes.isMediumDevice) return wp(4.5);
  return wp(5);
}

export function getResponsiveFontSize(baseSize: number): number {
  if (deviceSizes.isSmallDevice) return normalizeFont(baseSize * 0.9);
  if (deviceSizes.isMediumDevice) return normalizeFont(baseSize);
  return normalizeFont(baseSize * 1.05);
}

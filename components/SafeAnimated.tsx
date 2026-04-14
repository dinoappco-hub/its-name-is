// Safe wrapper — pure JS fallbacks, no native dependencies
// Reanimated is loaded at runtime only when truly available

import { View, Text as RNText, ScrollView as RNScrollView } from 'react-native';

// Animated components are plain RN components (no animation on web preview)
const SafeAnimated = {
  View: View,
  Text: RNText,
  ScrollView: RNScrollView,
};

export default SafeAnimated;

// Hook stubs
export const useSharedValue = (init: any) => ({ value: init });
export const useAnimatedStyle = (_fn: any) => ({});
export const withTiming = (toValue: any, _config?: any, _cb?: any) => {
  // Execute callback synchronously for runOnJS compatibility
  if (_cb) { try { _cb(true); } catch {} }
  return toValue;
};
export const withRepeat = (anim: any) => anim;
export const withSpring = (toValue: any) => toValue;
export const withDelay = (_d: any, anim: any) => anim;
export const runOnJS = (fn: any) => fn;
export const interpolate = (val: number, input: number[], output: number[]) => {
  if (!input || !output || input.length < 2 || output.length < 2) return val;
  const ratio = (val - input[0]) / (input[input.length - 1] - input[0]);
  return output[0] + ratio * (output[output.length - 1] - output[0]);
};

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  bezier: () => (t: number) => t,
  inOut: (fn: any) => fn || ((t: number) => t),
  in: (fn: any) => fn || ((t: number) => t),
  out: (fn: any) => fn || ((t: number) => t),
  cubic: (t: number) => t,
};

// Layout animations — undefined means no entering/exiting animations
export const FadeIn = undefined;
export const FadeInDown = undefined;
export const FadeInUp = undefined;
export const FadeOut = undefined;
export const ZoomIn = undefined;

export const useAnimatedScrollHandler = () => undefined;

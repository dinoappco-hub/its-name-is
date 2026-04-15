// SafeAnimated — Uses real react-native-reanimated when available (native),
// falls back to RN Animated stubs on web or if reanimated fails to load.

import React, { forwardRef } from 'react';
import {
  View as RNView,
  Text as RNText,
  ScrollView as RNScrollView,
  Animated as RNAnimated,
  Platform,
} from 'react-native';

// ──────────────────────────────────────────────
// Try to load real react-native-reanimated
// ──────────────────────────────────────────────

let Reanimated: any = null;
try {
  Reanimated = require('react-native-reanimated');
} catch {}

// On Android, entering/layout animations can trigger C++ bad_function_call crashes
// in the native animation engine (Hermes + Reanimated JIT compilation issue).
// Only enable reanimated for shared values / withTiming / withSpring (stable).
// Disable entering/exiting layout animations on Android to prevent crashes.
const hasReanimated = !!(
  Reanimated &&
  Reanimated.default &&
  Reanimated.default.View &&
  typeof Reanimated.useSharedValue === 'function'
);

// Layout entering/exiting animations are only safe on iOS
const safeLayoutAnimations = hasReanimated && Platform.OS === 'ios';

// ──────────────────────────────────────────────
// If reanimated is available, re-export everything from it
// ──────────────────────────────────────────────

if (hasReanimated) {
  // We'll export at the bottom of the file
}

// ──────────────────────────────────────────────
// Fallback: stub wrapper components
// ──────────────────────────────────────────────

const FallbackAnimatedView = forwardRef<RNView, any>((props, ref) => {
  const { entering, exiting, layout, ...rest } = props;
  return <RNAnimated.View ref={ref} {...rest} />;
});
FallbackAnimatedView.displayName = 'FallbackAnimatedView';

const FallbackAnimatedText = forwardRef<RNText, any>((props, ref) => {
  const { entering, exiting, layout, ...rest } = props;
  return <RNAnimated.Text ref={ref} {...rest} />;
});
FallbackAnimatedText.displayName = 'FallbackAnimatedText';

const FallbackAnimatedScrollView = forwardRef<RNScrollView, any>((props, ref) => {
  const { entering, exiting, layout, ...rest } = props;
  return <RNAnimated.ScrollView ref={ref} {...rest} />;
});
FallbackAnimatedScrollView.displayName = 'FallbackAnimatedScrollView';

const FallbackAnimated = {
  View: FallbackAnimatedView,
  Text: FallbackAnimatedText,
  ScrollView: FallbackAnimatedScrollView,
};

// ──────────────────────────────────────────────
// Android-safe wrappers: use Reanimated's Animated.View for
// animated style support (useAnimatedStyle, SharedValues) but
// strip entering/exiting/layout props that crash on Android.
// ──────────────────────────────────────────────

let AndroidSafeAnimated: any = null;
if (hasReanimated && !safeLayoutAnimations) {
  const ReanimatedView = Reanimated.default.View;
  const ReanimatedText = Reanimated.default.Text;
  const ReanimatedScrollView = Reanimated.default.ScrollView;

  const SafeReanimatedView = forwardRef<RNView, any>((props, ref) => {
    const { entering, exiting, layout, ...rest } = props;
    return <ReanimatedView ref={ref} {...rest} />;
  });
  SafeReanimatedView.displayName = 'SafeReanimatedView';

  const SafeReanimatedText = forwardRef<RNText, any>((props, ref) => {
    const { entering, exiting, layout, ...rest } = props;
    return <ReanimatedText ref={ref} {...rest} />;
  });
  SafeReanimatedText.displayName = 'SafeReanimatedText';

  const SafeReanimatedScrollView = forwardRef<RNScrollView, any>((props, ref) => {
    const { entering, exiting, layout, ...rest } = props;
    return <ReanimatedScrollView ref={ref} {...rest} />;
  });
  SafeReanimatedScrollView.displayName = 'SafeReanimatedScrollView';

  AndroidSafeAnimated = {
    View: SafeReanimatedView,
    Text: SafeReanimatedText,
    ScrollView: SafeReanimatedScrollView,
  };
}

// ──────────────────────────────────────────────
// Fallback: chainable no-op stubs for layout animations
// ──────────────────────────────────────────────

function createStub(): any {
  const c: any = {};
  const methods = ['duration', 'delay', 'springify', 'damping', 'stiffness',
    'withInitialValues', 'withCallback', 'easing', 'build', 'mass',
    'overshootClamping', 'restDisplacementThreshold', 'restSpeedThreshold'];
  methods.forEach(m => { c[m] = (..._a: any[]) => c; });
  return c;
}

const stubFadeIn = createStub();
const stubFadeInDown = createStub();
const stubFadeInUp = createStub();
const stubFadeOut = createStub();
const stubZoomIn = createStub();

// ──────────────────────────────────────────────
// Fallback: shared value / animation helpers
// ──────────────────────────────────────────────

function fallbackUseSharedValue(init: any): any {
  const ref = React.useRef<any>(null);
  if (!ref.current) {
    ref.current = { _v: typeof init === 'number' ? init : 0 };
    Object.defineProperty(ref.current, 'value', {
      get() { return this._v; },
      set(v: any) {
        if (v && typeof v === 'object' && (v.__timing || v.__spring)) {
          this._v = typeof v.toValue === 'number' ? v.toValue : this._v;
          return;
        }
        if (typeof v === 'number') this._v = v;
      },
    });
  }
  return ref.current;
}

function fallbackUseAnimatedStyle(fn: () => any): any {
  try { return fn(); } catch { return {}; }
}

function fallbackWithTiming(toValue: any, _config?: any, _cb?: any): any {
  return { __timing: true, toValue, duration: _config?.duration || 300 };
}
function fallbackWithSpring(toValue: any, _config?: any): any {
  return { __spring: true, toValue };
}

const fallbackRunOnJS = (fn: any) => fn;
const fallbackWithRepeat = (_val: any, _c?: number, _r?: boolean) => _val;
const fallbackWithDelay = (_d: any, anim: any) => anim;

function fallbackInterpolate(val: number, input: number[], output: number[]): number {
  if (!input || !output || input.length < 2 || output.length < 2) return val;
  for (let i = 0; i < input.length - 1; i++) {
    if (val >= input[i] && val <= input[i + 1]) {
      const t = (val - input[i]) / (input[i + 1] - input[i] || 1);
      return output[i] + t * (output[i + 1] - output[i]);
    }
  }
  if (val <= input[0]) return output[0];
  return output[output.length - 1];
}

const fallbackEasing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  bezier: () => (t: number) => t,
  inOut: (_fn: any) => _fn || ((t: number) => t),
  in: (_fn: any) => _fn || ((t: number) => t),
  out: (_fn: any) => _fn || ((t: number) => t),
  cubic: (t: number) => t,
};

const fallbackUseAnimatedScrollHandler = () => undefined;

// ──────────────────────────────────────────────
// Export: real reanimated if available, stubs otherwise
// ──────────────────────────────────────────────

// On iOS with reanimated: use real Reanimated (full entering/exiting support).
// On Android with reanimated: use AndroidSafeAnimated wrappers that strip
//   entering/exiting/layout props to prevent C++ "Object is not a function" crashes,
//   while still supporting animated styles (useAnimatedStyle, SharedValues).
// Without reanimated: use FallbackAnimated (RN Animated with prop stripping).
const SafeAnimated = safeLayoutAnimations
  ? Reanimated.default
  : AndroidSafeAnimated || FallbackAnimated;
export default SafeAnimated;

// Layout entering/exiting animations — only enabled on iOS to prevent Android C++ crashes
export const FadeIn = safeLayoutAnimations ? Reanimated.FadeIn : stubFadeIn;
export const FadeInDown = safeLayoutAnimations ? Reanimated.FadeInDown : stubFadeInDown;
export const FadeInUp = safeLayoutAnimations ? Reanimated.FadeInUp : stubFadeInUp;
export const FadeOut = safeLayoutAnimations ? Reanimated.FadeOut : stubFadeOut;
export const ZoomIn = safeLayoutAnimations ? Reanimated.ZoomIn : stubZoomIn;

export const useSharedValue = hasReanimated ? Reanimated.useSharedValue : fallbackUseSharedValue;
export const useAnimatedStyle = hasReanimated ? Reanimated.useAnimatedStyle : fallbackUseAnimatedStyle;
export const withTiming = hasReanimated ? Reanimated.withTiming : fallbackWithTiming;
export const withSpring = hasReanimated ? Reanimated.withSpring : fallbackWithSpring;
export const withRepeat = hasReanimated ? Reanimated.withRepeat : fallbackWithRepeat;
export const withDelay = hasReanimated ? Reanimated.withDelay : fallbackWithDelay;
export const runOnJS = hasReanimated ? Reanimated.runOnJS : fallbackRunOnJS;
export const interpolate = hasReanimated ? Reanimated.interpolate : fallbackInterpolate;
export const Easing = hasReanimated ? Reanimated.Easing : fallbackEasing;
export const useAnimatedScrollHandler = hasReanimated ? Reanimated.useAnimatedScrollHandler : fallbackUseAnimatedScrollHandler;

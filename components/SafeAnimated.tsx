// SafeAnimated — Drop-in replacement for react-native-reanimated
// Uses React Native's built-in Animated API only — no native reanimated dependency
// All entering/exiting/layout props are safely stripped from wrapper components

import React, { forwardRef } from 'react';
import {
  View as RNView,
  Text as RNText,
  ScrollView as RNScrollView,
  Animated as RNAnimated,
} from 'react-native';

// ──────────────────────────────────────────────
// Wrapper components: strip reanimated-only props
// ──────────────────────────────────────────────

const AnimatedViewBase = RNAnimated.createAnimatedComponent(RNView);
const AnimatedTextBase = RNAnimated.createAnimatedComponent(RNText);

const SafeAnimatedView = forwardRef<RNView, any>((props, ref) => {
  const { entering, exiting, layout, ...rest } = props;
  return <RNAnimated.View ref={ref} {...rest} />;
});
SafeAnimatedView.displayName = 'SafeAnimatedView';

const SafeAnimatedText = forwardRef<RNText, any>((props, ref) => {
  const { entering, exiting, layout, ...rest } = props;
  return <RNAnimated.Text ref={ref} {...rest} />;
});
SafeAnimatedText.displayName = 'SafeAnimatedText';

const SafeAnimatedScrollView = forwardRef<RNScrollView, any>((props, ref) => {
  const { entering, exiting, layout, ...rest } = props;
  return <RNAnimated.ScrollView ref={ref} {...rest} />;
});
SafeAnimatedScrollView.displayName = 'SafeAnimatedScrollView';

const SafeAnimated = {
  View: SafeAnimatedView,
  Text: SafeAnimatedText,
  ScrollView: SafeAnimatedScrollView,
};

export default SafeAnimated;

// ──────────────────────────────────────────────
// Shared value — NO-OP stub (not backed by Animated.Value)
// Used only by components that read .value in useAnimatedStyle
// For real animations, use RN Animated directly (see NavigationDrawer, home)
// ──────────────────────────────────────────────

class SharedValueStub {
  _v: number;
  constructor(init: number) {
    this._v = typeof init === 'number' ? init : 0;
  }
  get value() { return this._v; }
  set value(v: any) {
    // Handle withTiming/withSpring marker objects
    if (v && typeof v === 'object') {
      if (v.__timing || v.__spring) {
        this._v = typeof v.toValue === 'number' ? v.toValue : this._v;
        // Fire callback asynchronously if present
        if (typeof v.callback === 'function') {
          setTimeout(() => { try { v.callback(true); } catch {} }, v.duration || 300);
        }
        return;
      }
    }
    if (typeof v === 'number') { this._v = v; }
  }
}

export function useSharedValue(init: any): any {
  const ref = React.useRef<SharedValueStub | null>(null);
  if (!ref.current) ref.current = new SharedValueStub(typeof init === 'number' ? init : 0);
  return ref.current;
}

// ──────────────────────────────────────────────
// useAnimatedStyle — simple poll (only for welcome banner etc.)
// ──────────────────────────────────────────────

export function useAnimatedStyle(fn: () => any): any {
  const [style, setStyle] = React.useState(() => {
    try { return fn(); } catch { return {}; }
  });
  React.useEffect(() => {
    const id = setInterval(() => {
      try {
        const s = fn();
        setStyle(s);
      } catch {}
    }, 50);
    return () => clearInterval(id);
  }, []);
  return style;
}

// ──────────────────────────────────────────────
// Animation helpers — simple stubs
// ──────────────────────────────────────────────

export function withTiming(toValue: any, config?: any, callback?: (finished: boolean) => void): any {
  return { __timing: true, toValue, duration: config?.duration || 300, callback };
}

export function withSpring(toValue: any, config?: any): any {
  return { __spring: true, toValue, config };
}

export const withRepeat = (_val: any, _count?: number, _reverse?: boolean) => _val;
export const withDelay = (_d: any, anim: any) => anim;
export const runOnJS = (fn: any) => fn;

export function interpolate(val: number, input: number[], output: number[]): number {
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

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  bezier: () => (t: number) => t,
  inOut: (_fn: any) => _fn || ((t: number) => t),
  in: (_fn: any) => _fn || ((t: number) => t),
  out: (_fn: any) => _fn || ((t: number) => t),
  cubic: (t: number) => t,
};

// ──────────────────────────────────────────────
// Layout animation stubs — chainable no-ops
// ──────────────────────────────────────────────

function createStub(): any {
  const c: any = {};
  ['duration', 'delay', 'springify', 'damping', 'stiffness', 'withInitialValues', 'withCallback', 'easing', 'build'].forEach(m => {
    c[m] = (..._a: any[]) => c;
  });
  return c;
}

export const FadeIn = createStub();
export const FadeInDown = createStub();
export const FadeInUp = createStub();
export const FadeOut = createStub();
export const ZoomIn = createStub();

export const useAnimatedScrollHandler = () => undefined;

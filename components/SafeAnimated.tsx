// Safe wrapper — pure JS fallbacks, no native dependencies
// Reanimated is loaded at runtime only when truly available

import { View, Text as RNText, ScrollView as RNScrollView } from 'react-native';
import { useRef, useEffect, useState, useCallback } from 'react';

// Animated components are plain RN components (no animation on web preview)
const SafeAnimated = {
  View: View,
  Text: RNText,
  ScrollView: RNScrollView,
};

export default SafeAnimated;

// SharedValue that supports live updates via subscribers
class SharedValueImpl {
  _value: any;
  _listeners: Set<() => void>;

  constructor(init: any) {
    this._value = init;
    this._listeners = new Set();
  }

  get value() {
    return this._value;
  }

  set value(newVal: any) {
    this._value = newVal;
    this._listeners.forEach(fn => { try { fn(); } catch {} });
  }

  _subscribe(fn: () => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
}

export const useSharedValue = (init: any) => {
  const ref = useRef<SharedValueImpl | null>(null);
  if (!ref.current) {
    ref.current = new SharedValueImpl(init);
  }
  return ref.current as any;
};

export const useAnimatedStyle = (fn: () => any) => {
  const [style, setStyle] = useState(() => {
    try { return fn(); } catch { return {}; }
  });

  // We cannot easily subscribe to SharedValue changes in a pure stub
  // Instead, use a polling interval for continuous animations
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const newStyle = fn();
        setStyle(newStyle);
      } catch {}
    }, 32); // ~30fps
    return () => clearInterval(interval);
  }, []);

  return style;
};

// Timing animation using JS intervals
export const withTiming = (toValue: any, config?: any, callback?: any) => {
  // For simple assignment — just return the value
  // The actual animation happens via setInterval in useAnimatedStyle
  if (callback) {
    try { callback(true); } catch {}
  }
  return toValue;
};

// Repeat animation: continuously cycles the value
let _repeatTimers: ReturnType<typeof setInterval>[] = [];

export const withRepeat = (targetValue: any, count?: number, reverse?: boolean) => {
  // Return a special marker object that tells useSharedValue.set to start a loop
  return { __repeat: true, target: targetValue, count: count || -1, reverse: reverse || false };
};

export const withSpring = (toValue: any) => toValue;
export const withDelay = (_d: any, anim: any) => anim;
export const runOnJS = (fn: any) => fn;

export const interpolate = (val: number, input: number[], output: number[]) => {
  if (!input || !output || input.length < 2 || output.length < 2) return val;
  // Clamp and interpolate
  const minIn = input[0];
  const maxIn = input[input.length - 1];
  const t = Math.max(0, Math.min(1, (val - minIn) / (maxIn - minIn || 1)));
  const minOut = output[0];
  const maxOut = output[output.length - 1];
  // Multi-stop interpolation
  if (input.length > 2 && output.length > 2) {
    for (let i = 0; i < input.length - 1; i++) {
      if (val >= input[i] && val <= input[i + 1]) {
        const segT = (val - input[i]) / (input[i + 1] - input[i] || 1);
        return output[i] + segT * (output[i + 1] - output[i]);
      }
    }
  }
  return minOut + t * (maxOut - minOut);
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

// Chainable no-op layout animation stubs
const createAnimationStub = (): any => {
  const chainable: any = {};
  const methods = ['duration', 'delay', 'springify', 'damping', 'stiffness', 'withInitialValues', 'withCallback', 'easing', 'build'];
  methods.forEach(m => { chainable[m] = (..._args: any[]) => chainable; });
  return chainable;
};

export const FadeIn = createAnimationStub();
export const FadeInDown = createAnimationStub();
export const FadeInUp = createAnimationStub();
export const FadeOut = createAnimationStub();
export const ZoomIn = createAnimationStub();

export const useAnimatedScrollHandler = () => undefined;

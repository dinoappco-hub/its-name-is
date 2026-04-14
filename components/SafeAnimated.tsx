// Safe wrapper — pure JS fallbacks using React Native Animated for smoothness
// No native reanimated dependencies

import {
  View,
  Text as RNText,
  ScrollView as RNScrollView,
  Animated as RNAnimated,
} from 'react-native';
import React, { useRef, useEffect, useState, useCallback } from 'react';

// Use RN Animated components for smooth transitions
const SafeAnimated = {
  View: RNAnimated.View,
  Text: RNAnimated.Text,
  ScrollView: RNAnimated.ScrollView,
};

export default SafeAnimated;

// SharedValue backed by RN Animated.Value for smooth interpolation
class SharedValueImpl {
  _animValue: RNAnimated.Value;
  _rawValue: number;
  _listeners: Set<() => void>;

  constructor(init: number) {
    this._rawValue = typeof init === 'number' ? init : 0;
    this._animValue = new RNAnimated.Value(this._rawValue);
    this._listeners = new Set();
  }

  get value() {
    return this._rawValue;
  }

  set value(newVal: any) {
    // Handle animated marker objects from withTiming/withSpring
    if (newVal && typeof newVal === 'object' && newVal.__timing) {
      this._animateTo(newVal.toValue, newVal.duration || 300, newVal.callback);
      return;
    }
    if (newVal && typeof newVal === 'object' && newVal.__spring) {
      this._springTo(newVal.toValue, newVal.callback);
      return;
    }
    // Plain number — set immediately
    if (typeof newVal === 'number') {
      this._rawValue = newVal;
      this._animValue.setValue(newVal);
      this._listeners.forEach(fn => { try { fn(); } catch {} });
    }
  }

  // Internal: for withTiming to use
  _animateTo(toValue: number, duration: number, callback?: (finished: boolean) => void) {
    RNAnimated.timing(this._animValue, {
      toValue,
      duration,
      useNativeDriver: false,
    }).start((result) => {
      this._rawValue = toValue;
      this._listeners.forEach(fn => { try { fn(); } catch {} });
      if (callback) callback(result.finished);
    });
  }

  _springTo(toValue: number, callback?: (finished: boolean) => void) {
    RNAnimated.spring(this._animValue, {
      toValue,
      damping: 22,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: false,
    }).start((result) => {
      this._rawValue = toValue;
      this._listeners.forEach(fn => { try { fn(); } catch {} });
      if (callback) callback(result.finished);
    });
  }
}

export const useSharedValue = (init: any) => {
  const ref = useRef<SharedValueImpl | null>(null);
  if (!ref.current) {
    ref.current = new SharedValueImpl(typeof init === 'number' ? init : 0);
  }
  return ref.current as any;
};

export const useAnimatedStyle = (fn: () => any) => {
  // For RN Animated, we return plain styles calculated from shared values
  // We use a re-render approach driven by value changes
  const [style, setStyle] = useState(() => {
    try { return fn(); } catch { return {}; }
  });

  useEffect(() => {
    // Poll at 16ms (~60fps) for smooth updates
    const interval = setInterval(() => {
      try {
        const newStyle = fn();
        setStyle(newStyle);
      } catch {}
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return style;
};

// withTiming: animate a shared value smoothly
export const withTiming = (toValue: any, config?: any, callback?: any) => {
  if (typeof toValue === 'number') {
    // Return a marker that useSharedValue.set can detect
    return { __timing: true, toValue, duration: config?.duration || 300, callback };
  }
  if (callback) {
    try { callback(true); } catch {}
  }
  return toValue;
};

// withSpring: spring animation
export const withSpring = (toValue: any, config?: any) => {
  if (typeof toValue === 'number') {
    return { __spring: true, toValue, config };
  }
  return toValue;
};

export const withRepeat = (targetValue: any, count?: number, reverse?: boolean) => targetValue;
export const withDelay = (_d: any, anim: any) => anim;
export const runOnJS = (fn: any) => fn;

export const interpolate = (val: number, input: number[], output: number[]) => {
  if (!input || !output || input.length < 2 || output.length < 2) return val;
  const minIn = input[0];
  const maxIn = input[input.length - 1];
  // Multi-stop interpolation
  for (let i = 0; i < input.length - 1; i++) {
    if (val >= input[i] && val <= input[i + 1]) {
      const segT = (val - input[i]) / (input[i + 1] - input[i] || 1);
      return output[i] + segT * (output[i + 1] - output[i]);
    }
  }
  // Clamp
  if (val <= minIn) return output[0];
  if (val >= maxIn) return output[output.length - 1];
  const t = Math.max(0, Math.min(1, (val - minIn) / (maxIn - minIn || 1)));
  return output[0] + t * (output[output.length - 1] - output[0]);
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

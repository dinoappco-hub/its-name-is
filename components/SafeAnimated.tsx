// Safe wrapper — pure JS fallbacks using React Native Animated for smoothness
// No native reanimated dependencies

import {
  View,
  Text as RNText,
  ScrollView as RNScrollView,
  Animated as RNAnimated,
  Easing as RNEasing,
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

  constructor(init: number) {
    this._rawValue = typeof init === 'number' ? init : 0;
    this._animValue = new RNAnimated.Value(this._rawValue);
    // Keep rawValue in sync via listener
    this._animValue.addListener(({ value }) => {
      this._rawValue = value;
    });
  }

  get value() {
    return this._rawValue;
  }

  set value(newVal: any) {
    // Handle animated marker objects from withTiming/withSpring
    if (newVal && typeof newVal === 'object' && newVal.__timing) {
      RNAnimated.timing(this._animValue, {
        toValue: newVal.toValue,
        duration: newVal.duration || 300,
        useNativeDriver: false,
      }).start((result) => {
        if (newVal.callback) newVal.callback(result.finished);
      });
      return;
    }
    if (newVal && typeof newVal === 'object' && newVal.__spring) {
      const cfg = newVal.config || {};
      RNAnimated.spring(this._animValue, {
        toValue: newVal.toValue,
        damping: cfg.damping || 22,
        stiffness: cfg.stiffness || 200,
        mass: cfg.mass || 0.8,
        useNativeDriver: false,
      }).start((result) => {
        if (newVal.callback) newVal.callback(result.finished);
      });
      return;
    }
    // Plain number — set immediately
    if (typeof newVal === 'number') {
      this._rawValue = newVal;
      this._animValue.setValue(newVal);
    }
  }
}

export const useSharedValue = (init: any) => {
  const ref = useRef<SharedValueImpl | null>(null);
  if (!ref.current) {
    ref.current = new SharedValueImpl(typeof init === 'number' ? init : 0);
  }
  return ref.current as any;
};

// useAnimatedStyle: polls the style factory and returns reactive style
// Uses a slightly longer interval to reduce jank from excessive re-renders
export const useAnimatedStyle = (fn: () => any) => {
  const [style, setStyle] = useState(() => {
    try { return fn(); } catch { return {}; }
  });

  useEffect(() => {
    // Poll at 33ms (~30fps) — sufficient for UI transitions, avoids overloading JS thread
    const interval = setInterval(() => {
      try {
        const newStyle = fn();
        setStyle((prev: any) => {
          // Quick shallow compare to avoid unnecessary re-renders
          const keys = Object.keys(newStyle);
          for (const k of keys) {
            if (k === 'transform') {
              // Always update transforms
              return newStyle;
            }
            if (prev[k] !== newStyle[k]) return newStyle;
          }
          return prev;
        });
      } catch {}
    }, 33);
    return () => clearInterval(interval);
  }, []);

  return style;
};

// withTiming: return marker for SharedValue setter
export const withTiming = (toValue: any, config?: any, callback?: any) => {
  if (typeof toValue === 'number') {
    return { __timing: true, toValue, duration: config?.duration || 300, callback };
  }
  if (callback) {
    try { callback(true); } catch {}
  }
  return toValue;
};

// withSpring: return marker for SharedValue setter
export const withSpring = (toValue: any, config?: any) => {
  if (typeof toValue === 'number') {
    return { __spring: true, toValue, config };
  }
  return toValue;
};

export const withRepeat = (targetValue: any, _count?: number, _reverse?: boolean) => targetValue;
export const withDelay = (_d: any, anim: any) => anim;
export const runOnJS = (fn: any) => fn;

export const interpolate = (val: number, input: number[], output: number[]) => {
  if (!input || !output || input.length < 2 || output.length < 2) return val;
  const minIn = input[0];
  const maxIn = input[input.length - 1];
  for (let i = 0; i < input.length - 1; i++) {
    if (val >= input[i] && val <= input[i + 1]) {
      const segT = (val - input[i]) / (input[i + 1] - input[i] || 1);
      return output[i] + segT * (output[i + 1] - output[i]);
    }
  }
  if (val <= minIn) return output[0];
  if (val >= maxIn) return output[output.length - 1];
  const t = Math.max(0, Math.min(1, (val - minIn) / (maxIn - minIn || 1)));
  return output[0] + t * (output[output.length - 1] - output[0]);
};

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  bezier: () => (t: number) => t,
  inOut: (_fn: any) => _fn || ((t: number) => t),
  in: (_fn: any) => _fn || ((t: number) => t),
  out: (_fn: any) => _fn || ((t: number) => t),
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

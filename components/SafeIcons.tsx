// Safe lazy-loading wrapper for MaterialIcons
// Prevents crash from @expo/vector-icons font loading on environments
// where the native font module (isLoadedNative) is undefined.

import React from 'react';
import { Text } from 'react-native';

let _MaterialIcons: any = null;
let _loaded = false;

function getMI() {
  if (!_loaded) {
    _loaded = true;
    try {
      const mod = require('@expo/vector-icons');
      _MaterialIcons = mod?.MaterialIcons;
    } catch {
      _MaterialIcons = null;
    }
  }
  return _MaterialIcons;
}

// Create a Proxy-based component that looks like MaterialIcons
// but lazily loads and falls back gracefully
const MaterialIconsSafe = React.forwardRef((props: any, ref: any) => {
  const MI = getMI();
  if (MI) {
    try {
      return <MI {...props} ref={ref} />;
    } catch {
      // fall through
    }
  }
  const { size = 24, color = '#888' } = props;
  return <Text style={{ fontSize: size * 0.6, color, textAlign: 'center', width: size, height: size, lineHeight: size }}>●</Text>;
});

MaterialIconsSafe.displayName = 'MaterialIcons';

// Copy over glyphMap for type usage
// This is a getter so it only triggers the require when actually accessed (at runtime, not import time)
Object.defineProperty(MaterialIconsSafe, 'glyphMap', {
  get() {
    const MI = getMI();
    return MI?.glyphMap || {};
  },
});

export { MaterialIconsSafe as MaterialIcons };

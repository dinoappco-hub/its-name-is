// Safe icon wrapper that avoids @expo/vector-icons entirely
// on environments where the native font module crashes Hermes.
// Uses unicode/emoji fallbacks that work everywhere.

import React from 'react';
import { Text, Platform } from 'react-native';

// Comprehensive unicode/symbol map for MaterialIcons names used in the app
const ICON_MAP: Record<string, string> = {
  // Navigation
  'arrow-back': '‹',
  'arrow-forward': '›',
  'chevron-right': '›',
  'chevron-left': '‹',
  'close': '✕',
  'menu': '☰',
  'more-vert': '⋮',
  'more-horiz': '···',

  // Actions
  'check': '✓',
  'check-circle': '✓',
  'check-circle-outline': '✓',
  'done': '✓',
  'done-all': '✓✓',
  'add': '+',
  'remove': '−',
  'delete': '🗑',
  'delete-outline': '🗑',
  'delete-forever': '🗑',
  'edit': '✎',
  'send': '➤',
  'search': '🔍',
  'refresh': '↻',
  'replay': '↻',
  'share': '↗',
  'copy': '⧉',
  'save': '💾',
  'select-all': '☑',
  'checklist': '☑',

  // Communication
  'email': '✉',
  'mail': '✉',
  'chat-bubble': '💬',
  'chat-bubble-outline': '💬',
  'forum': '💬',
  'feedback': '💬',
  'comment': '💬',
  'notifications': '🔔',
  'notifications-none': '🔔',
  'notifications-active': '🔔',
  'notifications-off': '🔕',

  // Media
  'camera-alt': '📷',
  'camera': '📷',
  'photo': '🖼',
  'image': '🖼',
  'broken-image': '🖼',
  'photo-library': '🖼',
  'videocam': '🎥',
  'mic': '🎤',
  'volume-up': '🔊',
  'volume-off': '🔇',

  // People
  'person': '👤',
  'person-off': '👤',
  'people': '👥',
  'group': '👥',
  'account-circle': '👤',

  // Content
  'star': '★',
  'star-rate': '★',
  'star-border': '☆',
  'favorite': '♥',
  'favorite-border': '♡',
  'thumb-up': '👍',
  'thumb-down': '👎',
  'how-to-vote': '🗳',
  'arrow-upward': '▲',
  'arrow-downward': '▼',
  'trending-up': '📈',

  // Status
  'warning': '⚠',
  'error': '⚠',
  'error-outline': '⚠',
  'info': 'ℹ',
  'info-outline': 'ℹ',
  'help': '?',
  'help-outline': '?',
  'report': '⚠',
  'flag': '🚩',
  'verified': '✓',
  'verified-user': '✓',
  'block': '⊘',
  'security': '🛡',

  // Settings / UI
  'settings': '⚙',
  'tune': '⚙',
  'palette': '🎨',
  'dark-mode': '🌙',
  'light-mode': '☀',
  'brightness-6': '☀',
  'lock': '🔒',
  'lock-outline': '🔒',
  'visibility': '👁',
  'visibility-off': '👁',
  'logout': '↩',
  'login': '↪',
  'shield': '🛡',
  'privacy-tip': '🔒',
  'description': '📄',
  'gavel': '⚖',
  'auto-stories': '📖',
  'history': '⏱',

  // Objects / Categories
  'explore': '🧭',
  'home': '🏠',
  'category': '📁',
  'folder': '📁',
  'label': '🏷',
  'local-offer': '🏷',
  'emoji-events': '🏆',
  'leaderboard': '🏆',
  'whatshot': '🔥',
  'new-releases': '✨',
  'lightbulb': '💡',
  'flash-on': '⚡',
  'flash-off': '⚡',
  'flash-auto': '⚡',
  'pets': '🐾',
  'restaurant': '🍽',
  'sports-esports': '🎮',
  'music-note': '🎵',
  'brush': '🖌',
  'build': '🔧',
  'extension': '🧩',
  'eco': '🌿',
  'sports-soccer': '⚽',
  'devices': '📱',
  'science': '🔬',
  'auto-awesome': '✨',

  // Layout
  'grid-view': '⊞',
  'view-list': '☰',
  'sort': '↕',
  'filter-list': '≡',
  'swap-vert': '↕',

  // Misc
  'waving-hand': '👋',
  'speed': '⚡',
  'bug-report': '🐛',
  'accessibility-new': '♿',
  'text-fields': 'Aa',
  'format-size': 'Aa',
  'contrast': '◑',
  'motion-photos-auto': '↻',
  'vibration': '📳',
  'crop': '⬜',
  'rotate-right': '↻',
  'flip': '⇔',
  'zoom-in': '🔍',
  'zoom-out': '🔍',

  // File/content
  'content-copy': '⧉',
  'open-in-new': '↗',
  'download': '↓',
  'upload': '↑',
  'attach-file': '📎',
  'link': '🔗',

  // Remove/clear
  'remove-circle': '⊖',
  'cancel': '✕',
  'clear': '✕',
  'backspace': '⌫',

  // Featured
  'local-fire-department': '🔥',
  'bolt': '⚡',
};

// Fallback for any unmapped icon
const DEFAULT_ICON = '●';

function getIconChar(name: string): string {
  return ICON_MAP[name] || DEFAULT_ICON;
}

// The safe MaterialIcons component — pure JS, no native font dependency
const MaterialIconsSafe = React.forwardRef(({ name, size = 24, color = '#888', style, ...rest }: any, ref: any) => {
  const iconChar = getIconChar(name);
  // Emoji/unicode characters need slightly different sizing than icon fonts
  const fontSize = iconChar.length > 1 ? size * 0.55 : size * 0.7;

  return (
    <Text
      ref={ref}
      style={[
        {
          fontSize,
          color,
          textAlign: 'center',
          width: size,
          height: size,
          lineHeight: size,
          includeFontPadding: false,
        },
        style,
      ]}
      {...rest}
      allowFontScaling={false}
    >
      {iconChar}
    </Text>
  );
});

MaterialIconsSafe.displayName = 'MaterialIcons';

// Provide a glyphMap-like object for type checks (e.g., `keyof typeof MaterialIcons.glyphMap`)
const glyphMap = new Proxy({} as Record<string, number>, {
  get(_target, prop) {
    if (typeof prop === 'string') return 0; // any string key returns a valid value
    return undefined;
  },
  has() { return true; },
});

Object.defineProperty(MaterialIconsSafe, 'glyphMap', {
  value: glyphMap,
  writable: false,
  configurable: false,
});

export { MaterialIconsSafe as MaterialIcons };

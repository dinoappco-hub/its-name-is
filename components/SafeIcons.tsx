// SafeIcons — tries real @expo/vector-icons first, falls back to recognizable emoji.

import React from 'react';
import { Text, Platform } from 'react-native';

// ──────────────────────────────────────────────
// Try to load real MaterialIcons from @expo/vector-icons
// ──────────────────────────────────────────────

let RealMaterialIcons: any = null;
try {
  const mod = require('@expo/vector-icons/MaterialIcons');
  if (mod && (mod.default || mod)) {
    RealMaterialIcons = mod.default || mod;
    // Verify it's a valid component with glyphMap
    if (!RealMaterialIcons.glyphMap && !RealMaterialIcons.getRawGlyphMap) {
      RealMaterialIcons = null;
    }
  }
} catch {
  RealMaterialIcons = null;
}

// ──────────────────────────────────────────────
// Emoji icon map — clear, recognizable icons
// ──────────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  // Navigation
  'arrow-back': '◂',
  'arrow-forward': '▸',
  'chevron-right': '›',
  'chevron-left': '‹',
  'close': '✕',
  'menu': '☰',
  'more-vert': '⋮',
  'more-horiz': '⋯',

  // Actions
  'check': '✓',
  'check-circle': '✅',
  'check-circle-outline': '✓',
  'done': '✓',
  'done-all': '✓✓',
  'add': '+',
  'remove': '−',
  'delete': '🗑',
  'delete-outline': '🗑',
  'delete-forever': '🗑',
  'edit': '✏️',
  'send': '📨',
  'search': '🔍',
  'refresh': '🔄',
  'replay': '🔄',
  'share': '📤',
  'copy': '📋',
  'save': '💾',
  'select-all': '☑',
  'checklist': '☑',

  // Communication
  'email': '✉️',
  'mail': '✉️',
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
  'photo-camera': '📷',
  'photo': '🖼',
  'image': '🖼',
  'broken-image': '🖼',
  'photo-library': '🖼',
  'videocam': '🎬',
  'mic': '🎤',
  'volume-up': '🔊',
  'volume-off': '🔇',

  // People
  'person': '👤',
  'person-off': '👤',
  'people': '👥',
  'group': '👥',
  'groups': '👥',
  'account-circle': '👤',
  'emoji-people': '👥',

  // Content
  'star': '⭐',
  'star-rate': '⭐',
  'star-border': '☆',
  'star-outline': '☆',
  'favorite': '❤️',
  'favorite-border': '♡',
  'thumb-up': '👍',
  'thumb-down': '👎',
  'how-to-vote': '🗳',
  'arrow-upward': '▲',
  'arrow-downward': '▼',
  'trending-up': '📈',

  // Status
  'warning': '⚠️',
  'error': '⚠️',
  'error-outline': '⚠️',
  'info': 'ℹ️',
  'info-outline': 'ℹ️',
  'help': '❓',
  'help-outline': '❓',
  'report': '⚠️',
  'flag': '🚩',
  'verified': '✅',
  'verified-user': '✅',
  'block': '🚫',
  'security': '🛡',

  // Settings / UI
  'settings': '⚙️',
  'tune': '🎛',
  'palette': '🎨',
  'dark-mode': '🌙',
  'light-mode': '☀️',
  'brightness-6': '☀️',
  'lock': '🔒',
  'lock-outline': '🔒',
  'visibility': '👁',
  'visibility-off': '👁',
  'logout': '🚪',
  'login': '🚪',
  'shield': '🛡',
  'privacy-tip': '🔒',
  'description': '📄',
  'gavel': '⚖️',
  'auto-stories': '📖',
  'history': '🕐',
  'preview': '👁',
  'restart-alt': '🔄',

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
  'lightbulb-outline': '💡',
  'emoji-objects': '💡',
  'flash-on': '⚡',
  'flash-off': '⚡',
  'flash-auto': '⚡',
  'pets': '🐾',
  'restaurant': '🍴',
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
  'grid-view': '▦',
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
  'format-bold': 'B',
  'contrast': '◑',
  'animation': '🔄',
  'motion-photos-auto': '🔄',
  'vibration': '📳',
  'record-voice-over': '🗣',
  'crop': '⬜',
  'rotate-right': '🔄',
  'flip': '↔',
  'zoom-in': '🔎',
  'zoom-out': '🔍',

  // File/content
  'content-copy': '📋',
  'open-in-new': '🔗',
  'download': '⬇️',
  'upload': '⬆️',
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

  // Camera icons
  'flip-camera-ios': '🔄',
  'flip-camera-android': '🔄',

  // Additional icons
  'reply': '↩',
  'expand-more': '▼',
  'expand-less': '▲',
  'apps': '▦',
  'directions-car': '🚗',
  'cruelty-free': '🐰',
  'weekend': '🛋',
  'shuffle': '🔀',
  'handshake': '🤝',
  'copyright': '©',
  'update': '🔄',
  'thumb-up-alt': '👍',
};

const DEFAULT_ICON = '●';

function getIconChar(name: string): string {
  return ICON_MAP[name] || DEFAULT_ICON;
}

// ──────────────────────────────────────────────
// Component: tries real vector icons, falls back to emoji
// ──────────────────────────────────────────────

function MaterialIconsComponent({ name, size = 24, color = '#888', style, ...rest }: any) {
  // Try real MaterialIcons first
  if (RealMaterialIcons) {
    try {
      return <RealMaterialIcons name={name} size={size} color={color} style={style} {...rest} />;
    } catch {
      // Fall through to emoji
    }
  }

  // Emoji fallback
  const iconChar = getIconChar(name);
  // Emoji characters are wider, adjust sizing
  const isEmoji = iconChar.length > 1 || iconChar.charCodeAt(0) > 0x2000;
  const fontSize = isEmoji ? size * 0.72 : size * 0.85;

  return (
    <Text
      style={[
        {
          fontSize,
          color: isEmoji ? undefined : color,
          textAlign: 'center' as const,
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
}

// Simple glyphMap for type compatibility
const glyphMap: Record<string, number> = {};
Object.keys(ICON_MAP).forEach(key => { glyphMap[key] = 0; });
(MaterialIconsComponent as any).glyphMap = glyphMap;

export const MaterialIcons = MaterialIconsComponent as typeof MaterialIconsComponent & { glyphMap: Record<string, number> };

// Safe icon wrapper — pure JS, no native font dependency.
// Uses flat unicode text symbols (NOT emoji) for consistent non-3D rendering on all platforms.

import React from 'react';
import { Text, Platform } from 'react-native';

// Flat unicode symbol map — avoids emoji which render as 3D on iOS/Android
const ICON_MAP: Record<string, string> = {
  // Navigation
  'arrow-back': '\u2039',
  'arrow-forward': '\u203A',
  'chevron-right': '\u203A',
  'chevron-left': '\u2039',
  'close': '\u2715',
  'menu': '\u2630',
  'more-vert': '\u22EE',
  'more-horiz': '\u22EF',

  // Actions
  'check': '\u2713',
  'check-circle': '\u2713',
  'check-circle-outline': '\u2713',
  'done': '\u2713',
  'done-all': '\u2713',
  'add': '+',
  'remove': '\u2212',
  'delete': '\u2717',
  'delete-outline': '\u2717',
  'delete-forever': '\u2717',
  'edit': '\u270E',
  'send': '\u27A4',
  'search': '\u26B2',
  'refresh': '\u21BB',
  'replay': '\u21BB',
  'share': '\u2197',
  'copy': '\u29C9',
  'save': '\u25A3',
  'select-all': '\u2611',
  'checklist': '\u2611',

  // Communication
  'email': '\u2709',
  'mail': '\u2709',
  'chat-bubble': '\u25ED',
  'chat-bubble-outline': '\u25ED',
  'forum': '\u25ED',
  'feedback': '\u25ED',
  'comment': '\u25ED',
  'notifications': '\u266A',
  'notifications-none': '\u266A',
  'notifications-active': '\u266A',
  'notifications-off': '\u266A',

  // Media
  'camera-alt': '\u25A3',
  'camera': '\u25A3',
  'photo-camera': '\u25A3',
  'photo': '\u25A3',
  'image': '\u25A3',
  'broken-image': '\u25A3',
  'photo-library': '\u25A3',
  'videocam': '\u25B6',
  'mic': '\u25CF',
  'volume-up': '\u266B',
  'volume-off': '\u266B',

  // People
  'person': '\u2603',
  'person-off': '\u2603',
  'people': '\u2603',
  'group': '\u2603',
  'groups': '\u2603',
  'account-circle': '\u2603',
  'emoji-people': '\u2603',

  // Content
  'star': '\u2605',
  'star-rate': '\u2605',
  'star-border': '\u2606',
  'star-outline': '\u2606',
  'favorite': '\u2665',
  'favorite-border': '\u2661',
  'thumb-up': '\u25B2',
  'thumb-down': '\u25BC',
  'how-to-vote': '\u2610',
  'arrow-upward': '\u25B2',
  'arrow-downward': '\u25BC',
  'trending-up': '\u2197',

  // Status
  'warning': '\u26A0',
  'error': '\u26A0',
  'error-outline': '\u26A0',
  'info': '\u2139',
  'info-outline': '\u2139',
  'help': '?',
  'help-outline': '?',
  'report': '\u26A0',
  'flag': '\u2691',
  'verified': '\u2713',
  'verified-user': '\u2713',
  'block': '\u2298',
  'security': '\u2666',

  // Settings / UI
  'settings': '\u2699',
  'tune': '\u2699',
  'palette': '\u25C9',
  'dark-mode': '\u263D',
  'light-mode': '\u2600',
  'brightness-6': '\u2600',
  'lock': '\u2302',
  'lock-outline': '\u2302',
  'visibility': '\u25C9',
  'visibility-off': '\u25C9',
  'logout': '\u21A9',
  'login': '\u21AA',
  'shield': '\u2666',
  'privacy-tip': '\u2302',
  'description': '\u2637',
  'gavel': '\u2696',
  'auto-stories': '\u2637',
  'history': '\u29D6',
  'preview': '\u25C9',
  'restart-alt': '\u21BB',

  // Objects / Categories
  'explore': '\u2316',
  'home': '\u2302',
  'category': '\u25A3',
  'folder': '\u25A3',
  'label': '\u2302',
  'local-offer': '\u2302',
  'emoji-events': '\u2605',
  'leaderboard': '\u2605',
  'whatshot': '\u2736',
  'new-releases': '\u2734',
  'lightbulb': '\u2736',
  'lightbulb-outline': '\u2736',
  'emoji-objects': '\u2736',
  'flash-on': '\u26A1',
  'flash-off': '\u26A1',
  'flash-auto': '\u26A1',
  'pets': '\u2740',
  'restaurant': '\u2726',
  'sports-esports': '\u2726',
  'music-note': '\u266B',
  'brush': '\u270E',
  'build': '\u2699',
  'extension': '\u2726',
  'eco': '\u2740',
  'sports-soccer': '\u26BD',
  'devices': '\u25A3',
  'science': '\u2697',
  'auto-awesome': '\u2734',

  // Layout
  'grid-view': '\u229E',
  'view-list': '\u2630',
  'sort': '\u2195',
  'filter-list': '\u2261',
  'swap-vert': '\u2195',

  // Misc
  'waving-hand': '\u270B',
  'speed': '\u26A1',
  'bug-report': '\u2318',
  'accessibility-new': '\u267F',
  'text-fields': 'Aa',
  'format-size': 'Aa',
  'format-bold': 'B',
  'contrast': '\u25D1',
  'animation': '\u21BB',
  'motion-photos-auto': '\u21BB',
  'vibration': '\u2058',
  'record-voice-over': '\u2603',
  'crop': '\u25A1',
  'rotate-right': '\u21BB',
  'flip': '\u21D4',
  'zoom-in': '\u2295',
  'zoom-out': '\u2296',

  // File/content
  'content-copy': '\u29C9',
  'open-in-new': '\u2197',
  'download': '\u2193',
  'upload': '\u2191',
  'attach-file': '\u2318',
  'link': '\u26AD',

  // Remove/clear
  'remove-circle': '\u2296',
  'cancel': '\u2715',
  'clear': '\u2715',
  'backspace': '\u232B',

  // Featured
  'local-fire-department': '\u2736',
  'bolt': '\u26A1',

  // Camera icons
  'flip-camera-ios': '\u21C4',
  'flip-camera-android': '\u21C4',

  // Additional icons
  'reply': '\u21A9',
  'expand-more': '\u25BC',
  'expand-less': '\u25B2',
  'apps': '\u229E',
  'directions-car': '\u2708',
  'cruelty-free': '\u2740',
  'weekend': '\u2302',
  'shuffle': '\u21C4',
  'handshake': '\u2726',
  'copyright': '\u00A9',
  'update': '\u21BB',
  'thumb-up-alt': '\u25B2',
};

// Fallback for any unmapped icon
const DEFAULT_ICON = '\u25CF';

function getIconChar(name: string): string {
  return ICON_MAP[name] || DEFAULT_ICON;
}

// Plain function component — no forwardRef, no Proxy, maximum compatibility
function MaterialIconsComponent({ name, size = 24, color = '#888', style, ...rest }: any) {
  const iconChar = getIconChar(name);
  const fontSize = iconChar.length > 1 ? size * 0.55 : size * 0.85;

  return (
    <Text
      style={[
        {
          fontSize,
          color,
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

// Simple glyphMap object for type checks (keyof typeof MaterialIcons.glyphMap)
const glyphMap: Record<string, number> = {};
Object.keys(ICON_MAP).forEach(key => { glyphMap[key] = 0; });

// Attach glyphMap as a static property
(MaterialIconsComponent as any).glyphMap = glyphMap;

// Export as MaterialIcons for drop-in replacement
export const MaterialIcons = MaterialIconsComponent as typeof MaterialIconsComponent & { glyphMap: Record<string, number> };

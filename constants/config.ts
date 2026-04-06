import { MaterialIcons } from '@expo/vector-icons';

export const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'apps' as keyof typeof MaterialIcons.glyphMap, color: '#9E9E9E' },
  { key: 'animals', label: 'Animals', icon: 'pets' as keyof typeof MaterialIcons.glyphMap, color: '#FF8A65' },
  { key: 'food', label: 'Food', icon: 'restaurant' as keyof typeof MaterialIcons.glyphMap, color: '#EF5350' },
  { key: 'gadgets', label: 'Gadgets', icon: 'devices' as keyof typeof MaterialIcons.glyphMap, color: '#42A5F5' },
  { key: 'nature', label: 'Nature', icon: 'eco' as keyof typeof MaterialIcons.glyphMap, color: '#66BB6A' },
  { key: 'fashion', label: 'Fashion', icon: 'checkroom' as keyof typeof MaterialIcons.glyphMap, color: '#AB47BC' },
  { key: 'home', label: 'Home', icon: 'weekend' as keyof typeof MaterialIcons.glyphMap, color: '#FFA726' },
  { key: 'random', label: 'Random', icon: 'shuffle' as keyof typeof MaterialIcons.glyphMap, color: '#78909C' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const config = {
  appName: 'its name is.',
  version: '1.0.0',
  submissionsPerDay: 5,
} as const;

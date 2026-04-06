import { MaterialIcons } from '@expo/vector-icons';

export const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'apps' as keyof typeof MaterialIcons.glyphMap, color: '#9E9E9E' },
  { key: 'cars', label: 'Cars', icon: 'directions-car' as keyof typeof MaterialIcons.glyphMap, color: '#42A5F5' },
  { key: 'stuffed_animals', label: 'Stuffed Animals', icon: 'pets' as keyof typeof MaterialIcons.glyphMap, color: '#FF8A65' },
  { key: 'pets', label: 'Pets', icon: 'cruelty-free' as keyof typeof MaterialIcons.glyphMap, color: '#66BB6A' },
  { key: 'household', label: 'Household Objects', icon: 'weekend' as keyof typeof MaterialIcons.glyphMap, color: '#FFA726' },
  { key: 'random', label: 'Random', icon: 'shuffle' as keyof typeof MaterialIcons.glyphMap, color: '#78909C' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const config = {
  appName: 'its name is.',
  version: '1.0.0',

} as const;

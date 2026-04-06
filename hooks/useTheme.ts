import { useContext } from 'react';
import { ThemeContext, ThemeContextType } from '../contexts/ThemeContext';
import { darkColors, createTypography } from '../constants/theme';

const fallback: ThemeContextType = {
  mode: 'dark',
  isDark: true,
  colors: darkColors,
  typo: createTypography(darkColors),
  setMode: () => {},
  toggleMode: () => {},
};

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context || fallback;
}

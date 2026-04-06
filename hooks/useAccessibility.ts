import { useContext } from 'react';
import { AccessibilityContext, AccessibilityContextType } from '../contexts/AccessibilityContext';

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

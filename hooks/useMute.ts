import { useContext } from 'react';
import { MuteContext } from '../contexts/MuteContext';

export function useMute() {
  const context = useContext(MuteContext);
  if (!context) {
    throw new Error('useMute must be used within MuteProvider');
  }
  return context;
}

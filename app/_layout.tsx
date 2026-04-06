import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { NotificationProvider } from '../contexts/NotificationContext';
import { AppProvider } from '../contexts/AppContext';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="object/[id]" options={{ animation: 'slide_from_bottom' }} />

                <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="notification-settings" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="accessibility" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="our-story" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="report-problem" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="community-guidelines" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="user/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_right' }} />
              </Stack>
              </AppProvider>
            </NotificationProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { NotificationProvider } from '../contexts/NotificationContext';
import { AppProvider } from '../contexts/AppContext';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppProvider>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 250 }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade', animationDuration: 350 }} />
                  <Stack.Screen name="onboarding" options={{ animation: 'fade', animationDuration: 400 }} />
                  <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 300 }} />
                  <Stack.Screen name="object/[id]" options={{ animation: 'fade_from_bottom', animationDuration: 280 }} />
                  <Stack.Screen name="notifications" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="settings" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="notification-settings" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="accessibility" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="our-story" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="report-problem" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="community-guidelines" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="terms" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="privacy" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="user/[id]" options={{ animation: 'fade_from_bottom', animationDuration: 250 }} />
                  <Stack.Screen name="customize-theme" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
                  <Stack.Screen name="leaderboard" options={{ animation: 'fade_from_bottom', animationDuration: 250 }} />
                </Stack>
                </AppProvider>
              </NotificationProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

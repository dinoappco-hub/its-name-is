import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';

// Lazy-load all custom providers to prevent module-level crashes
// that block Expo Router's route tree initialization
const ThemeProvider = React.lazy(() => import('../contexts/ThemeContext').then(m => ({ default: m.ThemeProvider })));
const AccessibilityProvider = React.lazy(() => import('../contexts/AccessibilityContext').then(m => ({ default: m.AccessibilityProvider })));
const NotificationProvider = React.lazy(() => import('../contexts/NotificationContext').then(m => ({ default: m.NotificationProvider })));
const MuteProvider = React.lazy(() => import('../contexts/MuteContext').then(m => ({ default: m.MuteProvider })));
const AppProvider = React.lazy(() => import('../contexts/AppContext').then(m => ({ default: m.AppProvider })));

function AppStack() {
  return (
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
      <Stack.Screen name="reset-password" options={{ headerShown: false, animation: 'fade', animationDuration: 300 }} />
      <Stack.Screen name="admin" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
      <Stack.Screen name="muted-users" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
    </Stack>
  );
}

function FallbackLoader() {
  return null;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <React.Suspense fallback={<FallbackLoader />}>
          <ThemeProvider>
            <AccessibilityProvider>
              <AuthProvider>
                <NotificationProvider>
                  <MuteProvider>
                    <AppProvider>
                      <StatusBar style="auto" />
                      <AppStack />
                    </AppProvider>
                  </MuteProvider>
                </NotificationProvider>
              </AuthProvider>
            </AccessibilityProvider>
          </ThemeProvider>
        </React.Suspense>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet as RNStyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy-load context providers to prevent module-level crashes during bundling
function LazyProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [Providers, setProviders] = useState<any>(null);

  useEffect(() => {
    try {
      const ThemeMod = require('../contexts/ThemeContext');
      const A11yMod = require('../contexts/AccessibilityContext');
      const NotifMod = require('../contexts/NotificationContext');
      const MuteMod = require('../contexts/MuteContext');
      const AppMod = require('../contexts/AppContext');

      setProviders({
        ThemeProvider: ThemeMod.ThemeProvider,
        AccessibilityProvider: A11yMod.AccessibilityProvider,
        NotificationProvider: NotifMod.NotificationProvider,
        MuteProvider: MuteMod.MuteProvider,
        AppProvider: AppMod.AppProvider,
      });
      setReady(true);
    } catch (e) {
      console.error('Failed to load providers:', e);
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!Providers) {
    return children;
  }

  return (
    <Providers.ThemeProvider>
      <Providers.AccessibilityProvider>
        <AuthProvider>
          <Providers.NotificationProvider>
            <Providers.MuteProvider>
              <Providers.AppProvider>
                <StatusBar style="auto" />
                {children}
              </Providers.AppProvider>
            </Providers.MuteProvider>
          </Providers.NotificationProvider>
        </AuthProvider>
      </Providers.AccessibilityProvider>
    </Providers.ThemeProvider>
  );
}

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

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AlertProvider>
        <SafeAreaProvider>
          <LazyProviders>
            <AppStack />
          </LazyProviders>
        </SafeAreaProvider>
      </AlertProvider>
    </ErrorBoundary>
  );
}

const loadingStyles = RNStyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0F',
  },
});

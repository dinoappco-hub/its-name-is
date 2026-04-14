import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from '../components/ErrorBoundary';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

// Lazy-load all custom providers to isolate initialization failures
let ThemeProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let AccessibilityProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let NotificationProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let MuteProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let AppProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;

let providerLoadError: string | null = null;

try {
  ThemeProvider = require('../contexts/ThemeContext').ThemeProvider;
} catch (e: any) {
  providerLoadError = `ThemeProvider: ${e.message}`;
}

try {
  AccessibilityProvider = require('../contexts/AccessibilityContext').AccessibilityProvider;
} catch (e: any) {
  providerLoadError = `AccessibilityProvider: ${e.message}`;
}

try {
  NotificationProvider = require('../contexts/NotificationContext').NotificationProvider;
} catch (e: any) {
  providerLoadError = `NotificationProvider: ${e.message}`;
}

try {
  MuteProvider = require('../contexts/MuteContext').MuteProvider;
} catch (e: any) {
  providerLoadError = `MuteProvider: ${e.message}`;
}

try {
  AppProvider = require('../contexts/AppContext').AppProvider;
} catch (e: any) {
  providerLoadError = `AppProvider: ${e.message}`;
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

function ProviderTree({ children }: { children: React.ReactNode }) {
  // If any provider failed to load, show diagnostic info
  if (providerLoadError) {
    return (
      <View style={diagStyles.container}>
        <Text style={diagStyles.title}>Provider Load Error</Text>
        <Text style={diagStyles.error}>{providerLoadError}</Text>
        <Text style={diagStyles.hint}>A context provider failed to load. This is usually caused by a missing native module.</Text>
      </View>
    );
  }

  // Build provider chain — skip any that failed to load
  let content = <>{children}</>;

  if (AppProvider) {
    content = <AppProvider>{content}</AppProvider>;
  }
  if (MuteProvider) {
    content = <MuteProvider>{content}</MuteProvider>;
  }
  if (NotificationProvider) {
    content = <NotificationProvider>{content}</NotificationProvider>;
  }
  if (AccessibilityProvider) {
    content = <AccessibilityProvider>{content}</AccessibilityProvider>;
  }
  if (ThemeProvider) {
    content = <ThemeProvider>{content}</ThemeProvider>;
  }

  return content;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialIcons.font,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    // Return null while fonts load — splash screen stays visible
    return null;
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AlertProvider>
          <SafeAreaProvider>
            <AuthProvider>
              <ProviderTree>
                <StatusBar style="auto" />
                <AppStack />
              </ProviderTree>
            </AuthProvider>
          </SafeAreaProvider>
        </AlertProvider>
      </View>
    </ErrorBoundary>
  );
}

const diagStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E9A',
    textAlign: 'center',
    lineHeight: 20,
  },
});

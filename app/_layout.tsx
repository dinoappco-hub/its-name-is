import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';

import ErrorBoundary from '../components/ErrorBoundary';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { MuteProvider } from '../contexts/MuteContext';
import { AppProvider } from '../contexts/AppContext';



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
      <View style={styles.root}>
        <AlertProvider>
          <SafeAreaProvider>
            <AuthProvider>
              <ThemeProvider>
                <AccessibilityProvider>
                  <NotificationProvider>
                    <MuteProvider>
                      <AppProvider>
                        <StatusBar style="auto" />
                        <AppStack />
                      </AppProvider>
                    </MuteProvider>
                  </NotificationProvider>
                </AccessibilityProvider>
              </ThemeProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </AlertProvider>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

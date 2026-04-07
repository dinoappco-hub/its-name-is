import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthRouter, getSupabaseClient } from '@/template';
import { useAppTheme } from '../hooks/useTheme';

function AuthenticatedEntry() {
  const { colors: t } = useAppTheme();

  return <Redirect href="/(tabs)" />;
}

export default function EntryScreen() {
  const { colors: t } = useAppTheme();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [deepLinkRoute, setDeepLinkRoute] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Check for deep link (e.g. password reset)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('reset-password')) {
          setDeepLinkRoute('/reset-password');
          setChecking(false);
          return;
        }

        const val = await AsyncStorage.getItem('snapname_onboarded');
        setOnboarded(val === 'true');

        // Clear any stale/invalid sessions to prevent refresh token errors
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.log('Clearing invalid session:', error.message);
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch {}
      setChecking(false);
    };
    init();

    // Also listen for deep links while the app is already open
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url && url.includes('reset-password')) {
        router.push('/reset-password');
      }
    });
    return () => sub.remove();
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  // Handle deep link to reset password
  if (deepLinkRoute === '/reset-password') {
    return <Redirect href="/reset-password" />;
  }

  // Show onboarding first before requiring auth
  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <AuthRouter
      loginRoute="/login"
      loadingComponent={LoadingComponent}
    >
      <AuthenticatedEntry />
    </AuthRouter>
  );
}

function LoadingComponent() {
  const { colors: t } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <ActivityIndicator size="large" color={t.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

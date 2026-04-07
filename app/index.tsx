import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthRouter, getSupabaseClient } from '@/template';
import { useAppTheme } from '../hooks/useTheme';

function AuthenticatedEntry() {
  const { colors: t } = useAppTheme();

  return <Redirect href="/(tabs)" />;
}

export default function EntryScreen() {
  const { colors: t } = useAppTheme();
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
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
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
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

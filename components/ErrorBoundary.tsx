import React, { Component, ErrorInfo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleForceReload = () => {
    // Force a full JS reload via Expo/DevClient if available
    try {
      const Updates = require('expo-updates');
      if (Updates && Updates.reloadAsync) {
        Updates.reloadAsync();
        return;
      }
    } catch {}
    // Fallback: just reset state
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="error-outline" size={56} color="#EF4444" />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. Try restarting to continue.
            </Text>

            {error ? (
              <ScrollView style={styles.errorBox} contentContainerStyle={styles.errorBoxContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.errorLabel}>Error Details</Text>
                <Text style={styles.errorText} selectable>{error.name}: {error.message}</Text>
              </ScrollView>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.restartBtn, pressed && styles.restartBtnPressed]}
              onPress={this.handleRestart}
            >
              <MaterialIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.restartBtnText}>Try Again</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.forceReloadBtn, pressed && styles.restartBtnPressed]}
              onPress={this.handleForceReload}
            >
              <MaterialIcons name="power-settings-new" size={18} color="#8E8E9A" />
              <Text style={styles.forceReloadBtnText}>Force Reload</Text>
            </Pressable>

            <Text style={styles.hint}>
              If this keeps happening, try closing and reopening the app completely.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    paddingTop: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E9A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorBox: {
    width: '100%',
    maxHeight: 140,
    backgroundColor: '#16161F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F1F2E',
    marginBottom: 28,
  },
  errorBoxContent: {
    padding: 14,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55556A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#EF4444',
    lineHeight: 19,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    height: 52,
    width: '100%',
    marginBottom: 12,
  },
  forceReloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E1E2A',
    borderRadius: 12,
    height: 48,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  forceReloadBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E9A',
  },
  restartBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  restartBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#55556A',
    textAlign: 'center',
    lineHeight: 18,
  },
});

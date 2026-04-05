import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme, typography } from '../constants/theme';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';
import { createCheckoutSession, createPortalSession } from '../services/subscriptionService';

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, subscriptionEnd, checkingSubscription, refreshSubscription } = useApp();
  const { showAlert } = useAlert();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleSubscribe = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingCheckout(true);
    const { url, error } = await createCheckoutSession();
    setLoadingCheckout(false);

    if (error) {
      showAlert('Error', error);
      return;
    }
    if (url) {
      await WebBrowser.openBrowserAsync(url);
      // After returning from browser, refresh subscription
      await refreshSubscription();
    }
  }, [showAlert, refreshSubscription]);

  const handleManageSubscription = useCallback(async () => {
    Haptics.selectionAsync();
    setLoadingPortal(true);
    const { url, error } = await createPortalSession();
    setLoadingPortal(false);

    if (error) {
      showAlert('Error', error);
      return;
    }
    if (url) {
      await WebBrowser.openBrowserAsync(url);
      await refreshSubscription();
    }
  }, [showAlert, refreshSubscription]);

  const handleRefreshStatus = useCallback(async () => {
    Haptics.selectionAsync();
    await refreshSubscription();
  }, [refreshSubscription]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const features = [
    { icon: 'all-inclusive' as const, title: 'Unlimited Submissions', desc: 'No daily limits — snap as much as you want' },
    { icon: 'star' as const, title: 'Feature Your Objects', desc: 'Pin objects to the top of the community feed' },
    { icon: 'verified' as const, title: 'Gold Premium Badge', desc: 'Stand out with a verified premium profile' },
    { icon: 'block' as const, title: 'Ad-Free Experience', desc: 'Browse without any interruptions' },
    { icon: 'bolt' as const, title: 'Early Access', desc: 'Be first to try new features' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={22} color={theme.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Premium</Text>
        <Pressable
          style={styles.refreshBtn}
          onPress={handleRefreshStatus}
          disabled={checkingSubscription}
        >
          {checkingSubscription ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <MaterialIcons name="refresh" size={20} color={theme.textMuted} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={ZoomIn.duration(500)} style={styles.badgeSection}>
          <Image
            source={require('../assets/images/premium-badge.png')}
            style={styles.badgeImage}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={styles.heroTitle}>
            {isPremium ? 'You Are Premium' : 'Go Unlimited'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isPremium
              ? 'You have access to all premium features.'
              : 'Unlock the full its name is. experience with unlimited submissions and exclusive features.'}
          </Text>
        </Animated.View>

        {/* Subscription Status Card (Premium) */}
        {isPremium ? (
          <Animated.View entering={FadeInUp.delay(250).duration(400)} style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.statusActiveDot} />
              <Text style={styles.statusActiveText}>Active Subscription</Text>
            </View>
            {subscriptionEnd ? (
              <Text style={styles.statusRenew}>
                Renews on {formatDate(subscriptionEnd)}
              </Text>
            ) : null}
            <Text style={styles.statusPlan}>Premium — {config.premium.price}/{config.premium.period}</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>{config.premium.price}</Text>
              <Text style={styles.pricePeriod}>/{config.premium.period}</Text>
            </View>
            <Text style={styles.priceNote}>Cancel anytime · Stripe secured</Text>
          </Animated.View>
        )}

        <View style={styles.featuresList}>
          {features.map((feature, i) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(350 + i * 70).duration(350)}
              style={styles.featureRow}
            >
              <View style={styles.featureIcon}>
                <MaterialIcons name={feature.icon} size={22} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
              {isPremium ? (
                <MaterialIcons name="check-circle" size={20} color={theme.success} />
              ) : null}
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(700).duration(400)}>
          {isPremium ? (
            <Pressable
              style={styles.manageBtn}
              onPress={handleManageSubscription}
              disabled={loadingPortal}
            >
              {loadingPortal ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <MaterialIcons name="settings" size={18} color={theme.primary} />
                  <Text style={styles.manageBtnText}>Manage Subscription</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={[styles.ctaBtn, loadingCheckout && { opacity: 0.6 }]}
              onPress={handleSubscribe}
              disabled={loadingCheckout}
            >
              {loadingCheckout ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Text style={styles.ctaBtnText}>Subscribe for {config.premium.price}/{config.premium.period}</Text>
              )}
            </Pressable>
          )}
        </Animated.View>

        {!isPremium ? (
          <Animated.View entering={FadeInUp.delay(800).duration(400)}>
            <Text style={styles.legalText}>
              Payment is processed through Stripe. Subscription automatically renews monthly.
              Cancel anytime from subscription management.
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(850).duration(400)} style={styles.stripeNotice}>
          <MaterialIcons name="lock" size={14} color={theme.textMuted} />
          <Text style={styles.stripeText}>
            Secure payment via Stripe
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.bodyBold },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  badgeSection: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  badgeImage: { width: 160, height: 160 },
  heroTitle: { ...typography.title, textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { ...typography.body, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  // Status card (premium active)
  statusCard: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: theme.radiusLarge,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  statusCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.success },
  statusActiveText: { ...typography.bodyBold, color: theme.success, fontSize: 15 },
  statusRenew: { ...typography.caption, marginBottom: 4 },
  statusPlan: { ...typography.small, color: theme.textSecondary },

  // Price card (not premium)
  priceCard: { backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: theme.radiusLarge, padding: 20, alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceAmount: { fontSize: 48, fontWeight: '700', color: theme.primary },
  pricePeriod: { fontSize: 16, fontWeight: '500', color: theme.textSecondary, marginLeft: 2 },
  priceNote: { ...typography.caption, marginTop: 6 },

  featuresList: { gap: 4, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radiusMedium, padding: 14, borderWidth: 1, borderColor: theme.border },
  featureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  featureContent: { flex: 1, marginLeft: 12 },
  featureTitle: { ...typography.bodyBold, marginBottom: 2 },
  featureDesc: { ...typography.small, color: theme.textSecondary, lineHeight: 16 },

  ctaBtn: { backgroundColor: theme.primary, borderRadius: theme.radiusMedium, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ctaBtnText: { ...typography.button, fontSize: 17 },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: theme.radiusMedium, height: 56, marginBottom: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
  },
  manageBtnText: { ...typography.bodyBold, color: theme.primary, fontSize: 16 },
  legalText: { ...typography.small, color: theme.textMuted, textAlign: 'center', lineHeight: 16, marginBottom: 16 },
  stripeNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
  stripeText: { ...typography.small, color: theme.textMuted, textAlign: 'center' },
});

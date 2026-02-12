import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useRef } from 'react';
import { useAction } from 'convex/react';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { api } from '@/convex/_generated/api';

export default function Index() {
  const { isSignedIn, isLoading, convexUser, needsOnboarding } = useAuthenticatedUser();
  const { hasDetourPlus, isLoading: isRevenueCatLoading } = useRevenueCat();
  const syncMyEntitlement = useAction(api.subscriptions.syncMyEntitlement);
  const syncStartedRef = useRef(false);

  // Background sync: keep server-side entitlement flag up to date
  const shouldSync =
    isSignedIn && !!convexUser && convexUser.userStatus === 'approved' && (hasDetourPlus || convexUser.hasDetourPlus);

  useEffect(() => {
    if (!shouldSync) {
      syncStartedRef.current = false;
      return;
    }
    if (syncStartedRef.current) return;
    syncStartedRef.current = true;
    syncMyEntitlement().catch(() => {});
  }, [shouldSync, syncMyEntitlement, convexUser?._id]);

  // Show loading while checking auth state or subscription status
  if (isLoading || isRevenueCatLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#fd6b03" />
      </View>
    );
  }

  // Not signed in -> go to onboarding/landing
  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  // Signed in but no Convex user -> needs onboarding
  if (needsOnboarding || !convexUser) {
    return <Redirect href="/onboarding/join-path" />;
  }

  // Signed in but pending approval
  if (convexUser.userStatus === 'pending') {
    return <Redirect href="/pending" />;
  }

  // Approved but no active subscription -> show paywall
  // Trust client-side RevenueCat as primary check; server sync updates DB in background
  if (!hasDetourPlus && !convexUser.hasDetourPlus) {
    return <Redirect href="/paywall" />;
  }

  // Approved + subscribed -> go to main app
  return <Redirect href="/(tabs)" />;
}

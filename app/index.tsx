import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { api } from '@/convex/_generated/api';

export default function Index() {
  const { isSignedIn, isLoading, convexUser, needsOnboarding } = useAuthenticatedUser();
  const { hasDetourPlus, isLoading: isRevenueCatLoading, isConfigured } = useRevenueCat();
  const syncMyEntitlement = useAction(api.subscriptions.syncMyEntitlement);
  const [isServerSubscriptionSynced, setIsServerSubscriptionSynced] = useState(false);
  const [serverHasDetourPlus, setServerHasDetourPlus] = useState<boolean | null>(null);
  const syncStartedRef = useRef(false);
  const shouldSyncServerEntitlement =
    isSignedIn && !!convexUser && convexUser.userStatus === 'approved' && hasDetourPlus;

  useEffect(() => {
    if (!shouldSyncServerEntitlement) {
      setIsServerSubscriptionSynced(true);
      setServerHasDetourPlus(null);
      syncStartedRef.current = false;
      return;
    }

    if (syncStartedRef.current) return;
    syncStartedRef.current = true;
    setIsServerSubscriptionSynced(false);
    syncMyEntitlement()
      .then((result) => setServerHasDetourPlus(result.hasDetourPlus))
      .catch(() => setServerHasDetourPlus(false))
      .finally(() => setIsServerSubscriptionSynced(true));
  }, [shouldSyncServerEntitlement, syncMyEntitlement, convexUser?._id]);

  // Show loading while checking auth state or subscription status
  if (
    isLoading ||
    (isConfigured && isRevenueCatLoading) ||
    (shouldSyncServerEntitlement && !isServerSubscriptionSynced)
  ) {
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
  if (!hasDetourPlus) {
    return <Redirect href="/paywall" />;
  }

  // Client indicates active subscription, but server sync could not confirm it.
  if (shouldSyncServerEntitlement && isServerSubscriptionSynced && !serverHasDetourPlus) {
    return <Redirect href="/paywall" />;
  }

  // Approved + subscribed -> go to main app
  return <Redirect href="/(tabs)" />;
}

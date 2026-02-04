import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useRevenueCat } from '@/context/RevenueCatContext';

export default function Index() {
  const { isSignedIn, isLoading, convexUser, needsOnboarding } = useAuthenticatedUser();
  const { hasDetourPlus, isLoading: isRevenueCatLoading, isConfigured } = useRevenueCat();

  // Show loading while checking auth state or subscription status
  if (isLoading || (isConfigured && isRevenueCatLoading)) {
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

  // Approved + subscribed -> go to main app
  return <Redirect href="/(tabs)" />;
}

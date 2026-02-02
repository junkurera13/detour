import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';

export default function Index() {
  const { isSignedIn, isLoading, convexUser, needsOnboarding } = useAuthenticatedUser();

  // Show loading while checking auth state
  if (isLoading) {
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

  // Approved -> go to main app
  return <Redirect href="/(tabs)" />;
}

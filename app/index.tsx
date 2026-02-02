import { Redirect } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';

export default function Index() {
  const { data } = useOnboarding();

  // Not completed onboarding yet -> go to onboarding welcome
  if (!data.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Completed onboarding but still pending -> show waitlist screen
  if (data.userStatus === 'pending') {
    return <Redirect href="/pending" />;
  }

  // Approved -> go to main app
  return <Redirect href="/(tabs)" />;
}

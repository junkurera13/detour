import { Redirect } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';

export default function Index() {
  const { data } = useOnboarding();

  if (data.hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}

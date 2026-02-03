import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { tokenCache } from '@/lib/tokenCache';
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { RevenueCatProvider } from '@/context/RevenueCatContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { env } from '@/lib/env';

const convex = new ConvexReactClient(env.convexUrl);
const clerkPublishableKey = env.clerkPublishableKey;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (!clerkPublishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <RevenueCatProvider>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <OnboardingProvider>
            <ErrorBoundary>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#fff' },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen
                  name="onboarding"
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="pending"
                  options={{
                    gestureEnabled: false,
                  }}
                />
              </Stack>
              <StatusBar style="dark" />
            </ErrorBoundary>
            </OnboardingProvider>
          </ConvexProviderWithClerk>
        </RevenueCatProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

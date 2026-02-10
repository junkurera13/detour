import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useFinalizeAuth } from '@/hooks/useFinalizeAuth';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const finalizeAuth = useFinalizeAuth();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!isClerkLoaded || !isSignedIn || hasStartedRef.current) return;

    hasStartedRef.current = true;

    void (async () => {
      const result = await finalizeAuth();

      if (!result.ok) {
        Alert.alert('Error', 'Authentication failed. Please try again.');
        router.replace('/onboarding');
      }
    })();
  }, [finalizeAuth, isClerkLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isClerkLoaded || isSignedIn) return;

    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 8000);

    return () => clearTimeout(timer);
  }, [isClerkLoaded, isSignedIn, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ActivityIndicator size="large" color="#fd6b03" />
      <Text
        className="mt-4 text-gray-500 text-center"
        style={{ fontFamily: 'InstrumentSans_400Regular' }}
      >
        completing sign in...
      </Text>
    </View>
  );
}

import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useFinalizeAuth } from '@/hooks/useFinalizeAuth';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function AuthLandingScreen() {
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const finalizeAuth = useFinalizeAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authResolutionFailed, setAuthResolutionFailed] = useState(false);
  const authInFlightRef = useRef(false);

  const handleAuthSuccess = useCallback(async () => {
    if (authInFlightRef.current) return;

    authInFlightRef.current = true;
    setAuthResolutionFailed(false);
    setIsLoading(true);

    const result = await finalizeAuth();

    if (!result.ok) {
      authInFlightRef.current = false;
      setAuthResolutionFailed(true);
      setIsLoading(false);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    }
  }, [finalizeAuth]);

  useEffect(() => {
    if (!isClerkLoaded || !isSignedIn || authResolutionFailed) return;
    void handleAuthSuccess();
  }, [authResolutionFailed, handleAuthSuccess, isClerkLoaded, isSignedIn]);

  if (isLoading || (isClerkLoaded && isSignedIn && !authResolutionFailed)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#fd6b03" />
        <Text
          className="mt-4 text-gray-500"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          signing you in...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require('@/assets/images/onboarding-bg.png')}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-12">
          <View className="flex-1 items-center justify-end" style={{ paddingBottom: 120 }}>
            <Text
              className="text-white"
              style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 96, marginBottom: -20 }}
            >
              detour
            </Text>
            <Text
              className="text-white"
              style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 18 }}
            >
              wander together.
            </Text>
          </View>

          <View className="pb-6 gap-3">
            <OAuthButtons
              onError={(error) => Alert.alert('Error', error)}
            />
          </View>

          <View className="pb-8">
            <Text
              className="text-center text-white"
              style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 12, lineHeight: 18 }}
            >
              by signing in or creating an account with detour,{'\n'}you agree with our{' '}
              <Text className="underline text-white">terms of service</Text>
              {' '}and{' '}
              <Text className="underline text-white">privacy policy</Text>.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

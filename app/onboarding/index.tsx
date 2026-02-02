import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOnboarding } from '@/context/OnboardingContext';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function AuthLandingScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getOrCreateUser = useMutation(api.users.getOrCreateByToken);

  const handleAuthSuccess = async () => {
    setIsLoading(true);

    // Retry logic to handle token propagation delay
    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if user exists in Convex
        const result = await getOrCreateUser({});

        if (result.isNew || !result.user) {
          // New user - start onboarding
          router.replace('/onboarding/name');
        } else {
          // Existing user - update local state and route based on status
          const user = result.user;
          updateData({
            name: user.name,
            username: user.username,
            hasCompletedOnboarding: true,
            userStatus: user.userStatus as 'none' | 'pending' | 'approved',
          });

          if (user.userStatus === 'approved') {
            router.replace('/(tabs)');
          } else {
            router.replace('/pending');
          }
        }
        return; // Success, exit the function
      } catch (error) {
        lastError = error;
        console.error(`Auth attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    console.error('Auth error after all retries:', lastError);
    Alert.alert('Error', 'Authentication failed. Please try again.');
    setIsLoading(false);
  };

  if (showEmailAuth) {
    return (
      <EmailAuth
        onSuccess={handleAuthSuccess}
        onBack={() => setShowEmailAuth(false)}
      />
    );
  }

  if (isLoading) {
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
          <View className="flex-1 items-center justify-end" style={{ paddingBottom: 100 }}>
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
            <TouchableOpacity
              onPress={() => setShowEmailAuth(true)}
              className="w-full items-center justify-center bg-white py-4 px-8 rounded-full"
              activeOpacity={0.8}
            >
              <Text
                className="text-black text-lg"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                continue with email
              </Text>
            </TouchableOpacity>

            <OAuthButtons
              onSuccess={handleAuthSuccess}
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

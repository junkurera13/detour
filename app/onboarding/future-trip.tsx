import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function FutureTripScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [futureTrip, setFutureTrip] = useState(data.futureTrip);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  const createUser = useMutation(api.users.create);

  const handleFinish = async (tripValue: string) => {
    if (isSubmitting) return;

    if (!isAuthenticated) {
      Alert.alert('Error', 'Authentication error. Please restart the app.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user in Convex with pending status
      await createUser({
        name: data.name,
        username: data.username,
        birthday: data.birthday?.toISOString() ?? new Date().toISOString(),
        gender: data.gender,
        lookingFor: data.lookingFor,
        datingPreference: data.datingPreference.length > 0 ? data.datingPreference : undefined,
        lifestyle: data.lifestyle,
        timeNomadic: data.timeNomadic,
        interests: data.interests,
        photos: data.photos,
        instagram: data.instagram || undefined,
        currentLocation: data.currentLocation,
        futureTrip: tripValue || undefined,
        joinPath: 'apply',
        userStatus: 'pending',
      });

      // Update local state
      updateData({
        futureTrip: tripValue,
        hasCompletedOnboarding: true,
        userStatus: 'pending',
      });

      // Go to pending screen
      router.replace('/pending');
    } catch (error) {
      console.error('Failed to create user:', error);
      Alert.alert(
        'Error',
        'Failed to create your account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    handleFinish(futureTrip);
  };

  const handleSkip = () => {
    handleFinish('');
  };

  if (isSubmitting) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#fd6b03" />
        <Text
          className="mt-4 text-gray-500"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          creating your profile...
        </Text>
      </View>
    );
  }

  return (
    <OnboardingLayout
      title="where to next?"
      subtitle="connect with nomads at your next destination"
      currentStep={12}
      showSkip
      onSkip={handleSkip}
    >
      <View className="flex-1 pt-8">
        <View className="flex-row items-center bg-blue-50 rounded-2xl p-4 mb-6">
          <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
            <Ionicons name="airplane" size={20} color="#fff" />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="text-sm text-blue-600"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              pro tip
            </Text>
            <Text
              className="text-blue-800"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              add upcoming trips to meet people before you arrive
            </Text>
          </View>
        </View>

        <Input
          value={futureTrip}
          onChangeText={setFutureTrip}
          placeholder="e.g. bali, indonesia"
          autoCapitalize="none"
        />

        <Text
          className="text-sm text-gray-500 mt-3 text-center"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          you can add more trips later from your profile
        </Text>
      </View>

      <View className="pb-8">
        <Button
          title="finish"
          onPress={handleContinue}
        />
      </View>
    </OnboardingLayout>
  );
}

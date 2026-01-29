import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

export default function FutureTripScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [futureTrip, setFutureTrip] = useState(data.futureTrip);

  const handleContinue = () => {
    updateData({ futureTrip });
    router.push('/onboarding/paywall');
  };

  const handleSkip = () => {
    updateData({ futureTrip: '' });
    router.push('/onboarding/paywall');
  };

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
          title="continue"
          onPress={handleContinue}
        />
      </View>
    </OnboardingLayout>
  );
}

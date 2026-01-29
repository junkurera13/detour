import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

export default function InstagramScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [instagram, setInstagram] = useState(data.instagram);

  const handleContinue = () => {
    updateData({ instagram });
    router.push('/onboarding/location');
  };

  const handleSkip = () => {
    updateData({ instagram: '' });
    router.push('/onboarding/location');
  };

  return (
    <OnboardingLayout
      title="link your instagram"
      subtitle="let others see more of your adventures"
      currentStep={10}
      showSkip
      onSkip={handleSkip}
    >
      <View className="flex-1 pt-8">
        <View className="flex-row items-center bg-gray-50 rounded-2xl p-4 mb-6">
          <Ionicons name="logo-instagram" size={32} color="#E4405F" />
          <View className="ml-3 flex-1">
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              profiles with instagram linked get
            </Text>
            <Text
              className="text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              2x more connections
            </Text>
          </View>
        </View>

        <Input
          value={instagram}
          onChangeText={(text) => setInstagram(text.replace('@', ''))}
          placeholder="username"
          prefix="@"
          autoCapitalize="none"
        />
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={instagram.length > 0 && instagram.length < 3}
        />
      </View>
    </OnboardingLayout>
  );
}

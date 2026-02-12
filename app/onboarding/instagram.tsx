import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';

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
      currentStep={13}
      showSkip
      onSkip={handleSkip}
    >
      <View className="flex-1 pt-8">
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

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';

export default function NameScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [name, setName] = useState(data.name);

  const handleContinue = () => {
    updateData({ name });
    router.push('/onboarding/username');
  };

  return (
    <OnboardingLayout
      title="what's your name?"
      subtitle="this is how you'll appear to others"
      currentStep={1}
      showBack={false}
    >
      <View className="flex-1 pt-8">
        <Input
          value={name}
          onChangeText={setName}
          placeholder="your name"
          autoCapitalize="none"
          maxLength={30}
        />
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={name.trim().length < 2}
        />
      </View>
    </OnboardingLayout>
  );
}

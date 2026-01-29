import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';

export default function UsernameScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [username, setUsername] = useState(data.username);

  const handleContinue = () => {
    updateData({ username: username.toLowerCase().replace(/\s/g, '') });
    router.push('/onboarding/birthday');
  };

  const formatUsername = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9._]/g, '');
  };

  return (
    <OnboardingLayout
      title="choose a username"
      subtitle="this is how others will find you"
      currentStep={2}
      showBack={true}
    >
      <View className="flex-1 pt-8">
        <Input
          value={username}
          onChangeText={(text) => setUsername(formatUsername(text))}
          placeholder="username"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={username.trim().length < 3}
        />
      </View>
    </OnboardingLayout>
  );
}

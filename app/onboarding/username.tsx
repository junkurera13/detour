import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

export default function UsernameScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [username, setUsername] = useState(data.username);
  const [debouncedUsername, setDebouncedUsername] = useState('');

  // Debounce username for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.trim().length >= 3) {
        setDebouncedUsername(username.trim());
      } else {
        setDebouncedUsername('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Check username availability
  const isAvailable = useQuery(
    api.users.checkUsernameAvailable,
    debouncedUsername.length >= 3 ? { username: debouncedUsername } : "skip"
  );

  const handleContinue = () => {
    updateData({ username: username.toLowerCase().replace(/\s/g, '') });
    router.push('/onboarding/birthday');
  };

  const formatUsername = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9._]/g, '');
  };

  const isValidLength = username.trim().length >= 3;
  const isChecking = isValidLength && debouncedUsername !== username.trim();
  const canContinue = isValidLength && isAvailable === true;

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
          maxLength={20}
        />

        {/* Availability indicator */}
        {isValidLength && (
          <View className="flex-row items-center mt-3 ml-1">
            {isChecking || isAvailable === undefined ? (
              <>
                <Text
                  className="text-gray-400 text-sm"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  checking availability...
                </Text>
              </>
            ) : isAvailable ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text
                  className="text-green-500 text-sm ml-1"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  username available
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color="#ef4444" />
                <Text
                  className="text-red-500 text-sm ml-1"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  username taken
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </View>
    </OnboardingLayout>
  );
}

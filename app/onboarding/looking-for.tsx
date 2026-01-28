import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { SelectionChip } from '@/components/ui/SelectionChip';

const lookingForOptions = [
  { id: 'friends', label: 'friends', emoji: '👋', description: 'travel buddies and connections' },
  { id: 'dating', label: 'dating', emoji: '❤️', description: 'romantic connections' },
  { id: 'both', label: 'both', emoji: '✨', description: 'open to anything' },
];

const preferenceOptions = [
  { id: 'women', label: 'women' },
  { id: 'men', label: 'men' },
  { id: 'everyone', label: 'everyone' },
];

export default function LookingForScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [lookingFor, setLookingFor] = useState<'friends' | 'dating' | 'both' | null>(data.lookingFor);
  const [preferences, setPreferences] = useState<string[]>(data.datingPreference);

  const showPreferences = lookingFor === 'dating' || lookingFor === 'both';

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    updateData({
      lookingFor,
      datingPreference: showPreferences ? preferences : [],
    });
    router.push('/onboarding/lifestyle');
  };

  const canContinue = lookingFor && (!showPreferences || preferences.length > 0);

  return (
    <OnboardingLayout
      title="what are you looking for?"
      subtitle="you can always change this later"
      currentStep={4}
    >
      <View className="flex-1 pt-6">
        {lookingForOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setLookingFor(option.id as any)}
            className={`p-5 rounded-2xl mb-3 border-2 ${
              lookingFor === option.id
                ? 'border-orange-primary bg-orange-50'
                : 'border-gray-100 bg-white'
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">{option.emoji}</Text>
              <View className="flex-1">
                <Text
                  className="text-lg text-black"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  {option.label}
                </Text>
                <Text
                  className="text-sm text-gray-500 mt-0.5"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {option.description}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {showPreferences && (
          <View className="mt-6">
            <Text
              className="text-lg text-black mb-4"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              show me
            </Text>
            <View className="flex-row flex-wrap">
              {preferenceOptions.map((option) => (
                <SelectionChip
                  key={option.id}
                  label={option.label}
                  selected={preferences.includes(option.id)}
                  onPress={() => togglePreference(option.id)}
                />
              ))}
            </View>
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

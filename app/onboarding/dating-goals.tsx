import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

const datingGoalOptions = [
  { id: 'long-term', label: 'a long-term relationship' },
  { id: 'life-partner', label: 'a life partner' },
  { id: 'casual', label: 'fun, casual dates' },
  { id: 'intimacy', label: 'intimacy, without commitment' },
];

export default function DatingGoalsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.datingGoals);

  const toggleGoal = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((g) => g !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    updateData({ datingGoals: selected });
    router.push('/onboarding/lifestyle');
  };

  return (
    <OnboardingLayout
      title="who are you hoping to find?"
      subtitle="its your dating journey, so choose 1 or 2 options that feel right to you."
      currentStep={5}
    >
      <View className="flex-1 pt-6">
        {datingGoalOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => toggleGoal(option.id)}
            className={`p-4 rounded-2xl mb-3 border-2 ${
              selected.includes(option.id)
                ? 'border-orange-primary bg-white'
                : 'border-gray-100 bg-white'
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-lg text-black flex-1"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {option.label}
              </Text>
              {selected.includes(option.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#fd6b03" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={selected.length === 0}
        />
      </View>
    </OnboardingLayout>
  );
}

import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { SelectionChip } from '@/components/ui/SelectionChip';
import { useOnboarding } from '@/context/OnboardingContext';

const lifestyleOptions = [
  { id: 'van-life', label: 'van life', emoji: '🚐' },
  { id: 'backpacker', label: 'backpacker', emoji: '🎒' },
  { id: 'digital-nomad', label: 'digital nomad', emoji: '💻' },
  { id: 'rv-life', label: 'rv life', emoji: '🏕️' },
  { id: 'boat-life', label: 'boat life', emoji: '⛵' },
  { id: 'house-sitting', label: 'house sitting', emoji: '🏠' },
  { id: 'slow-travel', label: 'slow travel', emoji: '🐢' },
  { id: 'perpetual-traveler', label: 'perpetual traveler', emoji: '✈️' },
  { id: 'seasonal-worker', label: 'seasonal worker', emoji: '🌾' },
  { id: 'expat', label: 'expat', emoji: '🌍' },
  { id: 'hostel-hopper', label: 'hostel hopper', emoji: '🛏️' },
  { id: 'workaway', label: 'workaway/volunteer', emoji: '🤝' },
];

export default function LifestyleScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.lifestyle);

  const toggleLifestyle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((l) => l !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    updateData({ lifestyle: selected });
    router.push('/onboarding/time-nomadic');
  };

  return (
    <OnboardingLayout
      title="what's your lifestyle?"
      subtitle={`select up to 3 (${selected.length}/3)`}
      currentStep={6}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <View className="flex-row flex-wrap">
            {lifestyleOptions.map((option) => (
              <SelectionChip
                key={option.id}
                label={option.label}
                emoji={option.emoji}
                selected={selected.includes(option.id)}
                onPress={() => toggleLifestyle(option.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="pt-6 pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={selected.length === 0}
        />
      </View>
    </OnboardingLayout>
  );
}

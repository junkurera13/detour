import { View, Text } from 'react-native';
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
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    updateData({ lifestyle: selected });
    router.push('/onboarding/time-nomadic');
  };

  return (
    <OnboardingLayout
      title="what's your lifestyle?"
      subtitle="select all that apply"
      currentStep={5}
      scrollable
    >
      <View className="pt-4 pb-24">
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

      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={selected.length === 0}
        />
      </View>
    </OnboardingLayout>
  );
}

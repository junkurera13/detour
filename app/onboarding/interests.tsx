import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { SelectionChip } from '@/components/ui/SelectionChip';
import { useOnboarding } from '@/context/OnboardingContext';

const interestOptions = [
  { id: 'hiking', label: 'hiking', emoji: '🥾' },
  { id: 'photography', label: 'photography', emoji: '📸' },
  { id: 'surfing', label: 'surfing', emoji: '🏄' },
  { id: 'yoga', label: 'yoga', emoji: '🧘' },
  { id: 'coffee', label: 'coffee', emoji: '☕' },
  { id: 'cooking', label: 'cooking', emoji: '👨‍🍳' },
  { id: 'music', label: 'music', emoji: '🎵' },
  { id: 'reading', label: 'reading', emoji: '📚' },
  { id: 'diving', label: 'diving', emoji: '🤿' },
  { id: 'climbing', label: 'climbing', emoji: '🧗' },
  { id: 'camping', label: 'camping', emoji: '⛺' },
  { id: 'languages', label: 'languages', emoji: '🗣️' },
  { id: 'art', label: 'art', emoji: '🎨' },
  { id: 'writing', label: 'writing', emoji: '✍️' },
  { id: 'fitness', label: 'fitness', emoji: '💪' },
  { id: 'gaming', label: 'gaming', emoji: '🎮' },
  { id: 'wine', label: 'wine', emoji: '🍷' },
  { id: 'nightlife', label: 'nightlife', emoji: '🌃' },
  { id: 'sustainability', label: 'sustainability', emoji: '♻️' },
  { id: 'meditation', label: 'meditation', emoji: '🧠' },
  { id: 'remote-work', label: 'remote work', emoji: '💼' },
  { id: 'coworking', label: 'coworking', emoji: '🏢' },
  { id: 'movies', label: 'movies', emoji: '🎬' },
  { id: 'food', label: 'food', emoji: '🍜' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.interests);

  const toggleInterest = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    updateData({ interests: selected });
    router.push('/onboarding/photos');
  };

  return (
    <OnboardingLayout
      title="what are you into?"
      subtitle={`pick 5 interests (${selected.length}/5)`}
      currentStep={7}
      scrollable
    >
      <View className="pt-4 pb-24">
        <View className="flex-row flex-wrap">
          {interestOptions.map((option) => (
            <SelectionChip
              key={option.id}
              label={option.label}
              emoji={option.emoji}
              selected={selected.includes(option.id)}
              onPress={() => toggleInterest(option.id)}
            />
          ))}
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 bg-white pt-4">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={selected.length !== 5}
        />
      </View>
    </OnboardingLayout>
  );
}

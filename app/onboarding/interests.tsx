import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { SelectionChip } from '@/components/ui/SelectionChip';
import { useOnboarding } from '@/context/OnboardingContext';

const interestCategories = [
  {
    category: 'eat & drink',
    options: [
      { id: 'grab-coffee', label: 'grab coffee' },
      { id: 'try-street-food', label: 'try street food' },
      { id: 'cook-together', label: 'cook together' },
      { id: 'hit-night-markets', label: 'hit night markets' },
      { id: 'go-wine-tasting', label: 'go wine tasting' },
      { id: 'try-local-beer', label: 'try local beer' },
      { id: 'brunch-dates', label: 'brunch dates' },
      { id: 'find-hidden-gems', label: 'find hidden gems' },
    ],
  },
  {
    category: 'get outside',
    options: [
      { id: 'go-hiking', label: 'go hiking' },
      { id: 'go-surfing', label: 'go surfing' },
      { id: 'go-diving', label: 'go diving' },
      { id: 'go-camping', label: 'go camping' },
      { id: 'go-climbing', label: 'go climbing' },
      { id: 'go-cycling', label: 'go cycling' },
      { id: 'beach-days', label: 'beach days' },
      { id: 'go-skating', label: 'go skating' },
      { id: 'go-skiing', label: 'go skiing' },
      { id: 'explore-the-city', label: 'explore the city' },
      { id: 'road-trips', label: 'road trips' },
    ],
  },
  {
    category: 'play sports',
    options: [
      { id: 'play-pickleball', label: 'play pickleball' },
      { id: 'play-padel', label: 'play padel' },
      { id: 'play-soccer', label: 'play soccer' },
      { id: 'play-basketball', label: 'play basketball' },
      { id: 'play-tennis', label: 'play tennis' },
      { id: 'play-volleyball', label: 'play volleyball' },
      { id: 'play-golf', label: 'play golf' },
    ],
  },
  {
    category: 'go out',
    options: [
      { id: 'grab-drinks', label: 'grab drinks' },
      { id: 'go-dancing', label: 'go dancing' },
      { id: 'see-live-music', label: 'see live music' },
      { id: 'go-clubbing', label: 'go clubbing' },
      { id: 'do-karaoke', label: 'do karaoke' },
      { id: 'see-comedy', label: 'see comedy' },
      { id: 'go-to-festivals', label: 'go to festivals' },
    ],
  },
  {
    category: 'stay active',
    options: [
      { id: 'hit-the-gym', label: 'hit the gym' },
      { id: 'do-yoga', label: 'do yoga' },
      { id: 'go-running', label: 'go running' },
      { id: 'do-crossfit', label: 'do crossfit' },
      { id: 'try-muay-thai', label: 'try muay thai' },
      { id: 'morning-stretches', label: 'morning stretches' },
    ],
  },
  {
    category: 'explore & learn',
    options: [
      { id: 'visit-museums', label: 'visit museums' },
      { id: 'take-photos', label: 'take photos' },
      { id: 'find-street-art', label: 'find street art' },
      { id: 'watch-films', label: 'watch films' },
      { id: 'learn-languages', label: 'learn languages' },
      { id: 'take-a-class', label: 'take a class' },
      { id: 'browse-markets', label: 'browse markets' },
    ],
  },
  {
    category: 'cowork & create',
    options: [
      { id: 'cowork-at-cafes', label: 'cowork at cafes' },
      { id: 'brainstorm-ideas', label: 'brainstorm ideas' },
      { id: 'make-content', label: 'make content' },
      { id: 'jam-together', label: 'jam together' },
      { id: 'build-stuff', label: 'build stuff' },
    ],
  },
  {
    category: 'take it easy',
    options: [
      { id: 'watch-sunsets', label: 'watch sunsets' },
      { id: 'read-together', label: 'read together' },
      { id: 'play-board-games', label: 'play board games' },
      { id: 'chill-at-the-beach', label: 'chill at the beach' },
      { id: 'meditate', label: 'meditate' },
      { id: 'spa-days', label: 'spa days' },
    ],
  },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const validIds = new Set(interestCategories.flatMap((c) => c.options.map((o) => o.id)));
  const [selected, setSelected] = useState<string[]>(
    data.interests.filter((id) => validIds.has(id))
  );

  const toggleInterest = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 15) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    updateData({ interests: selected });
    router.push('/onboarding/lifestyle');
  };

  return (
    <OnboardingLayout
      title="what do you love doing?"
      subtitle={`pick the activities you'd want to do with someone. this helps us find your people. (${selected.length}/15)`}
      currentStep={6}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-4 pb-4">
          {interestCategories.map((category) => (
            <View key={category.category} className="mb-6">
              <Text
                className="text-base text-gray-500 mb-3"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {category.category}
              </Text>
              <View className="flex-row flex-wrap">
                {category.options.map((option) => (
                  <SelectionChip
                    key={option.id}
                    label={option.label}
                    selected={selected.includes(option.id)}
                    onPress={() => toggleInterest(option.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="pt-6 pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={selected.length < 5}
        />
      </View>
    </OnboardingLayout>
  );
}

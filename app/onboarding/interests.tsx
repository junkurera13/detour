import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { SelectionChip } from '@/components/ui/SelectionChip';
import { useOnboarding } from '@/context/OnboardingContext';

const interestCategories = [
  {
    category: 'food & drink',
    options: [
      { id: 'foodie', label: 'foodie' },
      { id: 'cooking', label: 'cooking' },
      { id: 'baking', label: 'baking' },
      { id: 'coffee-cafes', label: 'coffee & cafes' },
      { id: 'food-markets', label: 'food markets' },
      { id: 'wine-tasting', label: 'wine tasting' },
      { id: 'craft-beer', label: 'craft beer' },
      { id: 'alcohol-free', label: 'alcohol-free' },
      { id: 'vegan', label: 'vegan' },
      { id: 'vegetarian', label: 'vegetarian' },
    ],
  },
  {
    category: 'outdoors & adventure',
    options: [
      { id: 'hiking', label: 'hiking' },
      { id: 'camping', label: 'camping' },
      { id: 'rock-climbing', label: 'rock climbing' },
      { id: 'surfing', label: 'surfing' },
      { id: 'cycling', label: 'cycling' },
      { id: 'mountaineering', label: 'mountaineering' },
      { id: 'diving', label: 'diving' },
      { id: 'beach', label: 'beach' },
      { id: 'snowboarding', label: 'snowboarding' },
      { id: 'skating', label: 'skating' },
      { id: 'skiing', label: 'skiing' },
      { id: 'pickleball', label: 'pickleball' },
      { id: 'padel', label: 'padel' },
      { id: 'soccer', label: 'soccer' },
      { id: 'basketball', label: 'basketball' },
      { id: 'tennis', label: 'tennis' },
      { id: 'golf', label: 'golf' },
      { id: 'park-days', label: 'park days' },
      { id: 'urban-exploring', label: 'urban exploring' },
    ],
  },
  {
    category: 'nightlife & entertainment',
    options: [
      { id: 'nightlife', label: 'nightlife' },
      { id: 'bars-drinks', label: 'bars & drinks' },
      { id: 'clubbing', label: 'clubbing' },
      { id: 'live-music', label: 'live music' },
      { id: 'music', label: 'music' },
      { id: 'karaoke', label: 'karaoke' },
      { id: 'dancing', label: 'dancing' },
      { id: 'comedy-shows', label: 'comedy shows' },
      { id: 'shopping', label: 'shopping' },
      { id: 'gaming', label: 'gaming' },
      { id: 'anime', label: 'anime' },
    ],
  },
  {
    category: 'fitness & wellness',
    options: [
      { id: 'gym-lifting', label: 'gym / lifting' },
      { id: 'yoga', label: 'yoga' },
      { id: 'wellness', label: 'wellness' },
      { id: 'running', label: 'running' },
      { id: 'meditation', label: 'meditation' },
      { id: 'cold-plunge', label: 'cold plunge' },
      { id: 'spa', label: 'spa' },
      { id: 'crossfit', label: 'crossfit' },
    ],
  },
  {
    category: 'arts & culture',
    options: [
      { id: 'museums-galleries', label: 'museums & galleries' },
      { id: 'photography', label: 'photography' },
      { id: 'street-art', label: 'street art' },
      { id: 'local-history', label: 'local history' },
      { id: 'film-cinema', label: 'film / cinema' },
      { id: 'theatre', label: 'theatre' },
      { id: 'local-markets', label: 'local markets' },
      { id: 'history', label: 'history' },
      { id: 'architecture', label: 'architecture' },
      { id: 'language-exchange', label: 'language exchange' },
    ],
  },
  {
    category: 'work & lifestyle',
    options: [
      { id: 'entrepreneur', label: 'entrepreneur' },
      { id: 'content-creator', label: 'content creator' },
      { id: 'freelancer', label: 'freelancer' },
      { id: 'cafe-working', label: 'cafe working' },
      { id: 'productivity-nerd', label: 'productivity nerd' },
    ],
  },
  {
    category: 'music & festivals',
    options: [
      { id: 'festivals', label: 'festivals' },
      { id: 'live-concerts', label: 'live concerts' },
      { id: 'making-music', label: 'making music' },
      { id: 'djing', label: 'DJing' },
      { id: 'jam-sessions', label: 'jam sessions' },
    ],
  },
  {
    category: 'chill & slow living',
    options: [
      { id: 'reading', label: 'reading' },
      { id: 'journaling', label: 'journaling' },
      { id: 'podcasts', label: 'podcasts' },
      { id: 'sunsets', label: 'sunsets' },
      { id: 'board-games', label: 'board games' },
      { id: 'solo-exploring', label: 'solo exploring' },
    ],
  },
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
      if (prev.length >= 10) {
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
      subtitle={`proud foodie or big on hiking? add interests to your profile to help you match with people who love them too! (${selected.length}/10)`}
      currentStep={8}
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

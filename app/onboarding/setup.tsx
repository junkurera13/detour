import { View, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { SelectionChip } from '@/components/ui/SelectionChip';
import { useOnboarding } from '@/context/OnboardingContext';

const setupOptions = [
  { id: 'converted-van', label: 'converted van', emoji: '🚐' },
  { id: 'suv-car', label: 'suv / car', emoji: '🚗' },
  { id: 'truck-camper', label: 'truck camper', emoji: '🛻' },
  { id: 'rv-motorhome', label: 'rv / motorhome', emoji: '🏕️' },
  { id: 'trailer', label: 'trailer', emoji: '🏠' },
  { id: 'bike-motorcycle', label: 'bike / motorcycle', emoji: '🏍️' },
  { id: 'on-foot', label: 'on foot', emoji: '🥾' },
  { id: 'boat-sailboat', label: 'boat / sailboat', emoji: '⛵' },
  { id: 'no-vehicle', label: 'no vehicle', emoji: '✈️' },
];

export default function SetupScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string>(data.rigType);
  const [rigName, setRigName] = useState(data.rigName);

  const handleSelect = (id: string) => {
    setSelected(id === selected ? '' : id);
  };

  const handleContinue = () => {
    updateData({ rigType: selected, rigName: rigName.trim() });
    router.push('/onboarding/time-nomadic');
  };

  return (
    <OnboardingLayout
      title="what's your setup?"
      subtitle="select your ride"
      currentStep={8}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <View className="flex-row flex-wrap">
            {setupOptions.map((option) => (
              <SelectionChip
                key={option.id}
                label={option.label}
                emoji={option.emoji}
                selected={selected === option.id}
                onPress={() => handleSelect(option.id)}
              />
            ))}
          </View>

          {selected && (
            <View className="mt-6">
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-black"
                placeholder="rig name (optional)"
                placeholderTextColor="#9CA3AF"
                value={rigName}
                onChangeText={setRigName}
                maxLength={30}
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View className="pt-6 pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={!selected}
        />
      </View>
    </OnboardingLayout>
  );
}

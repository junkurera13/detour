import { View, Text, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { SelectionChip } from '@/components/ui/SelectionChip';

const coupleIcon = require('@/assets/images/couple-icon.jpeg');

const preferenceOptions = [
  { id: 'women', label: 'women' },
  { id: 'men', label: 'men' },
  { id: 'everyone', label: 'everyone' },
];

export default function LookingForScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [datingPreference, setDatingPreference] = useState<string[]>(data.datingPreference);

  const selectDatingPreference = (id: string) => {
    setDatingPreference([id]);
  };

  const handleContinue = () => {
    updateData({
      lookingFor: ['dating'],
      datingPreference,
    });
    router.push('/onboarding/dating-goals');
  };

  const canContinue = datingPreference.length > 0;

  return (
    <OnboardingLayout
      title="what are you looking for?"
      subtitle="you can always change this later"
      currentStep={4}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-6">
          {/* Dating card — always selected */}
          <View
            className="px-5 py-3 rounded-2xl mb-3 bg-white"
          >
            <View className="flex-row items-center">
              <Image
                source={coupleIcon}
                style={{ width: 72, height: 72, borderRadius: 36, marginRight: 16 }}
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text
                  className="text-lg text-black"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                >
                  dating
                </Text>
                <Text
                  className="text-sm text-gray-500 mt-0.5"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  romantic connections
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-4 ml-4">
            <Text
              className="text-base text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              show me
            </Text>
            <View className="flex-row flex-wrap">
              {preferenceOptions.map((pref) => (
                <SelectionChip
                  key={pref.id}
                  label={pref.label}
                  selected={datingPreference.includes(pref.id)}
                  onPress={() => selectDatingPreference(pref.id)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

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

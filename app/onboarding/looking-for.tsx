import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { SelectionChip } from '@/components/ui/SelectionChip';

const friendsIcon = require('@/assets/images/friends-icon.jpeg');
const coupleIcon = require('@/assets/images/couple-icon.jpeg');

const lookingForOptions = [
  { id: 'friends', label: 'friends', icon: friendsIcon, description: 'travel buddies and connections' },
  { id: 'dating', label: 'dating', icon: coupleIcon, description: 'romantic connections' },
];

const preferenceOptions = [
  { id: 'women', label: 'women' },
  { id: 'men', label: 'men' },
  { id: 'everyone', label: 'everyone' },
];

export default function LookingForScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [lookingFor, setLookingFor] = useState<string[]>(data.lookingFor);
  const [friendsPreference, setFriendsPreference] = useState<string[]>(data.friendsPreference);
  const [datingPreference, setDatingPreference] = useState<string[]>(data.datingPreference);

  const toggleLookingFor = (id: string) => {
    setLookingFor((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const selectFriendsPreference = (id: string) => {
    setFriendsPreference([id]);
  };

  const selectDatingPreference = (id: string) => {
    setDatingPreference([id]);
  };

  const handleContinue = () => {
    updateData({
      lookingFor,
      friendsPreference: lookingFor.includes('friends') ? friendsPreference : [],
      datingPreference: lookingFor.includes('dating') ? datingPreference : [],
    });

    if (lookingFor.includes('dating')) {
      router.push('/onboarding/dating-goals');
    } else {
      router.push('/onboarding/lifestyle');
    }
  };

  const hasFriends = lookingFor.includes('friends');
  const hasDating = lookingFor.includes('dating');

  const canContinue =
    lookingFor.length > 0 &&
    (!hasFriends || friendsPreference.length > 0) &&
    (!hasDating || datingPreference.length > 0);

  return (
    <OnboardingLayout
      title="what are you looking for?"
      subtitle="you can always change this later"
      currentStep={4}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-6">
          {lookingForOptions.map((option) => {
            const isSelected = lookingFor.includes(option.id);
            const isFriends = option.id === 'friends';
            const isDating = option.id === 'dating';

            return (
              <View key={option.id}>
                <TouchableOpacity
                  onPress={() => toggleLookingFor(option.id)}
                  className={`px-5 py-3 rounded-2xl mb-3 border-2 bg-white ${
                    isSelected
                      ? 'border-orange-primary'
                      : 'border-gray-100'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Image
                      source={option.icon}
                      style={{ width: 72, height: 72, borderRadius: 36, marginRight: 16 }}
                      resizeMode="cover"
                    />
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

                {isSelected && isFriends && (
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
                          selected={friendsPreference.includes(pref.id)}
                          onPress={() => selectFriendsPreference(pref.id)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {isSelected && isDating && (
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
                )}
              </View>
            );
          })}
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

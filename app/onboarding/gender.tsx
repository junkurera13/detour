import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

const genderOptions = [
  { id: 'woman', label: 'woman', icon: 'female' },
  { id: 'man', label: 'man', icon: 'male' },
  { id: 'nonbinary', label: 'non-binary', icon: 'male-female' },
];

export default function GenderScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState(data.gender);

  const handleContinue = () => {
    updateData({ gender: selected });
    router.push('/onboarding/looking-for');
  };

  return (
    <OnboardingLayout
      title="what's your gender?"
      subtitle="this helps us show you to the right people"
      currentStep={3}
    >
      <View className="flex-1 pt-6">
        {genderOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setSelected(option.id)}
            className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
              selected === option.id
                ? 'border-orange-primary bg-white'
                : 'border-gray-100 bg-white'
            }`}
            activeOpacity={0.7}
          >
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
              selected === option.id ? 'bg-orange-50' : 'bg-gray-100'
            }`}>
              <Ionicons
                name={option.icon as any}
                size={24}
                color={selected === option.id ? '#fd6b03' : '#6B7280'}
              />
            </View>
            <Text
              className="text-lg text-black flex-1"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              {option.label}
            </Text>
            {selected === option.id && (
              <Ionicons name="checkmark-circle" size={24} color="#fd6b03" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={!selected}
        />
      </View>
    </OnboardingLayout>
  );
}

import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

const timeOptions = [
  { id: 'just-starting', label: 'just starting out', description: 'planning my first adventure' },
  { id: 'less-than-6-months', label: 'less than 6 months', description: 'fresh on the road' },
  { id: '6-months-to-1-year', label: '6 months - 1 year', description: 'getting the hang of it' },
  { id: '1-to-2-years', label: '1 - 2 years', description: 'experienced traveler' },
  { id: '2-plus-years', label: '2+ years', description: 'seasoned nomad' },
];

export default function TimeNomadicScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState(data.timeNomadic);

  const handleContinue = () => {
    updateData({ timeNomadic: selected });
    router.push('/onboarding/interests');
  };

  return (
    <OnboardingLayout
      title="how long have you been nomadic?"
      subtitle="we all started somewhere"
      currentStep={6}
    >
      <View className="flex-1 pt-4">
        {timeOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setSelected(option.id)}
            className={`p-4 rounded-2xl mb-3 border-2 ${
              selected === option.id
                ? 'border-orange-primary bg-orange-50'
                : 'border-gray-100 bg-white'
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
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
              {selected === option.id && (
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
          disabled={!selected}
        />
      </View>
    </OnboardingLayout>
  );
}

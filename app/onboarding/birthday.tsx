import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';

export default function BirthdayScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [date, setDate] = useState<Date>(data.birthday || new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 21);

  const isValidAge = date <= maxDate;

  const handleContinue = () => {
    updateData({ birthday: date });
    router.push('/onboarding/gender');
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).toLowerCase();
  };

  return (
    <OnboardingLayout
      title="when's your birthday?"
      subtitle="you must be 21+ to use detour"
      currentStep={2}
    >
      <View className="flex-1 pt-8">
        {Platform.OS === 'android' && (
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="bg-gray-50 rounded-2xl py-4 px-5"
          >
            <Text
              className="text-lg text-black"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              {formatDate(date)}
            </Text>
          </TouchableOpacity>
        )}

        {showPicker && (
          <View className="items-center">
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowPicker(false);
                }
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
              minimumDate={minDate}
              maximumDate={new Date()}
              textColor="#000"
            />
          </View>
        )}

        {!isValidAge && (
          <View className="mt-4 bg-red-50 rounded-2xl p-4">
            <Text
              className="text-red-600 text-center"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              you must be 21 or older to use detour
            </Text>
          </View>
        )}
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={!isValidAge}
        />
      </View>
    </OnboardingLayout>
  );
}

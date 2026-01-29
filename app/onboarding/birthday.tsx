import { Button } from '@/components/ui/Button';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

export default function BirthdayScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [date, setDate] = useState<Date>(data.birthday || new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 21);

  const isValidAge = date <= maxDate;

  const calculateAge = (birthday: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  const handleContinue = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    updateData({ birthday: date });
    setShowConfirmModal(false);
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

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white mx-6 rounded-3xl p-6 w-full max-w-sm">
            <TouchableOpacity
              onPress={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <Text
              className="text-2xl mb-2"
              style={{ fontFamily: 'InstrumentSans_600SemiBold', color: '#fd6b03' }}
            >
              you're {calculateAge(date)}
            </Text>
            <Text
              className="text-base text-gray-500 mb-1"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              your birthday is {formatDate(date)}
            </Text>
            <Text
              className="text-sm text-gray-500 mb-6"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              make sure this is the right date. you won't be able to change it later.
            </Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                }}
              >
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 16 }}
                >
                  edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                }}
              >
                <Text
                  className="text-black"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16 }}
                >
                  confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </OnboardingLayout>
  );
}

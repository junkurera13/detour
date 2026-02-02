import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';

export default function JoinPathScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();

  const handleContinue = () => {
    updateData({ joinPath: 'apply' });
    router.push('/onboarding/name');
  };

  const handleInviteCode = () => {
    router.push('/onboarding/invite-code');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-4">
        <Text
          className="text-3xl text-black mb-4"
          style={{ fontFamily: 'InstrumentSans_700Bold' }}
        >
          detour is application-only
        </Text>
        <Text
          className="text-lg text-gray-500 leading-7"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          we carefully review every application to ensure our community stays authentic and filled with genuine nomads looking to connect.{'\n\n'}complete your profile and we'll let you know when you're in.
        </Text>
      </View>

      {/* Footer */}
      <View className="px-6 pb-4">
        <TouchableOpacity
          onPress={handleContinue}
          style={{
            backgroundColor: '#fd6b03',
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          <Text
            className="text-white text-lg"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleInviteCode} className="mt-4">
          <Text
            className="text-center text-gray-500 text-base"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            i have an invite code
          </Text>
        </TouchableOpacity>

        <Text
          className="text-center text-gray-400 mt-10"
          style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 12 }}
        >
          by signing up to detour, you agree to the{'\n'}
          <Text className="underline">terms of service</Text> and{' '}
          <Text className="underline">privacy policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

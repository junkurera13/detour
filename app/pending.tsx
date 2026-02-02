import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';

export default function PendingScreen() {
  const router = useRouter();
  const { data, updateData, resetData } = useOnboarding();

  const handleEnterInviteCode = () => {
    // Reset to allow entering invite code
    updateData({
      hasCompletedOnboarding: false,
      userStatus: 'none',
      joinPath: null,
    });
    router.replace('/onboarding/invite-code');
  };

  const handleLogout = () => {
    resetData();
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 items-center justify-center">
        {/* Waitlist Icon */}
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: '#FFF7ED' }}
        >
          <Ionicons name="hourglass-outline" size={40} color="#fd6b03" />
        </View>

        {/* Title */}
        <Text
          className="text-3xl text-black text-center mb-3"
          style={{ fontFamily: 'InstrumentSans_700Bold' }}
        >
          you're on the list{data.name ? `, ${data.name.toLowerCase()}` : ''}!
        </Text>

        {/* Description */}
        <Text
          className="text-lg text-gray-500 text-center px-4 leading-7"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          we're reviewing your application and will{'\n'}
          notify you when you're approved.
        </Text>

        {/* Position indicator (mock) */}
        <View
          className="mt-8 px-6 py-4 rounded-2xl"
          style={{ backgroundColor: '#F9FAFB' }}
        >
          <Text
            className="text-center text-gray-500"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            your position: <Text style={{ color: '#fd6b03' }}>#247</Text>
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 pb-8">
        <Text
          className="text-center text-gray-400 text-sm mb-4"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          have an invite code?{' '}
          <Text
            style={{ color: '#fd6b03', textDecorationLine: 'underline' }}
            onPress={handleEnterInviteCode}
          >
            skip the wait
          </Text>
        </Text>

        <TouchableOpacity onPress={handleLogout}>
          <Text
            className="text-center text-gray-400 text-sm"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            log out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12">
        <View className="flex-1 justify-center">
          <Text
            className="text-4xl text-black mb-3"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            detour
          </Text>

          <Text
            className="text-lg text-gray-500 leading-7"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            find your people on the road.{'\n'}friends, dates, and travel buddies.
          </Text>
        </View>

        <View className="pb-6 gap-3">
          <TouchableOpacity
            onPress={() => router.push('/onboarding/name')}
            className="w-full items-center justify-center bg-white border-2 border-gray-200 py-4 px-8 rounded-2xl"
            activeOpacity={0.8}
          >
            <Text
              className="text-black text-lg"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              continue with phone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/onboarding/name')}
            className="w-full flex-row items-center justify-center bg-white border-2 border-gray-200 py-4 px-8 rounded-2xl"
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#000" />
            <Text
              className="text-black text-lg ml-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/onboarding/name')}
            className="w-full flex-row items-center justify-center bg-white border-2 border-gray-200 py-4 px-8 rounded-2xl"
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={20} color="#000" />
            <Text
              className="text-black text-lg ml-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              apple
            </Text>
          </TouchableOpacity>
        </View>

        <View className="pb-8">
          <Text
            className="text-center text-sm text-gray-500 leading-5"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            by signing in or creating an account with detour,{'\n'}you agree with our{' '}
            <Text
              className="underline"
              onPress={() => {
                // TODO: Open terms of service
              }}
            >
              terms of service
            </Text>
            {' '}and{' '}
            <Text
              className="underline"
              onPress={() => {
                // TODO: Open privacy policy
              }}
            >
              privacy policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

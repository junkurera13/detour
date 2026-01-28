import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('@/assets/images/onboarding-bg.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-12">
          <View className="flex-1 items-center justify-end" style={{ paddingBottom: 85 }}>
            <Text
              className="text-white"
              style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 96, marginBottom: -20 }}
            >
              detour
            </Text>
            <Text
              className="text-white"
              style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 18 }}
            >
              wander together.
            </Text>
          </View>

        <View className="pb-6 gap-3">
          <TouchableOpacity
            onPress={() => router.push('/onboarding/name')}
            className="w-full items-center justify-center bg-white py-4 px-8 rounded-full"
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
            className="w-full flex-row items-center justify-center bg-white py-4 px-8 rounded-full"
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
            className="w-full flex-row items-center justify-center bg-white py-4 px-8 rounded-full"
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={22} color="#000" />
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
            className="text-center text-white"
            style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 10, lineHeight: 16 }}
          >
            by signing in or creating an account with detour,{'\n'}you agree with our{' '}
            <Text
              className="underline text-white"
              onPress={() => {
                // TODO: Open terms of service
              }}
            >
              terms of service
            </Text>
            {' '}and{' '}
            <Text
              className="underline text-white"
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
    </ImageBackground>
  );
}

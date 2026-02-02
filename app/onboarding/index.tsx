import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useOnboarding } from '@/context/OnboardingContext';

export default function LandingScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();

  const skipToApp = () => {
    updateData({
      name: 'Demo User',
      username: 'demouser',
      birthday: new Date('1995-06-15'),
      gender: 'non-binary',
      lookingFor: ['friends', 'dating'],
      lifestyle: ['digital-nomad', 'van-life'],
      timeNomadic: '1-2-years',
      interests: ['hiking', 'photography', 'coffee'],
      photos: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'],
      instagram: 'demouser',
      currentLocation: 'lisbon, portugal',
      futureTrip: 'bali, indonesia',
      hasCompletedOnboarding: true,
      joinPath: 'invite',
      userStatus: 'approved',
      inviteCode: 'DEVSKIP',
    });
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require('@/assets/images/onboarding-bg.png')}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <SafeAreaView className="flex-1">
        <TouchableOpacity
          onPress={skipToApp}
          className="absolute top-12 right-6 z-10 bg-black/50 px-3 py-2 rounded-full"
        >
          <Text className="text-white text-xs" style={{ fontFamily: 'InstrumentSans_600SemiBold' }}>
            DEV: Skip
          </Text>
        </TouchableOpacity>
        <View className="flex-1 px-6 pt-12">
          <View className="flex-1 items-center justify-center" style={{ paddingBottom: 100 }}>
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
        </View>

        <View className="absolute left-0 right-0 px-6" style={{ bottom: 50 }}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding/join-path')}
            className="w-full items-center justify-center bg-white py-4 px-8 rounded-full"
            activeOpacity={0.8}
          >
            <Text
              className="text-black text-lg"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              join detour
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/onboarding/auth?mode=login')}
            activeOpacity={0.8}
            className="py-4"
          >
            <Text
              className="text-white text-lg text-center"
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              already a member? login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

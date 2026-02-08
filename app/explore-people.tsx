import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { mockUsers } from '@/data/mockData';

// Lifestyle ID to label mapping
const lifestyleLabels: Record<string, string> = {
  'van-life': 'van life',
  'backpacker': 'backpacker',
  'digital-nomad': 'digital nomad',
  'rv-life': 'rv life',
  'boat-life': 'boat life',
  'house-sitting': 'house sitting',
  'slow-travel': 'slow travel',
  'perpetual-traveler': 'perpetual traveler',
  'seasonal-worker': 'seasonal worker',
  'expat': 'expat',
  'hostel-hopper': 'hostel hopper',
  'workaway': 'workaway/volunteer',
};

// Generate arrival dates dynamically
const arrivalDates = ['Feb 10', 'Feb 12', 'Feb 15', 'Feb 18', 'Feb 20', 'Feb 22', 'Feb 25', 'Mar 1', 'Mar 5'];

// Convert mockUsers for explore people list
const explorePeople = mockUsers.slice(0, 15).map((user, index) => ({
  id: user.id,
  name: user.name,
  age: user.age,
  photo: user.photos[0],
  futureTrips: user.futureTrip ? [{ location: user.futureTrip }] : undefined,
  arrivalDate: arrivalDates[index % arrivalDates.length],
  lifestyle: user.lifestyle,
  currentLocation: user.location,
  isOnline: user.isOnline,
}));

export default function ExplorePeopleScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { convexUser } = useAuthenticatedUser();

  // Prefer Convex user data (persisted) over onboarding context (in-memory only)
  const futureTrips = convexUser?.futureTrips ?? data.futureTrips;
  const hasFutureTrip = futureTrips && futureTrips.length > 0;
  const firstTrip = futureTrips?.[0]?.location;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          explore
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Heading Your Way Section */}
        {hasFutureTrip && (
        <View className="mb-8">
            <View className="flex-row items-center px-6 mb-4">
              <Text
                className="text-lg text-black"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                heading your way
              </Text>
              <View className="ml-2 px-3 py-1 rounded-full bg-blue-100">
                <Text
                  className="text-sm text-blue-600"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  {firstTrip}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {explorePeople.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  className="mr-3"
                  style={{ width: 120 }}
                  activeOpacity={0.8}
                >
                  <View className="rounded-2xl overflow-hidden bg-gray-100">
                    <Image
                      source={{ uri: user.photo }}
                      style={{ width: 120, height: 112 }}
                      resizeMode="cover"
                    />
                    <View className="p-2">
                      <Text
                        className="text-sm text-black"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                        numberOfLines={1}
                      >
                        {user.name}, {user.age}
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-0.5"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        arrives {user.arrivalDate}
                      </Text>
                      {user.lifestyle[0] && (
                        <View className="mt-2 bg-orange-100 px-2 py-1 rounded-full self-start">
                          <Text
                            className="text-xs text-orange-600"
                            style={{ fontFamily: 'InstrumentSans_500Medium' }}
                            numberOfLines={1}
                          >
                            {lifestyleLabels[user.lifestyle[0]] || user.lifestyle[0]}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Nearby People Section */}
        <View className="px-6">
          <Text
            className="text-lg text-black mb-4"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            nearby
          </Text>
          {explorePeople.map((user) => (
            <TouchableOpacity
              key={user.id}
              className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
              activeOpacity={0.7}
            >
              <View className="relative">
                <Image
                  source={{ uri: user.photo }}
                  className="w-16 h-16 rounded-full"
                  resizeMode="cover"
                />
                {user.isOnline && (
                  <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                )}
              </View>
              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text
                    className="text-black text-lg"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {user.name}, {user.age}
                  </Text>
                  {user.isOnline && (
                    <Text
                      className="text-green-500 text-xs ml-2"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      online
                    </Text>
                  )}
                </View>
                <Text
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {user.currentLocation}
                </Text>
                {user.lifestyle[0] && (
                  <View className="mt-1 bg-orange-100 px-2 py-0.5 rounded-full self-start">
                    <Text
                      className="text-xs text-orange-600"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      {lifestyleLabels[user.lifestyle[0]] || user.lifestyle[0]}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

const mockProfiles = [
  {
    id: '1',
    name: 'sarah',
    age: 28,
    location: 'lisbon, portugal',
    lifestyle: ['digital nomad', 'slow travel'],
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    distance: '2 km away',
  },
  {
    id: '2',
    name: 'marcus',
    age: 32,
    location: 'lisbon, portugal',
    lifestyle: ['van life', 'backpacker'],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    distance: '5 km away',
  },
  {
    id: '3',
    name: 'emma',
    age: 26,
    location: 'lisbon, portugal',
    lifestyle: ['digital nomad'],
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    distance: '8 km away',
  },
];

export default function NearbyScreen() {
  const { data } = useOnboarding();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text
            className="text-2xl text-black"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            nearby
          </Text>
          <Text
            className="text-gray-500"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            {data.currentLocation || 'lisbon, portugal'}
          </Text>
        </View>
        <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons name="options-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="pt-4">
          {mockProfiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              className="mb-4 bg-white rounded-3xl overflow-hidden border border-gray-100"
              activeOpacity={0.9}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <Image
                source={{ uri: profile.photo }}
                className="w-full h-80"
                resizeMode="cover"
              />
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text
                      className="text-xl text-black"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {profile.name}, {profile.age}
                    </Text>
                    <View className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                  </View>
                  <Text
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {profile.distance}
                  </Text>
                </View>

                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                  <Text
                    className="text-gray-500 text-sm ml-1"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {profile.location}
                  </Text>
                </View>

                <View className="flex-row flex-wrap mt-3 gap-2">
                  {profile.lifestyle.map((style) => (
                    <View
                      key={style}
                      className="bg-gray-100 px-3 py-1.5 rounded-full"
                    >
                      <Text
                        className="text-gray-700 text-sm"
                        style={{ fontFamily: 'InstrumentSans_500Medium' }}
                      >
                        {style}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="flex-row mt-4 gap-3">
                  <TouchableOpacity className="flex-1 bg-gray-100 py-3 rounded-2xl items-center">
                    <Ionicons name="close" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 rounded-2xl overflow-hidden">
                    <LinearGradient
                      colors={['#fd6b03', '#fd9003']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="py-3 items-center"
                    >
                      <Ionicons name="heart" size={24} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

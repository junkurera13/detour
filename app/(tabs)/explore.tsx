import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { mockUsers, mockActivities as importedMockActivities } from '@/data/mockData';

// Interest ID to label mapping
const interestLabels: Record<string, string> = {
  'foodie': 'foodie',
  'cooking': 'cooking',
  'baking': 'baking',
  'coffee-cafes': 'coffee & cafes',
  'food-markets': 'food markets',
  'wine-tasting': 'wine tasting',
  'craft-beer': 'craft beer',
  'alcohol-free': 'alcohol-free',
  'vegan': 'vegan',
  'vegetarian': 'vegetarian',
  'hiking': 'hiking',
  'camping': 'camping',
  'rock-climbing': 'rock climbing',
  'surfing': 'surfing',
  'cycling': 'cycling',
  'mountaineering': 'mountaineering',
  'diving': 'diving',
  'beach': 'beach',
  'snowboarding': 'snowboarding',
  'skating': 'skating',
  'skiing': 'skiing',
  'pickleball': 'pickleball',
  'padel': 'padel',
  'soccer': 'soccer',
  'basketball': 'basketball',
  'tennis': 'tennis',
  'golf': 'golf',
  'park-days': 'park days',
  'urban-exploring': 'urban exploring',
  'nightlife': 'nightlife',
  'bars-drinks': 'bars & drinks',
  'clubbing': 'clubbing',
  'live-music': 'live music',
  'music': 'music',
  'karaoke': 'karaoke',
  'dancing': 'dancing',
  'comedy-shows': 'comedy shows',
  'shopping': 'shopping',
  'gaming': 'gaming',
  'anime': 'anime',
  'gym-lifting': 'gym / lifting',
  'yoga': 'yoga',
  'wellness': 'wellness',
  'running': 'running',
  'meditation': 'meditation',
  'cold-plunge': 'cold plunge',
  'spa': 'spa',
  'crossfit': 'crossfit',
  'museums-galleries': 'museums & galleries',
  'photography': 'photography',
  'street-art': 'street art',
  'local-history': 'local history',
  'film-cinema': 'film / cinema',
  'theatre': 'theatre',
  'local-markets': 'local markets',
  'history': 'history',
  'architecture': 'architecture',
  'language-exchange': 'language exchange',
  'entrepreneur': 'entrepreneur',
  'content-creator': 'content creator',
  'freelancer': 'freelancer',
  'cafe-working': 'cafe working',
  'productivity-nerd': 'productivity nerd',
  'festivals': 'festivals',
  'live-concerts': 'live concerts',
  'making-music': 'making music',
  'djing': 'DJing',
  'jam-sessions': 'jam sessions',
  'reading': 'reading',
  'journaling': 'journaling',
  'podcasts': 'podcasts',
  'sunsets': 'sunsets',
  'board-games': 'board games',
  'solo-exploring': 'solo exploring',
};

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

interface MatchingRouteUser {
  id: string;
  name: string;
  age: number;
  photo: string;
  futureTrip?: string;
  arrivalDate: string;
  lifestyle: string[];
  currentLocation: string;
  isOnline?: boolean;
}

interface Activity {
  id: string;
  title: string;
  category: string;
  photo: string;
  host: { name: string; photo: string };
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
}

// Generate arrival dates dynamically
const arrivalDates = ['Feb 10', 'Feb 12', 'Feb 15', 'Feb 18', 'Feb 20', 'Feb 22', 'Feb 25', 'Mar 1', 'Mar 5'];

// Convert mockUsers to MatchingRouteUser format
const mockMatchingUsers: MatchingRouteUser[] = mockUsers.slice(0, 15).map((user, index) => ({
  id: user.id,
  name: user.name,
  age: user.age,
  photo: user.photos[0],
  futureTrip: user.futureTrip,
  arrivalDate: arrivalDates[index % arrivalDates.length],
  lifestyle: user.lifestyle,
  currentLocation: user.location,
  isOnline: user.isOnline,
}));

// Use the comprehensive mock activities
const mockActivities: Activity[] = importedMockActivities.map((activity) => ({
  id: activity.id,
  title: activity.title.toLowerCase(),
  category: activity.category,
  photo: activity.image,
  host: { name: activity.host.name, photo: activity.host.avatar },
  date: activity.date,
  time: activity.time,
  location: activity.location,
  attendees: activity.attendees,
  maxAttendees: activity.maxAttendees,
}));

export default function ExploreScreen() {
  const { data } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'people' | 'activity'>('people');
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  // Get user's interests for filter pills
  const userInterests = useMemo(() => data.interests || [], [data.interests]);

  // Filter activities based on selected interest
  const filteredActivities = useMemo(() => {
    if (!selectedInterest) {
      // Show all activities that match any of user's interests
      return mockActivities.filter(activity =>
        userInterests.includes(activity.category)
      );
    }
    return mockActivities.filter(activity => activity.category === selectedInterest);
  }, [selectedInterest, userInterests]);

  // Check if user has a future trip set
  const hasFutureTrip = data.futureTrip && data.futureTrip.trim() !== '';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-4">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          explore
        </Text>
      </View>

      <View className="flex-row px-6 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('people')}
          className={`flex-1 py-3 rounded-full mr-2 ${activeTab === 'people' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'people' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            people
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('activity')}
          className={`flex-1 py-3 rounded-full ml-2 ${activeTab === 'activity' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'activity' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            activity
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'people' ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Section: Matching Routes */}
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
                    {data.futureTrip}
                  </Text>
                </View>
              </View>

              {mockMatchingUsers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24 }}
                >
                  {mockMatchingUsers.map((user, index) => (
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
              ) : (
                <View className="px-6">
                  <Text
                    className="text-gray-500 text-center py-8"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    no one else is heading to {data.futureTrip} yet
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Nearby people section */}
          <View className="px-6">
            <Text
              className="text-lg text-black mb-4"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              nearby
            </Text>
            {mockMatchingUsers.map((user) => (
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
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Recommended Activities */}
          <View className="px-6 mb-4">
            <Text
              className="text-lg text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              recommended for you
            </Text>
          </View>

          {/* Interest filter pills */}
          {userInterests.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedInterest(null)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: selectedInterest === null ? '#fd6b03' : '#F3F4F6' }}
              >
                <Text
                  className={`text-sm ${selectedInterest === null ? 'text-white' : 'text-black'}`}
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  all
                </Text>
              </TouchableOpacity>
              {userInterests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  onPress={() => setSelectedInterest(interest)}
                  className="mr-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: selectedInterest === interest ? '#fd6b03' : '#F3F4F6' }}
                >
                  <Text
                    className={`text-sm ${selectedInterest === interest ? 'text-white' : 'text-black'}`}
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {interestLabels[interest] || interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Activity cards */}
          <View className="px-6">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  className="mb-4 rounded-2xl overflow-hidden bg-white"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  activeOpacity={0.9}
                >
                  {/* Activity photo with category badge */}
                  <View className="relative">
                    <Image
                      source={{ uri: activity.photo }}
                      style={{ width: '100%', height: 160 }}
                      resizeMode="cover"
                    />
                    {/* Category badge overlay */}
                    <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full">
                      <Text
                        className="text-xs text-orange-600"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {interestLabels[activity.category] || activity.category}
                      </Text>
                    </View>
                  </View>

                  {/* Activity details */}
                  <View className="p-4">
                    <Text
                      className="text-lg text-black mb-2"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {activity.title}
                    </Text>

                    {/* Date/time row */}
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text
                        className="text-sm text-gray-500 ml-2"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {activity.date} at {activity.time}
                      </Text>
                    </View>

                    {/* Location row */}
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text
                        className="text-sm text-gray-500 ml-2"
                        style={{ fontFamily: 'InstrumentSans_400Regular' }}
                      >
                        {activity.location}
                      </Text>
                    </View>

                    {/* Host row */}
                    <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: activity.host.photo }}
                          style={{ width: 28, height: 28 }}
                          className="rounded-full"
                        />
                        <Text
                          className="text-sm text-gray-600 ml-2"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          hosted by <Text style={{ fontFamily: 'InstrumentSans_500Medium' }}>{activity.host.name}</Text>
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={14} color="#6B7280" />
                        <Text
                          className="text-sm text-gray-500 ml-1"
                          style={{ fontFamily: 'InstrumentSans_400Regular' }}
                        >
                          {activity.attendees}/{activity.maxAttendees}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="py-12">
                <Text
                  className="text-gray-500 text-center"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  no activities match your interests yet
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

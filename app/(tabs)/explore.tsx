import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { mockActivities as importedMockActivities } from '@/data/mockData';

// Interest ID to label mapping
const interestLabels: Record<string, string> = {
  'grab-coffee': 'grab coffee',
  'try-street-food': 'try street food',
  'cook-together': 'cook together',
  'hit-night-markets': 'hit night markets',
  'go-wine-tasting': 'go wine tasting',
  'try-local-beer': 'try local beer',
  'brunch-dates': 'brunch dates',
  'find-hidden-gems': 'find hidden gems',
  'go-hiking': 'go hiking',
  'go-surfing': 'go surfing',
  'go-diving': 'go diving',
  'go-camping': 'go camping',
  'go-climbing': 'go climbing',
  'go-cycling': 'go cycling',
  'beach-days': 'beach days',
  'go-skating': 'go skating',
  'go-skiing': 'go skiing',
  'explore-the-city': 'explore the city',
  'road-trips': 'road trips',
  'play-pickleball': 'play pickleball',
  'play-padel': 'play padel',
  'play-soccer': 'play soccer',
  'play-basketball': 'play basketball',
  'play-tennis': 'play tennis',
  'play-volleyball': 'play volleyball',
  'play-golf': 'play golf',
  'grab-drinks': 'grab drinks',
  'go-dancing': 'go dancing',
  'see-live-music': 'see live music',
  'go-clubbing': 'go clubbing',
  'do-karaoke': 'do karaoke',
  'see-comedy': 'see comedy',
  'go-to-festivals': 'go to festivals',
  'hit-the-gym': 'hit the gym',
  'do-yoga': 'do yoga',
  'go-running': 'go running',
  'do-crossfit': 'do crossfit',
  'try-muay-thai': 'try muay thai',
  'morning-stretches': 'morning stretches',
  'visit-museums': 'visit museums',
  'take-photos': 'take photos',
  'find-street-art': 'find street art',
  'watch-films': 'watch films',
  'learn-languages': 'learn languages',
  'take-a-class': 'take a class',
  'browse-markets': 'browse markets',
  'cowork-at-cafes': 'cowork at cafes',
  'brainstorm-ideas': 'brainstorm ideas',
  'make-content': 'make content',
  'jam-together': 'jam together',
  'build-stuff': 'build stuff',
  'watch-sunsets': 'watch sunsets',
  'read-together': 'read together',
  'play-board-games': 'play board games',
  'chill-at-the-beach': 'chill at the beach',
  'meditate': 'meditate',
  'spa-days': 'spa days',
};

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
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  // Get user's interests for filter pills
  const userInterests = useMemo(() => data.interests || [], [data.interests]);

  // Filter activities based on selected interest
  const filteredActivities = useMemo(() => {
    if (!selectedInterest) {
      return mockActivities;
    }
    return mockActivities.filter(activity => activity.category === selectedInterest);
  }, [selectedInterest]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-4 pb-4">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular', includeFontPadding: false, paddingBottom: Platform.OS === 'android' ? 10 : 0 }}
        >
          activity
        </Text>
      </View>

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
    </SafeAreaView>
  );
}

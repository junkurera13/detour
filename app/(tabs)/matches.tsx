import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const matches = [
  {
    id: '1',
    name: 'alex',
    age: 29,
    matchedAt: '2 hours ago',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    isNew: true,
  },
  {
    id: '2',
    name: 'jordan',
    age: 31,
    matchedAt: 'yesterday',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    isNew: false,
  },
];

const likes = [
  {
    id: '3',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
  },
  {
    id: '4',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
  },
  {
    id: '5',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  },
];

export default function MatchesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-2">
        <Text
          className="text-2xl text-black"
          style={{ fontFamily: 'InstrumentSans_700Bold' }}
        >
          matches
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-lg text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              likes you
            </Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#fd6b03' }}>
              <Text
                className="text-white text-sm"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {likes.length}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {likes.map((like) => (
              <TouchableOpacity
                key={like.id}
                className="relative"
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: like.photo }}
                  className="w-24 h-32 rounded-2xl"
                  resizeMode="cover"
                  blurRadius={20}
                />
                <View className="absolute inset-0 items-center justify-center">
                  <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                    <Ionicons name="lock-closed" size={20} color="#000" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="w-24 h-32 bg-gray-100 rounded-2xl items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="eye" size={24} color="#000" />
              <Text
                className="text-black text-xs mt-2 text-center"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                see all
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <Text
            className="text-lg text-black mb-4"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            your matches
          </Text>

          {matches.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="heart-outline" size={32} color="#9CA3AF" />
              </View>
              <Text
                className="text-gray-500 text-center"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                no matches yet. keep exploring!
              </Text>
            </View>
          ) : (
            matches.map((match) => (
              <TouchableOpacity
                key={match.id}
                className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3"
                activeOpacity={0.7}
              >
                <View className="relative">
                  <Image
                    source={{ uri: match.photo }}
                    className="w-16 h-16 rounded-full"
                    resizeMode="cover"
                  />
                  {match.isNew && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>
                <View className="flex-1 ml-4">
                  <Text
                    className="text-black text-lg"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {match.name}, {match.age}
                  </Text>
                  <Text
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    matched {match.matchedAt}
                  </Text>
                </View>
                <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center">
                  <Ionicons name="chatbubble" size={20} color="#000" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

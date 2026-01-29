import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

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

const conversations = [
  {
    id: '1',
    name: 'sarah',
    lastMessage: 'that coffee spot looks amazing! want to go tomorrow?',
    time: '2m',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    name: 'alex',
    lastMessage: "hey! just matched. saw you're also in lisbon",
    time: '1h',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    unread: 1,
    online: true,
  },
  {
    id: '3',
    name: 'jordan',
    lastMessage: 'thanks for the coworking recommendation!',
    time: 'yesterday',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    unread: 0,
    online: false,
  },
];

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'matches' | 'messages'>('matches');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-4">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          connections
        </Text>
      </View>

      <View className="flex-row px-6 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('matches')}
          className={`flex-1 py-3 rounded-full mr-2 ${activeTab === 'matches' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'matches' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            matches
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          className={`flex-1 py-3 rounded-full ml-2 ${activeTab === 'messages' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-center ${activeTab === 'messages' ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            messages
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'matches' ? (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="pt-2">
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
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {conversations.length === 0 ? (
            <View className="items-center py-20 px-6">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
              </View>
              <Text
                className="text-xl text-black text-center mb-2"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                no messages yet
              </Text>
              <Text
                className="text-gray-500 text-center"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                when you match with someone, you can start a conversation here.
              </Text>
            </View>
          ) : (
            conversations.map((convo) => (
              <TouchableOpacity
                key={convo.id}
                className="flex-row px-6 py-4 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <View className="relative">
                  <Image
                    source={{ uri: convo.photo }}
                    className="w-14 h-14 rounded-full"
                    resizeMode="cover"
                  />
                  {convo.online && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>

                <View className="flex-1 ml-4">
                  <Text
                    className="text-black text-base"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {convo.name}
                  </Text>
                  <Text
                    className={`text-sm mt-0.5 ${convo.unread > 0 ? 'text-black' : 'text-gray-500'}`}
                    style={{ fontFamily: convo.unread > 0 ? 'InstrumentSans_500Medium' : 'InstrumentSans_400Regular', maxWidth: '92%' }}
                    numberOfLines={1}
                  >
                    {convo.lastMessage}
                  </Text>
                </View>

                <View className="items-end">
                  <Text
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {convo.time}
                  </Text>
                  {convo.unread > 0 && (
                    <View className="w-6 h-6 rounded-full items-center justify-center mt-1" style={{ backgroundColor: '#fd6b03' }}>
                      <Text
                        className="text-white text-xs"
                        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                      >
                        {convo.unread}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

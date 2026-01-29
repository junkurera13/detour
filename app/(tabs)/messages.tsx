import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

const helpRequests = [
  {
    id: '1',
    author: 'jake',
    authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    location: 'san diego, ca',
    title: 'sunroof leaking during rain',
    description: 'my sprinter van sunroof started leaking last night. need someone who can reseal or replace the gasket.',
    budget: '$150',
    category: 'repairs',
    urgent: true,
    responses: 4,
    time: '2h ago',
  },
  {
    id: '2',
    author: 'maya',
    authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    location: 'portland, or',
    title: 'solar panel installation help',
    description: 'looking for someone experienced with solar setups to help me install 400w on my ford transit roof.',
    budget: '$200',
    category: 'electrical',
    urgent: false,
    responses: 7,
    time: '5h ago',
  },
  {
    id: '3',
    author: 'tom',
    authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    location: 'austin, tx',
    title: 'diesel heater not igniting',
    description: 'chinese diesel heater stopped working. makes clicking noise but wont start. anyone nearby who can diagnose?',
    budget: '$100',
    category: 'repairs',
    urgent: true,
    responses: 2,
    time: '1d ago',
  },
  {
    id: '4',
    author: 'lisa',
    authorPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    location: 'denver, co',
    title: 'need help building bed frame',
    description: 'have all the wood cut, just need an extra pair of hands and some guidance on the build.',
    budget: '$75',
    category: 'build',
    urgent: false,
    responses: 3,
    time: '1d ago',
  },
];

const categories = [
  { id: 'all', label: 'all' },
  { id: 'repairs', label: 'repairs' },
  { id: 'electrical', label: 'electrical' },
  { id: 'build', label: 'build' },
  { id: 'plumbing', label: 'plumbing' },
];

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredRequests = selectedCategory === 'all'
    ? helpRequests
    : helpRequests.filter(r => r.category === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          help
        </Text>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2 rounded-full"
          style={{ backgroundColor: '#fd6b03' }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text
            className="text-white ml-1"
            style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
          >
            post
          </Text>
        </TouchableOpacity>
      </View>

      <View className="pb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: selectedCategory === category.id ? '#000' : '#F3F4F6' }}
            >
              <Text
                className={`text-sm ${selectedCategory === category.id ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {filteredRequests.map((request) => (
          <TouchableOpacity
            key={request.id}
            className="mx-6 mb-4 p-4 bg-gray-50 rounded-2xl"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <Image
                  source={{ uri: request.authorPhoto }}
                  className="w-10 h-10 rounded-full"
                  resizeMode="cover"
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="text-black"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {request.author}
                  </Text>
                  <Text
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: 'InstrumentSans_400Regular' }}
                  >
                    {request.location}
                  </Text>
                </View>
              </View>
              {request.urgent && (
                <View className="bg-red-100 px-2 py-1 rounded-full">
                  <Text
                    className="text-red-600 text-xs"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    urgent
                  </Text>
                </View>
              )}
            </View>

            <Text
              className="text-black text-lg mb-2"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {request.title}
            </Text>
            <Text
              className="text-gray-600 mb-3"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
              numberOfLines={2}
            >
              {request.description}
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-green-100 px-3 py-1 rounded-full mr-2">
                  <Text
                    className="text-green-700"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {request.budget}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="hand-wave-outline" size={16} color="#9CA3AF" />
                  <Text
                    className="text-gray-500 text-sm ml-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {request.responses} offers
                  </Text>
                </View>
              </View>
              <Text
                className="text-gray-400 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                {request.time}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

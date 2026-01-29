import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const popularDestinations = [
  { id: '1', name: 'bali', country: 'indonesia', nomads: 234, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
  { id: '2', name: 'lisbon', country: 'portugal', nomads: 189, image: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400' },
  { id: '3', name: 'medellín', country: 'colombia', nomads: 156, image: 'https://images.unsplash.com/photo-1599094254168-4f73f9bf4447?w=400' },
  { id: '4', name: 'bangkok', country: 'thailand', nomads: 198, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400' },
];

const categories = [
  { id: 'all', label: 'all', emoji: '🌍' },
  { id: 'coworking', label: 'coworking', emoji: '💻' },
  { id: 'meetups', label: 'meetups', emoji: '🤝' },
  { id: 'events', label: 'events', emoji: '🎉' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4">
        <Text
          className="text-5xl text-black mb-4"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          explore
        </Text>

        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="search destinations..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-base text-black"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          />
        </View>
      </View>

      <View className="flex-row px-6 py-4 gap-2">
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            className="px-4 py-2 rounded-full flex-row items-center justify-center"
            style={{ backgroundColor: selectedCategory === category.id ? '#fd6b03' : '#F3F4F6' }}
          >
            <Text className="mr-1 text-sm">{category.emoji}</Text>
            <Text
              className={`text-sm ${selectedCategory === category.id ? 'text-white' : 'text-black'}`}
              style={{ fontFamily: 'InstrumentSans_500Medium' }}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <Text
          className="text-lg text-black mb-4"
          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
        >
          popular destinations
        </Text>

        {popularDestinations.map((destination) => (
          <TouchableOpacity
            key={destination.id}
            className="mb-4 rounded-2xl overflow-hidden"
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: destination.image }}
              className="w-full h-40"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/30" />
            <View className="absolute bottom-0 left-0 right-0 p-4">
              <Text
                className="text-white text-xl"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                {destination.name}
              </Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text
                  className="text-white/80"
                  style={{ fontFamily: 'InstrumentSans_400Regular' }}
                >
                  {destination.country}
                </Text>
                <View className="flex-row items-center bg-white/20 px-2 py-1 rounded-full">
                  <Ionicons name="people" size={14} color="#fff" />
                  <Text
                    className="text-white text-sm ml-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {destination.nomads} nomads
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

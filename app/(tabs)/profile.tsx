import { View, Text, ScrollView, Image, TouchableOpacity, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';

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
  'workaway': 'workaway',
};

const interestLabels: Record<string, { label: string; emoji: string }> = {
  'hiking': { label: 'hiking', emoji: '🥾' },
  'photography': { label: 'photography', emoji: '📸' },
  'surfing': { label: 'surfing', emoji: '🏄' },
  'yoga': { label: 'yoga', emoji: '🧘' },
  'coffee': { label: 'coffee', emoji: '☕' },
  'cooking': { label: 'cooking', emoji: '👨‍🍳' },
  'music': { label: 'music', emoji: '🎵' },
  'reading': { label: 'reading', emoji: '📚' },
  'diving': { label: 'diving', emoji: '🤿' },
  'climbing': { label: 'climbing', emoji: '🧗' },
  'camping': { label: 'camping', emoji: '⛺' },
  'languages': { label: 'languages', emoji: '🗣️' },
  'art': { label: 'art', emoji: '🎨' },
  'writing': { label: 'writing', emoji: '✍️' },
  'fitness': { label: 'fitness', emoji: '💪' },
  'gaming': { label: 'gaming', emoji: '🎮' },
  'wine': { label: 'wine', emoji: '🍷' },
  'nightlife': { label: 'nightlife', emoji: '🌃' },
  'sustainability': { label: 'sustainability', emoji: '♻️' },
  'meditation': { label: 'meditation', emoji: '🧠' },
  'remote-work': { label: 'remote work', emoji: '💼' },
  'coworking': { label: 'coworking', emoji: '🏢' },
  'movies': { label: 'movies', emoji: '🎬' },
  'food': { label: 'food', emoji: '🍜' },
};

const settingsItems = [
  { id: 'edit', label: 'edit profile', icon: 'create-outline' },
  { id: 'settings', label: 'settings', icon: 'settings-outline' },
  { id: 'privacy', label: 'privacy', icon: 'shield-outline' },
  { id: 'help', label: 'help & support', icon: 'help-circle-outline' },
];

const recentViewers = [
  { id: '1', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { id: '2', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  { id: '3', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
];

export default function ProfileScreen() {
  const { data, resetData } = useOnboarding();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (menuVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [menuVisible]);

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const handleLogout = () => {
    closeMenu();
    setTimeout(() => {
      resetData();
      router.replace('/onboarding');
    }, 200);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
        <Text
          className="text-5xl text-black"
          style={{ fontFamily: 'InstrumentSerif_400Regular' }}
        >
          profile
        </Text>
        <View className="flex-row items-center gap-3" style={{ marginTop: -8 }}>
          <TouchableOpacity className="flex-row items-center bg-gray-100 rounded-full px-2 py-1">
            {recentViewers.map((viewer, index) => (
              <Image
                key={viewer.id}
                source={{ uri: viewer.photo }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#F3F4F6',
                  marginLeft: index > 0 ? -8 : 0,
                }}
              />
            ))}
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 pb-6 items-center">
          <View className="relative">
            {data.photos.length > 0 ? (
              <Image
                source={{ uri: data.photos[0] }}
                className="w-28 h-28 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person" size={48} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center border-3 border-white" style={{ backgroundColor: '#fd6b03' }}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text
            className="text-2xl text-black mt-4"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            {data.name.toLowerCase() || 'your name'}
          </Text>

          {data.username && (
            <Text
              className="text-gray-500 mt-1"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              @{data.username}
            </Text>
          )}

          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={16} color="#9CA3AF" />
            <Text
              className="text-gray-500 ml-1"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              {data.currentLocation || 'location not set'}
            </Text>
          </View>

          {data.instagram && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="logo-instagram" size={16} color="#E4405F" />
              <Text
                className="text-gray-700 ml-1"
                style={{ fontFamily: 'InstrumentSans_500Medium' }}
              >
                @{data.instagram}
              </Text>
            </View>
          )}
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row justify-around bg-gray-50 rounded-2xl py-4">
            <View className="items-center">
              <Text
                className="text-xl text-black"
                style={{ fontFamily: 'InstrumentSans_700Bold' }}
              >
                0
              </Text>
              <Text
                className="text-gray-500 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                connections
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text
                className="text-xl text-black"
                style={{ fontFamily: 'InstrumentSans_700Bold' }}
              >
                {data.photos.length}
              </Text>
              <Text
                className="text-gray-500 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                photos
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text
                className="text-xl text-black"
                style={{ fontFamily: 'InstrumentSans_700Bold' }}
              >
                {data.lifestyle.length}
              </Text>
              <Text
                className="text-gray-500 text-sm"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                lifestyles
              </Text>
            </View>
          </View>
        </View>

        {data.lifestyle.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              lifestyle
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.lifestyle.map((style) => (
                <View key={style} className="bg-gray-100 px-3 py-2 rounded-full">
                  <Text
                    className="text-gray-700"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {lifestyleLabels[style] || style}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.interests.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-lg text-black mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              interests
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.interests.map((interest) => {
                const info = interestLabels[interest];
                return (
                  <View key={interest} className="bg-gray-100 px-3 py-2 rounded-full flex-row items-center">
                    {info && <Text className="mr-1">{info.emoji}</Text>}
                    <Text
                      className="text-gray-700"
                      style={{ fontFamily: 'InstrumentSans_500Medium' }}
                    >
                      {info?.label || interest}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeMenu}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={closeMenu}
          />
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
            className="bg-white rounded-t-3xl px-6 pb-10 pt-4"
          >
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-6" />

            <View className="bg-gray-50 rounded-2xl overflow-hidden">
              {settingsItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  className={`flex-row items-center px-4 py-4 ${
                    index < settingsItems.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                    <Ionicons name={item.icon as any} size={20} color="#000" />
                  </View>
                  <Text
                    className="flex-1 text-black ml-3"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              className="mt-4 py-4 items-center"
              activeOpacity={0.7}
            >
              <Text
                className="text-red-500"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                log out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Location from 'expo-location';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

export default function LocationScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [location, setLocation] = useState(data.currentLocation);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address) {
        const locationString = [address.city, address.country]
          .filter(Boolean)
          .join(', ')
          .toLowerCase();
        setLocation(locationString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
    setLoading(false);
  };

  const handleContinue = () => {
    updateData({ currentLocation: location });
    router.push('/onboarding/future-trip');
  };

  return (
    <OnboardingLayout
      title="where are you now?"
      subtitle="help nearby nomads find you"
      currentStep={10}
    >
      <View className="flex-1 pt-8">
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={loading}
          className="flex-row items-center bg-gray-50 rounded-2xl p-4 mb-4"
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#fd6b03' }}>
              <Ionicons name="locate" size={20} color="#fff" />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text
              className="text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              {loading ? 'getting location...' : 'use current location'}
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              we'll find the nearest city
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text
            className="mx-4 text-gray-400"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            or type it in
          </Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <Input
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. lisbon, portugal"
          autoCapitalize="none"
        />
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={location.trim().length < 2}
        />
      </View>
    </OnboardingLayout>
  );
}

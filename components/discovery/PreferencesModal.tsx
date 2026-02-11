import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import { RangeSlider } from '@/components/discovery/RangeSlider';
import { useState } from 'react';

const DISTANCE_OPTIONS = [5, 10, 15, 20, 25, 50, 100, Infinity];
const AGE_MIN = 18;
const AGE_MAX = 70;

export { DISTANCE_OPTIONS, AGE_MIN, AGE_MAX };

interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  ageMin: number;
  ageMax: number;
  setAgeMin: (v: number) => void;
  setAgeMax: (v: number) => void;
  prefDistance: number;
  setPrefDistance: (v: number) => void;
  baseLocation: string;
  prefLocation: string;
  setPrefLocation: (v: string) => void;
  setPrefCoords: (v: { latitude: number; longitude: number } | null) => void;
  convexUserCoords: { latitude: number; longitude: number } | null;
}

export function PreferencesModal({
  visible,
  onClose,
  ageMin,
  ageMax,
  setAgeMin,
  setAgeMax,
  prefDistance,
  setPrefDistance,
  baseLocation,
  prefLocation,
  setPrefLocation,
  setPrefCoords,
  convexUserCoords,
}: PreferencesModalProps) {
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
          <Text
            className="text-3xl text-black"
            style={{ fontFamily: 'InstrumentSerif_400Regular' }}
          >
            preferences
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            activeOpacity={0.7}
            accessibilityLabel="Close preferences"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Location */}
          <View className="pt-4 pb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-sm text-gray-500 uppercase"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                location
              </Text>
              {prefLocation !== baseLocation && !isEditingLocation && (
                <TouchableOpacity
                  onPress={() => {
                    setPrefLocation(baseLocation);
                    setPrefCoords(convexUserCoords);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-sm"
                    style={{ fontFamily: 'InstrumentSans_500Medium', color: '#fd6b03' }}
                  >
                    reset
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {isEditingLocation ? (
              <LocationAutocomplete
                value={prefLocation}
                onSelect={(location) => {
                  setPrefLocation(location.fullName);
                  setPrefCoords(location.coordinates || null);
                  setIsEditingLocation(false);
                }}
                placeholder="search for a city..."
              />
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditingLocation(true)}
                activeOpacity={0.7}
                className="flex-row items-center"
              >
                <Ionicons name="location" size={18} color="#fd6b03" />
                <Text
                  className="ml-3 text-black flex-1"
                  style={{ fontFamily: 'InstrumentSans_500Medium', fontSize: 15 }}
                >
                  {prefLocation || 'Tap to set location'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Age Range */}
          <View className="pt-4 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-sm text-gray-500 uppercase"
                style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
              >
                age range
              </Text>
              <Text
                className="text-black"
                style={{ fontFamily: 'InstrumentSans_700Bold', fontSize: 16 }}
              >
                {ageMin} - {ageMax === AGE_MAX ? '70+' : ageMax}
              </Text>
            </View>
            <RangeSlider
              min={AGE_MIN}
              max={AGE_MAX}
              low={ageMin}
              high={ageMax}
              onLowChange={setAgeMin}
              onHighChange={setAgeMax}
            />
          </View>

          {/* Distance */}
          <View className="pb-6">
            <Text
              className="text-sm text-gray-500 uppercase mb-3"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              distance
            </Text>
            <View className="bg-gray-50 rounded-2xl overflow-hidden px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-black"
                  style={{ fontFamily: 'InstrumentSans_500Medium' }}
                >
                  max distance
                </Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => {
                      const idx = DISTANCE_OPTIONS.indexOf(prefDistance);
                      if (idx > 0) setPrefDistance(DISTANCE_OPTIONS[idx - 1]);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                    disabled={prefDistance === DISTANCE_OPTIONS[0]}
                    accessibilityLabel="Decrease distance"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={prefDistance === DISTANCE_OPTIONS[0] ? '#D1D5DB' : '#000'}
                    />
                  </TouchableOpacity>
                  <Text
                    className="mx-4 text-black min-w-[50px] text-center"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {prefDistance === Infinity ? 'everyone' : `${prefDistance} km`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const idx = DISTANCE_OPTIONS.indexOf(prefDistance);
                      if (idx < DISTANCE_OPTIONS.length - 1) setPrefDistance(DISTANCE_OPTIONS[idx + 1]);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                    disabled={prefDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1]}
                    accessibilityLabel="Increase distance"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={prefDistance === DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1] ? '#D1D5DB' : '#000'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

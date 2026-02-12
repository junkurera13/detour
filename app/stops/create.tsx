import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import type { LocationResult } from '@/components/ui/LocationAutocomplete';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import * as ImagePicker from 'expo-image-picker';

const categoryOptions = [
  { id: 'campsite', label: 'campsite', emoji: '🏕️' },
  { id: 'coworking', label: 'co-working', emoji: '💻' },
  { id: 'beach', label: 'beach', emoji: '🏖️' },
  { id: 'rest-area', label: 'rest area', emoji: '🅿️' },
  { id: 'hostel', label: 'hostel', emoji: '🛏️' },
  { id: 'parking', label: 'parking', emoji: '🅿️' },
  { id: 'water', label: 'water', emoji: '💧' },
  { id: 'dump-station', label: 'dump station', emoji: '🚮' },
  { id: 'other', label: 'other', emoji: '📍' },
];

const amenityOptions = [
  { id: 'wifi', label: 'WiFi', icon: 'wifi' as const },
  { id: 'water', label: 'Water', icon: 'water' as const },
  { id: 'electric', label: 'Electric', icon: 'flash' as const },
  { id: 'showers', label: 'Showers', icon: 'water' as const },
  { id: 'laundry', label: 'Laundry', icon: 'shirt' as const },
  { id: 'pets-ok', label: 'Pets OK', icon: 'paw' as const },
];

export default function CreateStopScreen() {
  const router = useRouter();
  const createStop = useMutation(api.nomadStops.create);
  const { uploadPhotos, isUploading } = usePhotoUpload();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocationSelect = (location: LocationResult) => {
    if (!name) setName(location.name);
    setAddress(location.fullName);
    if (location.coordinates) {
      setLatitude(location.coordinates.latitude);
      setLongitude(location.coordinates.longitude);
    }
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 3 - localPhotos.length,
    });

    if (!result.canceled) {
      setLocalPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 3));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a name for the stop');
      return;
    }
    if (!category) {
      Alert.alert('Missing info', 'Please select a category');
      return;
    }
    if (latitude == null || longitude == null) {
      Alert.alert('Missing info', 'Please select a location from search results');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload photos if any
      let photoUrls: string[] | undefined;
      if (localPhotos.length > 0) {
        photoUrls = await uploadPhotos(localPhotos);
      }

      await createStop({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        latitude,
        longitude,
        address: address || undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        photos: photoUrls,
      });

      Alert.alert('Stop created!', `${name} has been pinned for the community`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create stop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim() && category && latitude != null && longitude != null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 18, color: '#000' }}
        >
          pin a stop
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Location search */}
        <View className="mt-4 mb-4">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000', marginBottom: 8 }}>
            location
          </Text>
          <LocationAutocomplete
            value={address}
            enablePOI
            onSelect={handleLocationSelect}
            placeholder="search for a spot..."
          />
        </View>

        {/* Name */}
        <View className="mb-4">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000', marginBottom: 8 }}>
            name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="what's this spot called?"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 16,
              fontSize: 16,
              fontFamily: 'InstrumentSans_400Regular',
              color: '#000',
            }}
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000', marginBottom: 8 }}>
            category
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categoryOptions.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: isSelected ? '#fd6b03' : '#F3F4F6',
                  }}
                >
                  <Text style={{ fontSize: 14, marginRight: 6 }}>{cat.emoji}</Text>
                  <Text
                    style={{
                      fontFamily: 'InstrumentSans_500Medium',
                      fontSize: 13,
                      color: isSelected ? '#fff' : '#6B7280',
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000', marginBottom: 8 }}>
            description (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="share tips or details about this spot..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            textAlignVertical="top"
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 16,
              fontSize: 16,
              fontFamily: 'InstrumentSans_400Regular',
              color: '#000',
              minHeight: 100,
            }}
          />
        </View>

        {/* Amenities */}
        <View className="mb-4">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000', marginBottom: 8 }}>
            amenities (optional)
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {amenityOptions.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity.id);
              return (
                <TouchableOpacity
                  key={amenity.id}
                  onPress={() => toggleAmenity(amenity.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: isSelected ? '#10B981' : '#F3F4F6',
                  }}
                >
                  <Ionicons
                    name={amenity.icon}
                    size={14}
                    color={isSelected ? '#fff' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontFamily: 'InstrumentSans_500Medium',
                      fontSize: 13,
                      color: isSelected ? '#fff' : '#6B7280',
                    }}
                  >
                    {amenity.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Photos */}
        <View className="mb-6">
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#000', marginBottom: 8 }}>
            photos (optional)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {localPhotos.map((uri, i) => (
              <View key={i} style={{ position: 'relative' }}>
                <Image
                  source={{ uri }}
                  style={{ width: 100, height: 100, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setLocalPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {localPhotos.length < 3 && (
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                <Text style={{ fontFamily: 'InstrumentSans_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  add photo
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Submit button */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          paddingBottom: 34,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          backgroundColor: '#fff',
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting || isUploading}
          style={{
            backgroundColor: isValid ? '#fd6b03' : '#D1D5DB',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isSubmitting || isUploading ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#fff' }}>
            {isSubmitting || isUploading ? 'creating...' : 'pin this stop'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/convex/_generated/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SelectionChip } from '@/components/ui/SelectionChip';

const categories = [
  { id: 'repairs', label: 'repairs', emoji: '🔧' },
  { id: 'electrical', label: 'electrical', emoji: '⚡' },
  { id: 'build', label: 'build', emoji: '🪚' },
  { id: 'plumbing', label: 'plumbing', emoji: '🚿' },
  { id: 'other', label: 'other', emoji: '📦' },
];

export default function CreateHelpRequestScreen() {
  const router = useRouter();
  const createRequest = useMutation(api.helpRequests.create);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location is now optional
  const isValid = title.trim().length >= 5 && description.trim().length >= 10 && category;

  const pickImage = async () => {
    if (photos.length >= 4) {
      Alert.alert('Limit reached', 'You can add up to 4 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library to add photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim() ? location.trim().toLowerCase() : undefined,
        photos: photos.length > 0 ? photos : undefined,
        isUrgent,
      });

      if (result.success) {
        router.back();
      }
    } catch (error) {
      console.error('Failed to create help request:', error);
      Alert.alert('Error', 'Failed to create your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text
          className="text-lg text-black"
          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
        >
          post a request
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Title */}
        <View className="mt-6">
          <Text
            className="text-base text-gray-500 mb-2"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            what do you need help with?
          </Text>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. sunroof leaking during rain"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View className="mt-6">
          <Text
            className="text-base text-gray-500 mb-2"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            describe the issue
          </Text>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="provide details about what you need..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Category */}
        <View className="mt-6">
          <Text
            className="text-base text-gray-500 mb-3"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            category
          </Text>
          <View className="flex-row flex-wrap">
            {categories.map((cat) => (
              <SelectionChip
                key={cat.id}
                label={cat.label}
                emoji={cat.emoji}
                selected={category === cat.id}
                onPress={() => setCategory(cat.id)}
              />
            ))}
          </View>
        </View>

        {/* Photos */}
        <View className="mt-6">
          <Text
            className="text-base text-gray-500 mb-2"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            photos (optional)
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {photos.map((photo, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ uri: photo }}
                  className="w-28 h-28 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-black rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <TouchableOpacity
                onPress={pickImage}
                className="w-28 h-28 rounded-xl bg-gray-100 items-center justify-center"
                style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB' }}
              >
                <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Location */}
        <View className="mt-6">
          <Text
            className="text-base text-gray-500 mb-2"
            style={{ fontFamily: 'InstrumentSans_500Medium' }}
          >
            location (optional)
          </Text>
          <Input
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. san diego, ca"
            autoCapitalize="none"
          />
        </View>

        {/* Urgent Toggle */}
        <View className="mt-6 flex-row items-center justify-between bg-gray-50 rounded-2xl p-4">
          <View className="flex-1 mr-4">
            <Text
              className="text-black"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              mark as urgent
            </Text>
            <Text
              className="text-sm text-gray-500 mt-1"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              urgent requests get more visibility
            </Text>
          </View>
          <Switch
            value={isUrgent}
            onValueChange={setIsUrgent}
            trackColor={{ false: '#E5E7EB', true: '#fed7aa' }}
            thumbColor={isUrgent ? '#fd6b03' : '#f4f3f4'}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="px-6 pb-6 pt-4 border-t border-gray-100">
        <Button
          title={isSubmitting ? 'posting...' : 'post request'}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          variant="accent"
        />
      </View>
    </SafeAreaView>
  );
}

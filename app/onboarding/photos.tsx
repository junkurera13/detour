import { View, Text, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 24;
const GRID_GAP = 8;
const GRID_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
const SMALL_TILE_SIZE = (GRID_WIDTH - GRID_GAP * 2) / 3;
const LARGE_TILE_WIDTH = SMALL_TILE_SIZE * 2 + GRID_GAP;
const LARGE_TILE_HEIGHT = SMALL_TILE_SIZE * 2 + GRID_GAP;

export default function PhotosScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [photos, setPhotos] = useState<string[]>(data.photos);

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'permission needed',
        'please allow access to your photo library to add photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      if (index < photos.length) {
        newPhotos[index] = result.assets[0].uri;
      } else {
        newPhotos.push(result.assets[0].uri);
      }
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    updateData({ photos });
    router.push('/onboarding/instagram');
  };

  const renderPhotoSlot = (index: number, isLarge: boolean = false) => {
    const photo = photos[index];
    const size = isLarge
      ? { width: LARGE_TILE_WIDTH, height: LARGE_TILE_HEIGHT }
      : { width: SMALL_TILE_SIZE, height: SMALL_TILE_SIZE };

    return (
      <TouchableOpacity
        key={index}
        onPress={() => pickImage(index)}
        onLongPress={() => photo && removePhoto(index)}
        style={[
          size,
          {
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: photo ? 'transparent' : '#F3F4F6',
            borderWidth: photo ? 0 : 2,
            borderStyle: 'dashed',
            borderColor: '#D1D5DB',
          },
        ]}
        activeOpacity={0.7}
      >
        {photo ? (
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: photo }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => removePhoto(index)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 12,
                padding: 4,
              }}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
            {isLarge && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: 'InstrumentSans_500Medium',
                  }}
                >
                  main photo
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={isLarge ? 40 : 28} color="#9CA3AF" />
            {isLarge && (
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 14,
                  marginTop: 8,
                  fontFamily: 'InstrumentSans_500Medium',
                }}
              >
                add main photo
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <OnboardingLayout
      title="add your photos"
      subtitle="add 1-6 photos. tap to add, hold to remove."
      currentStep={8}
    >
      <View className="flex-1 pt-4">
        {/* Row 1: Large photo + 2 small stacked */}
        <View style={{ flexDirection: 'row', gap: GRID_GAP }}>
          {renderPhotoSlot(0, true)}
          <View style={{ gap: GRID_GAP }}>
            {renderPhotoSlot(1)}
            {renderPhotoSlot(2)}
          </View>
        </View>

        {/* Row 2: 3 small photos */}
        <View style={{ flexDirection: 'row', gap: GRID_GAP, marginTop: GRID_GAP }}>
          {renderPhotoSlot(3)}
          {renderPhotoSlot(4)}
          {renderPhotoSlot(5)}
        </View>

        <Text
          className="text-gray-400 text-center mt-4 text-sm"
          style={{ fontFamily: 'InstrumentSans_400Regular' }}
        >
          {photos.length}/6 photos added
        </Text>
      </View>

      <View className="pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={photos.length < 1}
        />
      </View>
    </OnboardingLayout>
  );
}

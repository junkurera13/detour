import { View, Text, TouchableOpacity, Image, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
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
  const { uploadPhotos, isUploading, progress: uploadProgress } = usePhotoUpload();

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

  const handleContinue = async () => {
    // Collect all URIs that need uploading: profile photos + rig photo + pet photos
    const allUris: string[] = [...photos];
    const rigPhotoUri = data.rigPhoto;
    const hasRigPhoto = rigPhotoUri && !rigPhotoUri.startsWith('http');
    if (hasRigPhoto) allUris.push(rigPhotoUri);

    const petPhotoIndices: number[] = [];
    data.pets.forEach((pet, i) => {
      if (pet.photo && !pet.photo.startsWith('http')) {
        petPhotoIndices.push(i);
        allUris.push(pet.photo);
      }
    });

    const hasLocalPhotos = allUris.some(
      (p) => p.startsWith('file://') || p.startsWith('ph://')
    );

    if (hasLocalPhotos) {
      try {
        const cloudUrls = await uploadPhotos(allUris);

        // Split results back
        const profileCount = photos.length;
        const profileCloudUrls = cloudUrls.slice(0, profileCount);
        let idx = profileCount;

        const rigPhotoCloud = hasRigPhoto ? cloudUrls[idx++] : data.rigPhoto;

        const updatedPets = data.pets.map((pet, i) => {
          if (petPhotoIndices.includes(i)) {
            return { ...pet, photo: cloudUrls[idx++] };
          }
          return pet;
        });

        updateData({ photos: profileCloudUrls, rigPhoto: rigPhotoCloud, pets: updatedPets });
      } catch {
        Alert.alert(
          'upload failed',
          'failed to upload your photos. please try again.'
        );
        return;
      }
    } else {
      updateData({ photos });
    }

    router.push('/onboarding/location');
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
      currentStep={12}
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
          title={isUploading ? 'uploading...' : 'continue'}
          onPress={handleContinue}
          disabled={photos.length < 1 || isUploading}
        />
      </View>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              marginHorizontal: 24,
              width: '80%',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#fd6b03" />
            <Text
              style={{
                fontFamily: 'InstrumentSans_600SemiBold',
                fontSize: 18,
                color: '#000',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              uploading photos...
            </Text>
            {uploadProgress && (
              <>
                <Text
                  style={{
                    fontFamily: 'InstrumentSans_400Regular',
                    fontSize: 14,
                    color: '#6B7280',
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {uploadProgress.current} of {uploadProgress.total}
                </Text>
                <View
                  style={{
                    marginTop: 16,
                    height: 8,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 4,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: '#fd6b03',
                      width: `${uploadProgress.percentage}%`,
                    }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </OnboardingLayout>
  );
}

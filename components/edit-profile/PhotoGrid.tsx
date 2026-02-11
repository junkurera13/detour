import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 24;
export const GRID_GAP = 8;
const GRID_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
const SMALL_TILE_SIZE = (GRID_WIDTH - GRID_GAP * 2) / 3;
const LARGE_TILE_WIDTH = SMALL_TILE_SIZE * 2 + GRID_GAP;
const LARGE_TILE_HEIGHT = SMALL_TILE_SIZE * 2 + GRID_GAP;

interface PhotoGridProps {
  photos: string[];
  onAddPhoto: (index: number) => void;
  onRemovePhoto: (index: number) => void;
}

export function PhotoGrid({ photos, onAddPhoto, onRemovePhoto }: PhotoGridProps) {
  const renderPhotoSlot = (index: number, isLarge: boolean = false) => {
    const photo = photos[index];
    const size = isLarge
      ? { width: LARGE_TILE_WIDTH, height: LARGE_TILE_HEIGHT }
      : { width: SMALL_TILE_SIZE, height: SMALL_TILE_SIZE };

    return (
      <TouchableOpacity
        key={index}
        onPress={() => onAddPhoto(index)}
        onLongPress={() => photo && onRemovePhoto(index)}
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
              onPress={() => onRemovePhoto(index)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 12,
                padding: 4,
              }}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
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
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Text
        className="text-sm text-black mb-2"
        style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
      >
        photos
      </Text>
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
    </View>
  );
}

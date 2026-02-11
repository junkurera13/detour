import { View, Text, Image, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Router } from 'expo-router';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export type ProfileViewer = {
  _id: string;
  name: string;
  photos: string[];
  viewedAt: number;
} | null;

interface ViewersModalProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  viewers: ProfileViewer[] | undefined;
  router: Router;
}

export function ViewersModal({ visible, onClose, slideAnim, viewers, router }: ViewersModalProps) {
  const dismissModal = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(onClose);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={dismissModal}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={dismissModal}
        />
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="bg-white rounded-t-3xl px-6 pb-10 pt-4"
        >
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />
          <Text
            className="text-xl text-black mb-4"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            profile viewers
          </Text>

          {viewers && viewers.length > 0 ? (
            <View>
              {viewers.map((viewer) => (
                <TouchableOpacity
                  key={viewer!._id}
                  className="flex-row items-center py-3 border-b border-gray-50"
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    slideAnim.setValue(400);
                    router.push(`/user/${viewer!._id}`);
                  }}
                >
                  {viewer!.photos.length > 0 ? (
                    <Image
                      source={{ uri: viewer!.photos[0] }}
                      className="w-12 h-12 rounded-full"
                      resizeMode="cover"
                      accessibilityLabel={`${viewer!.name} profile photo`}
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                      <Ionicons name="person" size={20} color="#9CA3AF" />
                    </View>
                  )}
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-black text-base"
                      style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                    >
                      {viewer!.name.toLowerCase()}
                    </Text>
                    <Text
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      {timeAgo(viewer!.viewedAt)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center py-8">
              <Ionicons name="eye-outline" size={40} color="#E5E7EB" />
              <Text
                className="text-gray-400 mt-3"
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              >
                no profile views yet
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

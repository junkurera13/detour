import { View, Text, Image, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Router } from 'expo-router';

export type InviteCode = {
  _id: string;
  code: string;
  isActive: boolean;
  currentUses: number;
  maxUses: number;
  createdAt: number;
  usedByUser: {
    _id: string;
    name: string;
    username: string;
    photos: string[];
  } | null;
};

interface InviteCodesModalProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  inviteCodes: InviteCode[] | undefined;
  onShareCode: (code: string) => void;
  router: Router;
}

export function InviteCodesModal({ visible, onClose, slideAnim, inviteCodes, onShareCode, router }: InviteCodesModalProps) {
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
            className="text-xl text-black mb-1"
            style={{ fontFamily: 'InstrumentSans_700Bold' }}
          >
            your invite codes
          </Text>
          <Text
            className="text-gray-500 text-sm mb-4"
            style={{ fontFamily: 'InstrumentSans_400Regular' }}
          >
            share with friends to skip the waitlist
          </Text>

          {inviteCodes?.map((invite) => (
            <View
              key={invite._id}
              className="flex-row items-center py-3 border-b border-gray-50"
            >
              <View className="flex-1">
                <Text
                  className="text-black text-base"
                  style={{ fontFamily: 'InstrumentSans_600SemiBold', letterSpacing: 1.5 }}
                >
                  {invite.code}
                </Text>
                {invite.usedByUser ? (
                  <TouchableOpacity
                    className="flex-row items-center mt-1"
                    onPress={() => {
                      Animated.timing(slideAnim, {
                        toValue: 400,
                        duration: 200,
                        useNativeDriver: true,
                      }).start(() => {
                        onClose();
                        router.push(`/user/${invite.usedByUser!._id}`);
                      });
                    }}
                  >
                    {invite.usedByUser.photos?.[0] && (
                      <Image
                        source={{ uri: invite.usedByUser.photos[0] }}
                        style={{ width: 16, height: 16, borderRadius: 8, marginRight: 4 }}
                        accessibilityLabel={`${invite.usedByUser.name || 'User'} profile photo`}
                      />
                    )}
                    <Text
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: 'InstrumentSans_400Regular' }}
                    >
                      used by {invite.usedByUser.name?.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text
                    className="text-green-500 text-sm mt-1"
                    style={{ fontFamily: 'InstrumentSans_500Medium' }}
                  >
                    available
                  </Text>
                )}
              </View>

              {!invite.usedByUser && (
                <TouchableOpacity
                  onPress={() => onShareCode(invite.code)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#FFF7ED' }}
                  accessibilityRole="button"
                  accessibilityLabel="Share invite code"
                >
                  <Ionicons name="share-outline" size={18} color="#fd6b03" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

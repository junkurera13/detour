import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

export type SettingsItem = {
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  onAction: (id: string) => void;
  settingsItems: SettingsItem[];
}

export function SettingsMenu({ visible, onClose, slideAnim, onAction, settingsItems }: SettingsMenuProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
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
                onPress={() => onAction(item.id)}
              >
                <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                  <Ionicons name={item.icon} size={20} color="#000" />
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

        </Animated.View>
      </View>
    </Modal>
  );
}

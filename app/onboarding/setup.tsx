import { View, ScrollView, TextInput, TouchableOpacity, Image, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '@/components/ui/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { SelectionChip } from '@/components/ui/SelectionChip';
import { useOnboarding } from '@/context/OnboardingContext';

const setupOptions = [
  { id: 'converted-van', label: 'converted van', emoji: '🚐' },
  { id: 'suv-car', label: 'suv / car', emoji: '🚗' },
  { id: 'truck-camper', label: 'truck camper', emoji: '🛻' },
  { id: 'rv-motorhome', label: 'rv / motorhome', emoji: '🏕️' },
  { id: 'trailer', label: 'trailer', emoji: '🏠' },
  { id: 'bike-motorcycle', label: 'bike / motorcycle', emoji: '🏍️' },
  { id: 'on-foot', label: 'on foot', emoji: '🥾' },
  { id: 'boat-sailboat', label: 'boat / sailboat', emoji: '⛵' },
  { id: 'no-vehicle', label: 'no vehicle', emoji: '✈️' },
];

export default function SetupScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string>(data.rigType);
  const [rigName, setRigName] = useState(data.rigName);
  const [rigPhoto, setRigPhoto] = useState(data.rigPhoto);

  const handleSelect = (id: string) => {
    setSelected(id === selected ? '' : id);
  };

  const pickRigPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('permission needed', 'please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setRigPhoto(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    updateData({ rigType: selected, rigName: rigName.trim(), rigPhoto });
    router.push('/onboarding/pets');
  };

  return (
    <OnboardingLayout
      title="what's your setup?"
      subtitle="select your ride"
      currentStep={8}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <View className="flex-row flex-wrap">
            {setupOptions.map((option) => (
              <SelectionChip
                key={option.id}
                label={option.label}
                emoji={option.emoji}
                selected={selected === option.id}
                onPress={() => handleSelect(option.id)}
              />
            ))}
          </View>

          {selected && (
            <View className="mt-6">
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-5 text-base text-black"
                placeholder="rig name (optional)"
                placeholderTextColor="#9CA3AF"
                value={rigName}
                onChangeText={setRigName}
                maxLength={30}
                style={{ fontFamily: 'InstrumentSans_400Regular' }}
              />

              {/* Rig photo picker */}
              <TouchableOpacity
                onPress={pickRigPhoto}
                activeOpacity={0.7}
                style={{
                  marginTop: 16,
                  borderRadius: 16,
                  overflow: 'hidden',
                  aspectRatio: 16 / 9,
                  backgroundColor: rigPhoto ? 'transparent' : '#F3F4F6',
                  borderWidth: rigPhoto ? 0 : 2,
                  borderStyle: 'dashed',
                  borderColor: '#D1D5DB',
                }}
              >
                {rigPhoto ? (
                  <View style={{ flex: 1 }}>
                    <Image
                      source={{ uri: rigPhoto }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setRigPhoto('')}
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
                  </View>
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                    <Text
                      style={{
                        color: '#9CA3AF',
                        fontSize: 14,
                        marginTop: 6,
                        fontFamily: 'InstrumentSans_400Regular',
                      }}
                    >
                      add a photo (optional)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="pt-6 pb-8">
        <Button
          title="continue"
          onPress={handleContinue}
          disabled={!selected}
        />
      </View>
    </OnboardingLayout>
  );
}
